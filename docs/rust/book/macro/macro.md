# 宏

 Rust 的函数不能接受任意多个参数，函数是不能操作语法单元的，即把语法元素作为参数进行操作，从而生成代码，例如 `mod`, `crate` 这些是 Rust 内置的关键词，是不可能直接用函数去操作这些的，而宏就有这个能力。相比函数，宏是用来生成代码的，在调用宏的地方，编译器会先将宏进行展开，生成代码，然后再编译展开后的代码。

宏在调用之前需要先定义，而 Rust 函数则可以定义在函数调用后面。宏定义格式是： `macro_rules! macro_name { macro_body }`，其中 `macro_body` 与模式匹配很像， `pattern => do_something` ，所以 Rust 的宏又称为 Macro by example (基于例子的宏)。其中 `pattern` 和 `do_something` 都是用配对的括号括起来的，括号可以是圆括号、方括号、花括号中的任意一种。匹配可以有多个分支，每个分支以分号结束。

```rust
macro_rules! create_function {
    ($func_name:ident) => (
        fn $func_name() {
            println!("function {:?} is called", stringify!($func_name))
        }
    )
}

fn main() {
    create_function!(foo);
    foo();
}

```

上面这个简单的例子是用来创建函数，生成的函数可以像普通函数一样调用，这个函数可以打印自己的名字。编译器在看到 `create_function!(foo)` 时会从前面去找一个叫 `create_function` 的宏定义，找到之后，就会尝试将参数 `foo` 代入 `macro_body`，对每一条模式按顺序进行匹配，只要有一个匹配上，就会将 `=>` 左边定义的参数代入右边进行替换，如果替换不成功，编译器就会报错而不会往下继续匹配，替换成功就会将右边替换后的代码放在宏调用的地方。这个例子中只有一个模式，即 `$func_name:ident`，表示匹配一个标识符，如果匹配上就把这个标识符赋值给 `$func_name`，宏定义里面的变量都是以 `$` 开头的，相应的类型也是以冒号分隔说明，这里 `ident` 是变量 `$func_name` 的类型，表示这个变量是一个 `identifier`，这是语法层面的类型(designator)，而普通的类型如 `char, &str, i32, f64` 这些是语义层面的类型。在 `main` 函数中传给宏调用 `create_function` 的参数 `foo` 正好是一个标识符(`ident`)，所以能匹配上，`$func_name` 就等于 `foo`，然后把 `$func_name` 的值代入 `=>` 右边，成了下面这样的

```rust
fn foo() {
    println!("function {:?} is called", stringify!(foo))
}
```

所以最后编译器编译的实际代码是

```rust
fn main() {
    fn foo() {
        println!("function {:?} is called", stringify!(foo))
    }
    foo();
}
```

上面定义了 `create_function` 这个宏之后，就可以随便用来生成函数了，比如调用 `create_function!(bar)` 就得到了一个名为 `bar` 的函数

通过上面这个例子，大家对宏应该有一个大致的了解了。下面就具体谈谈宏的各个组成部分。

## 匹配

宏通过一系列*规则*定义，它们是模式匹配的分支。上面我们有：

```rust
( $( $x:expr ),* ) => { ... };
```

这就像一个`match`表达式分支，不过匹配发生在编译时Rust的语法树中。最后一个分支（这里只有一个分支）的分号是可选的。`=>`左侧的“模式”叫*匹配器*（*matcher*）。它有[自己的语法](http://doc.rust-lang.org/reference.html#macros)。

`$x:expr`匹配器将会匹配任何Rust表达式，把它的语法树绑定到元变量`$x`上。`expr`标识符是一个*片段分类符*（*fragment specifier*）。匹配器写在`$(...)`中，`*`会匹配0个或多个表达式，表达式之间用逗号分隔。

除了特殊的匹配器语法，任何出现在匹配器中的Rust标记必须完全相符。例如：

```rust
macro_rules! foo {
    (x => $e:expr) => (println!("mode X: {}", $e));
    (y => $e:expr) => (println!("mode Y: {}", $e));
}

fn main() {
    foo!(y => 3);
}
```

将会打印：

```text
mode Y: 3
```

而这个：

```rust
foo!(z => 3);
```

我们会得到编译错误：

```text
error: no rules expected the token `z`
```

## 展开

宏规则的右边是正常的Rust语法，大部分是。不过我们可以拼接一些匹配器中的语法。例如最开始的例子：

```rust
$(
    temp_vec.push($x);
)*
```

每个匹配的`$x`表达式都会在宏展开中产生一个单独`push`语句。展开中的重复与匹配器中的重复“同步”进行（稍后介绍更多）。

因为`$x`已经在表达式匹配中声明了，我们并不在右侧重复`:expr`。另外，我们并不将用来分隔的逗号作为重复操作的一部分。相反，我们在重复块中使用一个结束用的分号。

另一个细节：`vec!`宏的右侧有*两对*大括号。它们经常像这样结合起来：

```rust
macro_rules! foo {
    () => {{
        ...
    }}
}
```

外层的大括号是`macro_rules!`语法的一部分。事实上，你也可以`()`或者`[]`。它们只是用来界定整个右侧结构的。

内层大括号是展开语法的一部分。记住，`vec!`在表达式上下文中使用。要写一个包含多个语句，包括`let`绑定，的表达式，我们需要使用块。如果你的宏只展开一个单独的表达式，你不需要内层的大括号。

注意我们从未*声明*宏产生一个表达式。事实上，直到宏被展开之前我们都无法知道。足够小心的话，你可以编写一个能在多个上下文中展开的宏。例如，一个数据类型的简写可以作为一个表达式或一个模式。

## 重复

宏相比函数一个很大的不同是宏可以接受任意多个参数，例如 `println!` 和 `vec!`。这是怎么做到的呢？

没错，就是重复(repetition)，所谓模式匹配说通俗点就是代码长的样子，而不用深入了解每个元素具体是什么含义。所以模式的重复不是通过程序里面的循环(for/while)去控制的，而是指定了两个特殊符号 `+` 和 `*`，类似于正则表达式，因为正则表达式也是不关心具体匹配对象是一个人名还是一个国家名。与正则表达式一样， `+` 表示一次或多次（至少一次），而 `*` 表示零次或多次。重复的模式需要用括号括起来，外面再加上 `$`，例如 `$(...)*`, `$(...)+`。需要说明的是这里的括号和宏里面其它地方一样都可以是三种括号中的任意一种，因为括号在这里仅仅是用来标记一个模式的开始和结束，大部分情况重复的模式是用逗号或分号分隔的，所以你会经常看到 `$(...),*`, `$(...);*`, `$(...),+`, `$(...);+` 这样的用来表示重复。

还是来看一个例子

```rust
macro_rules! vector {
    ($($x:expr),*) => {
        {
            let mut temp_vec = Vec::new();
            $(temp_vec.push($x);)*
            temp_vec
       }
    };
}

fn main() {
    let a = vector![1, 2, 4, 8];
    println!("{:?}", a);
}
```

这个例子初看起来比较复杂，我们来分析一下。

首先看 `=>` 左边，最外层是圆括号，前面说过这个括号可以是圆括号、方括号、花括号中的任意一种，只要是配对的就行。然后再看括号里面 `$(...),*` 正是刚才提到的重复模式，重复的模式是用逗号分隔的，重复的内容是 `$x:expr`，即可以匹配零次或多次用逗号分隔的表达式，例如 `vector![]` 和 `vector![3, x*x, s-t]` 都可以匹配成功。

接着看 `=>` 右边，最外层也是一个括号，末尾是分号表示这个分支结束。里面是花括号包起来的代码块，最后一行没有分号，说明这个 macro 的值是一个表达式，`temp_vec` 作为表达式的值返回。第一条语句就是普通的用 `Vec::new()` 生成一个空 vector，然后绑定到可变的变量 `temp_vec` 上面，第二句比较特殊，跟 `=>` 左边差不多，也是用来表示重复的模式，而且是跟左边是一一对应的，即左边匹配到一个表达式(`expr`)，这里就会将匹配到的表达式用在 `temp_vec.push($x);` 里面，所以 `vector![3, x*x, s-t]` 调用就会展开成

```rust
{
    let mut temp_vec = Vec::new();
    temp_vec.push(3);
    temp_vec.push(x*x);
    temp_vec.push(s-t);
    temp_vec
}
```

重复运算符遵循两个原则：

1. `$(...)*`对它包含的所有`$name`都执行“一层”重复
2. 每个`$name`必须有至少这么多的`$(...)*`与其相对。如果多了，它将是多余的。

这个巴洛克宏展示了外层重复中多余的变量。

```rust
macro_rules! o_O {
    (
        $(
            $x:expr; [ $( $y:expr ),* ]
        );*
    ) => {
        &[ $($( $x + $y ),*),* ]
    }
}

fn main() {
    let a: &[i32]
        = o_O!(10; [1, 2, 3];
               20; [4, 5, 6]);

    assert_eq!(a, [11, 12, 13, 24, 25, 26]);
}
```

这就是匹配器的大部分语法。这些例子使用了`$(...)*`，它指“0次或多次”匹配。另外你可以用`$(...)+`代表“1次或多次”匹配。每种形式都可以包括一个分隔符，分隔符可以使用任何除了`+`和`*`的符号。

## 卫生（Hygiene）

[卫生宏系统](http://en.wikipedia.org/wiki/Hygienic_macro)。每个宏展开都在一个不同的*语法上下文*（*syntax context*）中，并且每个变量在引入的时候都在语法上下文中打了标记。这就好像是`main`中的`state`和宏中的`state`被画成了不同的“颜色”，所以它们不会冲突。
编译器或运行时会保证宏里面定义的变量或函数不会与外面的冲突，在宏里面以普通方式定义的变量作用域不会跑到宏外面。

```rust
macro_rules! foo {
    () => (let x = 3);
}

macro_rules! bar {
    ($v:ident) => (let $v = 3);
}

fn main() {
    foo!();
    println!("{}", x);
    bar!(a);
    println!("{}", a);
}
```

上面代码中宏 `foo!` 里面的变量 `x` 是按普通方式定义的，所以其作用域限定在宏里面，宏调用结束后再引用 `x` 编译器就会报错。要想让宏里面定义的变量在宏调用结束后仍然有效，需要按 `bar!` 里面那样定义。不过对于 `item` 规则就有些不同，例如函数在宏里面以普通方式定义后，宏调用之后，这个函数依然可用，下面代码就可以正常编译。

```rust
macro_rules! foo {
    () => (fn x() { });
}

fn main() {
    foo!();
    x();
}
```

## 递归宏

宏还支持递归，即在宏定义时调用其自身，类似于递归函数。一个宏展开中可以包含更多的宏，包括被展开的宏自身。这种宏对处理树形结构输入时很有用的，正如这这个（简化了的）HTML简写所展示的那样：

```rust
# #![allow(unused_must_use)]
macro_rules! write_html {
    ($w:expr, ) => (());

    ($w:expr, $e:tt) => (write!($w, "{}", $e));

    ($w:expr, $tag:ident [ $($inner:tt)* ] $($rest:tt)*) => {{
        write!($w, "<{}>", stringify!($tag));
        write_html!($w, $($inner)*);
        write!($w, "</{}>", stringify!($tag));
        write_html!($w, $($rest)*);
    }};
}

fn main() {
#   // FIXME(#21826)
    use std::fmt::Write;
    let mut out = String::new();

    write_html!(&mut out,
        html[
            head[title["Macros guide"]]
            body[h1["Macros are the best!"]]
        ]);

    assert_eq!(out,
        "<html><head><title>Macros guide</title></head>\
         <body><h1>Macros are the best!</h1></body></html>");
}
```

因为宏本身是一种模式匹配，而模式匹配里面包含递归则是函数式语言里面最常见的写法了，有函数式编程经验的对这个应该很熟悉。下面看一个简单的例子：

```rust
macro_rules! find_min {
    ($x:expr) => ($x);
    ($x:expr, $($y:expr),+) => (
        std::cmp::min($x, find_min!($($y),+))
    )
}

fn main() {
    println!("{}", find_min!(1u32));
    println!("{}", find_min!(1u32 + 2 , 2u32));
    println!("{}", find_min!(5u32, 2u32 * 3, 4u32));
}
```

因为模式匹配是按分支顺序匹配的，一旦匹配成功就不会再往下进行匹配（即使后面也能匹配上），所以模式匹配中的递归都是在第一个分支里写最简单情况，越往下包含的情况越多。这里也是一样，第一个分支 `($x:expr)` 只匹配一个表达式，第二个分支匹配两个或两个以上表达式，注意加号表示匹配一个或多个，然后里面是用标准库中的 `min` 比较两个数的大小，第一个表达式和剩余表达式中最小的一个，其中剩余表达式中最小的一个是递归调用 `find_min!` 宏，与递归函数一样，每次递归都是从上往下匹配，只到匹配到基本情况。我们来写写 `find_min!(5u32, 2u32 * 3, 4u32)` 宏展开过程

1. `std::cmp::min(5u32, find_min!(2u32 * 3, 4u32))`
2. `std::cmp::min(5u32, std::cmp::min(2u32 * 3, find_min!(4u32)))`
3. `std::cmp::min(5u32, std::cmp::min(2u32 * 3, 4u32))`

## 调试宏代码

运行`rustc --pretty expanded`来查看宏展开后的结果。输出表现为一个完整的包装箱，所以你可以把它反馈给`rustc`，它会有时会比原版产生更好的错误信息。注意如果在同一作用域中有多个相同名字（不过在不同的语法上下文中）的变量的话`--pretty expanded`的输出可能会有不同的意义。这种情况下`--pretty expanded,hygiene`将会告诉你有关语法上下文的信息。

`rustc`提供两种语法扩展来帮助调试宏。目前为止，它们是不稳定的并且需要功能入口（feature gates）。
* `log_syntax!(...)`会打印它的参数到标准输出，在编译时，并且不“展开”任何东西。
* `trace_macros!(true)`每当一个宏被展开时会启用一个编译器信息。在展开后使用`trace_macros!(false)`来关闭它。

## 句法要求

即使Rust代码中含有未展开的宏，它也可以被解析为一个完整的[语法树](7.Glossary 词汇表.md#abstract-syntax-tree)。这个属性对于编辑器或其它处理代码的工具来说十分有用。这里也有一些关于Rust宏系统设计的推论。

一个推论是Rust必须确定，当它解析一个宏展开时，宏是否代替了

* 0个或多个项
* 0个或多个方法
* 一个表达式
* 一个语句
* 一个模式

一个块中的宏展开代表一些项，或者一个表达式/语句。Rust使用一个简单的规则来解决这些二义性。一个代表项的宏展开必须是

* 用大括号界定的，例如`foo! { ... }`
* 分号结尾的，例如`foo!(...);`

另一个展开前解析的推论是宏展开必须包含有效的Rust记号。更进一步，括号，中括号，大括号在宏展开中必须是封闭的。例如，`foo!([)`是不允许的。这让Rust知道宏何时结束。

更正式一点，宏展开体必须是一个*记号树*（*token trees*）的序列。一个记号树是一系列递归的

* 一个由`()`，`[]`或`{}`包围的记号树序列
* 任何其它单个记号

在一个匹配器中，每一个元变量都有一个*片段分类符*（*fragment specifier*），确定它匹配的哪种句法。

* `ident`：一个标识符。例如：`x`，`foo`
* `path`：一个受限的名字。例如：`T::SpecialA`
* `expr`：一个表达式。例如：`2 + 2`；`if true then { 1 } else { 2 }`；`f(42)`
* `ty`：一个类型。例如：`i32`；`Vec<(char, String)>`；`&T`
* `pat`：一个模式。例如：`Some(t)`；`(17, 'a')`；`_`
* `stmt`：一个单独语句。例如：`let x = 3`
* `block`：一个大括号界定的语句序列。例如：`{ log(error, "hi"); return 12; }`
* `item`：一个[项](http://doc.rust-lang.org/stable/reference.html#items)。例如：`fn foo() { }`，`struct Bar`
* `meta`：一个“元数据项”，可以在属性中找到。例如：`cfg(target_os = "windows")`
* `tt`：一个单独的记号树
* lifetime: 生命周期，如 'static, 'a.

对于一个元变量后面的一个记号有一些额外的规则：

* `expr`变量必须后跟一个`=>`，`,`，`;`
* `ty`和`path`变量必须后跟一个`=>`，`,`，`:`，`=`，`>`，`as`
* `pat`变量必须后跟一个`=>`，`,`，`=`
* 其它变量可以后跟任何记号

这些规则为Rust语法提供了一些灵活性以便将来的展开不会破坏现有的宏。

宏系统完全不处理解析模糊。例如，`$($t:ty)* $e:expr`语法总是会解析失败，因为解析器会被强制在解析`$t`和解析`$e`之间做出选择。改变展开在它们之前分别加上一个记号可以解决这个问题。在这个例子中，你可以写成`$(T $t:ty)* E $e:exp`。

## 范围和宏导入/导出

宏在编译的早期阶段被展开，在命名解析之前。这有一个缺点是与语言中其它结构相比，范围对宏的作用不一样。

定义和展开都发生在同一个深度优先、字典顺序的包装箱的代码遍历中。那么在模块范围内定义的宏对同模块的接下来的代码是可见的，这包括任何接下来的子`mod`项。

一个定义在`fn`函数体内的宏，或者任何其它不在模块范围内的地方，只在它的范围内可见。宏导入导出用 #[macro_use] 和 #[macro_export]。父模块中定义的宏对其下的子模块是可见的，要想子模块中定义的宏在其后面的父模块中可用，需要使用 #[macro_use]。

如果一个模块有`macro_use`属性，它的宏在子`mod`项之后的父模块也是可见的。如果它的父模块也有`macro_use`属性那么在父`mod`项之后的祖父模块中也是可见的，以此类推。

`macro_use`属性也可以出现在`extern crate`处。在这个上下文中它控制那些宏从外部包装箱中装载，例如

```rust
#[macro_use(foo, bar)]
extern crate baz;
```

如果属性只是简单的写成`#[macro_use]`，所有的宏都会被装载。如果没有`#[macro_use]`属性那么没有宏被装载。只有被定义为`#[macro_export]`的宏可能被装载。

装载一个包装箱的宏*而不*链接到输出，使用`#[no_link]`。

一个例子：

```rust
macro_rules! m1 { () => (()) }

// 宏 m1 在这里可用

mod foo {
    // 宏 m1 在这里可用

    #[macro_export]
    macro_rules! m2 { () => (()) }

    // 宏 m1 和 m2 在这里可用
}

// 宏 m1 在这里可用
#[macro_export]
macro_rules! m3 { () => (()) }

// 宏 m1 和 m3 在这里可用

#[macro_use]
mod bar {
    // 宏 m1 和 m3 在这里可用

    macro_rules! m4 { () => (()) }

    // 宏 m1, m3, m4 在这里均可用
}

// 宏 m1, m3, m4 均可用
# fn main() { }
```

crate 之间只有被标为 `#[macro_export]` 的宏可以被其它 crate 导入。假设上面例子是 `foo` crate 中的部分代码，则只有 `m2` 和 `m3` 可以被其它 crate 导入。导入方式是在 `extern crate foo;` 前面加上 `#[macro_use]`

```rust
#[macro_use]
extern crate foo;
// foo 中 m2, m3 都被导入
```

如果只想导入 `foo` crate 中某个宏，比如 `m3`，就给 `#[macro_use]` 加上参数

```rust
#[macro_use(m3)]
extern crate foo;
// foo 中只有 m3 被导入
```

## `$crate`变量

当一个宏在多个包装箱中使用时会产生另一个困难。来看`mylib`定义了

```rust
pub fn increment(x: u32) -> u32 {
    x + 1
}

#[macro_export]
macro_rules! inc_a {
    ($x:expr) => ( ::increment($x) )
}

#[macro_export]
macro_rules! inc_b {
    ($x:expr) => ( ::mylib::increment($x) )
}
# fn main() { }
```

`inc_a`只能在`mylib`内工作，同时`inc_b`只能在库外工作。进一步说，如果用户有另一个名字导入`mylib`时`inc_b`将不能工作。

Rust（目前）还没有针对包装箱引用的卫生系统，不过它确实提供了一个解决这个问题的变通方法。当从一个叫`foo`的包装箱总导入宏时，特殊宏变量`$crate`会展开为`::foo`。相反，当这个宏在同一包装箱内定义和使用时，`$crate`将展开为空。这意味着我们可以写

```rust
#[macro_export]
macro_rules! inc {
    ($x:expr) => ( $crate::increment($x) )
}
# fn main() { }
```

来定义一个可以在库内外都能用的宏。这个函数名字会展开为`::increment`或`::mylib::increment`。

为了保证这个系统简单和正确，`#[macro_use] extern crate ...`应只出现在你包装箱的根中，而不是在`mod`中。这保证了`$crate`展开为一个单独的标识符。

## 深入

之前的介绍章节提到了递归宏，但并没有给出完整的介绍。还有一个原因令递归宏是有用的：每一次递归都给你匹配宏参数的机会。

作为一个极端的例子，可以，但极端不推荐，用Rust宏系统来实现一个[位循环标记](http://esolangs.org/wiki/Bitwise_Cyclic_Tag)自动机。\<a name="1"></a>

```rust
macro_rules! bct {
    // cmd 0:  d ... => ...
    (0, $($ps:tt),* ; $_d:tt)
        => (bct!($($ps),*, 0 ; ));
    (0, $($ps:tt),* ; $_d:tt, $($ds:tt),*)
        => (bct!($($ps),*, 0 ; $($ds),*));

    // cmd 1p:  1 ... => 1 ... p
    (1, $p:tt, $($ps:tt),* ; 1)
        => (bct!($($ps),*, 1, $p ; 1, $p));
    (1, $p:tt, $($ps:tt),* ; 1, $($ds:tt),*)
        => (bct!($($ps),*, 1, $p ; 1, $($ds),*, $p));

    // cmd 1p:  0 ... => 0 ...
    (1, $p:tt, $($ps:tt),* ; $($ds:tt),*)
        => (bct!($($ps),*, 1, $p ; $($ds),*));

    // halt on empty data string
    ( $($ps:tt),* ; )
        => (());
}
```

## 常用宏（Common macros）

这里有一些你会在Rust代码中看到的常用宏。

### `panic!`

这个宏导致当前线程恐慌。你可以传给这个宏一个信息通过：

```rust
panic!("oh no!");
```

### `vec!`

`vec!`的应用遍及本书，所以你可能已经见过它了。它方便创建`Vec<T>`：

```rust
let v = vec![1, 2, 3, 4, 5];
```

它也让你可以用重复值创建vector。例如，100个`0`：

```rust
let v = vec![0; 100];
```

### `assert!`和`assert_eq!`

这两个宏用在测试中。`assert!`获取一个布尔值，而`assert_eq!`获取两个值并比较它们。`true` 就通过，`false`就`panic!`。像这样：

```rust
// A-ok!

assert!(true);
assert_eq!(5, 3 + 2);

// nope :(

assert!(5 < 3);
assert_eq!(5, 3);
```

### `try!`

`try!`用来进行错误处理。它获取一些可以返回`Result<T, E>`的数据，并返回`T`如果它是`Ok<T>`，或`return`一个`Err(E)`如果出错了。像这样：

```rust
use std::fs::File;

fn foo() -> std::io::Result<()> {
    let f = try!(File::create("foo.txt"));

    Ok(())
}
```

它比这么写要更简明：

```rust
use std::fs::File;

fn foo() -> std::io::Result<()> {
    let f = File::create("foo.txt");

    let f = match f {
        Ok(t) => t,
        Err(e) => return Err(e),
    };

    Ok(())
}
```

### `unreachable!`

这个宏用于当你认为一些代码不应该被执行的时候：

```rust
if false {
    unreachable!();
}
```

有时，编译器可能会让你编写一个你认为将永远不会执行的不同分支。在这个例子中，用这个宏，这样如果最终你错了，你会为此得到一个`panic!`。

```rust
let x: Option<i32> = None;

match x {
    Some(_) => unreachable!(),
    None => println!("I know x is None!"),
}
```

### `unimplemented!`

`unimplemented!`宏可以被用来当你尝试去让你的函数通过类型检查，同时你又不想操心去写函数体的时候。一个这种情况的例子是实现一个要求多个方法的特性，而你只想一次搞定一个。用`unimplemented!`定义其它的直到你准备好去写它们了。

## 宏程序（Procedural macros）

如果Rust宏系统不能做你想要的，你可能想要写一个[编译器插件](Compiler Plugins 编译器插件.md)。与`macro_rules!`宏相比，它能做更多的事，接口也更不稳定，并且bug将更难以追踪。相反你得到了可以在编译器中运行任意Rust代码的灵活性。为此语法扩展插件有时被称为*宏程序*（*procedural macros*）。

---
[^实际上]: `vec!`在 libcollections 中的实际定义跟这里的表现并不相同，出于效率和复用的考虑。
