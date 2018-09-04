# 常量-变量

## 一：常量：`const`

声明常量使用 const 关键字而不是 let,常量可以在任何作用域声明,常量只能用于常量表达式.

```rust
const N: i32 = 5;         // 你必须标注一个`const`的类型。
```

const：常量在整个程序生命周期中都有效，这使得常量可以作为多处代码使用的全局范围的值。

## 二：静态变量：`static`

全局变量在 Rust 中被称为 静态（static）变量。Rust 确实支持他们，不过对于 Rust 的所有权规则来说是有问题的。如果有两个线程访问相同的可变全局变量，则可能会造成数据竞争。

```rust
static N: i32 = 5;        // 你必须标注一个`static`的类型
static NAME: &'static str = "Steve";
```

常量与不可变静态变量可能看起来很类似。区别是静态变量中的值有一个固定的内存地址。使用这个值总是会访问相同的地址。常量则允许在任何被用到的时候复制其数据。静态变量只能储存拥有 'static 生命周期的引用，这意味着 Rust 编译器可以自己计算出其生命周期而无需显式标注。访问不可变静态变量是安全的。常量与静态变量的另一个区别在于静态变量可以是可变的。此时访问和修改可变静态变量都是 不安全 的。

使用 mut 关键来指定可变性，访问和改变一个`static mut`是不安全（unsafe）的，因此必须在`unsafe`块中操作，拥有多个线程访问时则可能导致数据竞争：

```rust
static mut N: i32 = 5;
unsafe {
    N += 1;
    println!("N: {}", N);
}
```

拥有可以全局访问的可变数据，难以保证不存在数据竞争，这就是为何 Rust 认为可变静态变量是不安全的。任何可能的情况，请优先使用并发技术和线程安全智能指针，这样编译器就能检测不同线程间的数据访问是安全的。更进一步，任何存储在`static`的类型必须实现`Sync`。

## 初始化

`const`和`static`都要求赋予它们一个值。它们只能被赋予一个常量表达式的值。换句话说，你不能用一个函数调用的返回值或任何相似的复合值或在运行时赋值。

## 选择用哪个

几乎所有时候，如果你可以在两者之间选择，选择`const`。实际上你很少需要你的常量关联一个内存位置，而且使用常量允许你不止在在自己的包装箱还可以在下游包装箱中使用像常数扩散这样的优化。

## 三：变量和绑定

Rust 程序用*变量绑定*将一些值绑定到一个名字上，可以在之后使用。`let`被用来声明一个绑定，像这样：

```rust
fn main() {
    let x = 5;
}
```

## 模式（Patterns）

`let`表达式的左侧是一个“模式”，这意味着我们可以这样写：

```rust
let (x, y) = (1, 2);
```

在这个表达式被计算后，`x`将会是1，而`y`将会是2.模式非常强大。

## 类型注解

Rust 是一个静态类型语言，这意味着我们需要先确定我们需要的类型。Rust有一个叫做*类型推断*的功能。如果它能确认这是什么类型，Rust 不需要你明确地指出来。我们也可以加上类型。类型写在一个冒号（`:`）后面：

```rust
let x: i32 = 5;   // “`x`被绑定为`i32`类型，它的值是`5`”
```

## 初始化绑定

Rust 变量绑定有另一个不同于其它语言的方面：允许先声明变量然后再初始化，但在使用它之前必须初始化。

让我们尝试一下。将你的`src/main.rs`修改为为如下：

```rust
fn main() {
    let x: i32;

    println!("Hello world!");
}
```

你可以用`cargo build`命令去构建它。它依然会输出“Hello, world!”，不过你会得到一个警告：

```text
   Compiling hello_world v0.0.1 (file:///home/you/projects/hello_world)
src/main.rs:2:9: 2:10 warning: unused variable: `x`, #[warn(unused_variable)] on by default
src/main.rs:2     let x: i32;
                      ^
```

Rust 警告我们从未使用过这个变量绑定，但是因为我们从未用过它。然而，如果你确实想使用`x`，事情就不一样了。让我们试一下。修改代码如下：

```rust
fn main() {
    let x: i32;

    println!("The value of x is: {}", x);
}
```

然后尝试构建它。你会得到一个错误：

```bash
$ cargo build
   Compiling hello_world v0.0.1 (file:///home/you/projects/hello_world)
src/main.rs:4:39: 4:40 error: use of possibly uninitialized variable: `x`
src/main.rs:4     println!("The value of x is: {}", x);
                                                    ^
note: in expansion of format_args!
<std macros>:2:23: 2:77 note: expansion site
<std macros>:1:1: 3:2 note: in expansion of println!
src/main.rs:4:5: 4:42 note: expansion site
error: aborting due to previous error
Could not compile `hello_world`.
```

Rust 是不会让我们使用一个没有经过初始化的值的。

如果你输出的字符串中包含一对大括号（`{}`，Rust将把它解释为插入值的请求。

只写了大括号，Rust 会尝试检查值的类型来显示一个有意义的值。如果你想指定详细的语法，有[很多选项可供选择](http://doc.rust-lang.org/std/fmt/)。现在，让我们保持默认格式，整数并不难打印。

## 作用域和隐藏

变量绑定有一个作用域 - 他们被限制只能在他们被定义的块中存在。一个块是一个被`{`和`}`包围的语句集合。函数定义也是块！在下面的例子中我们定义了两个变量绑定，`x`和`y`，他们位于不同的作用域中。`x`可以在`fn main() {}`块中被访问，而`y`只能在内部块内访问：

```rust
fn main() {
    let x: i32 = 17;
    {
        let y: i32 = 3;
        println!("The value of x is {} and value of y is {}", x, y);
    }
    println!("The value of x is {} and value of y is {}", x, y); // This won't work
}
```

第一个`println!`将会打印“The value of x is 17 and the value of y is 3”，不过这个并不能编译成功，因为第二个`println!`并不能访问`y`的值，因为它已不在作用域中。相反我们得到如下错误：

```bash
$ cargo build
   Compiling hello v0.1.0 (file:///home/you/projects/hello_world)
main.rs:7:62: 7:63 error: unresolved name `y`. Did you mean `x`? [E0425]
main.rs:7     println!("The value of x is {} and value of y is {}", x, y); // This won't work
                                                                       ^
note: in expansion of format_args!
<std macros>:2:25: 2:56 note: expansion site
<std macros>:1:1: 2:62 note: in expansion of print!
<std macros>:3:1: 3:54 note: expansion site
<std macros>:1:1: 3:58 note: in expansion of println!
main.rs:7:5: 7:65 note: expansion site
main.rs:7:62: 7:63 help: run `rustc --explain E0425` to see a detailed explanation
error: aborting due to previous error
Could not compile `hello`.

To learn more, run the command again with --verbose.
```

另外，变量可以被隐藏。这意味着一个后声明的并位于同一作用域的相同名字的变量绑定将会覆盖前一个变量绑定：

```rust
let x: i32 = 8;
{
    println!("{}", x); // Prints "8"
    let x = 12;
    println!("{}", x); // Prints "12"
}
println!("{}", x); // Prints "8"
let x =  42;
println!("{}", x); // Prints "42"
```

隐藏和可变绑定可能作为同一枚硬币的两面出现，不过他们是两个并不总是能交替使用的不同的概念。作为其中之一，隐藏允许我们重绑定一个值为不同的类型。它也可以改变一个绑定的可变性：

```rust
let mut x: i32 = 1;
x = 7;
let x = x; // x is now immutable and is bound to 7

let y = 4;
let y = "I can also be bound to text!"; // y is now of a different type
```

### 可变性

绑定默认是*不可变的*（*immutable*）。下面的代码将不能编译：

```rust
let x = 5;
x = 10;
```

它会给你如下错误：

```text
error: re-assignment of immutable variable `x`
     x = 10;
     ^~~~~~~
```

我们可以使用`mut`关键字来引入可变性：

```rust
let mut x = 5;

x = 6; // no problem!
```

当一个绑定是可变的，它意味着你可以改变它指向的内容。所以在上面的例子中，`x`的值并没有多大的变化，不过这个绑定从一个`i32`变成了另外一个。

如果你想改变绑定指向的东西，你将会需要一个可变引用:

```rust
let mut x = 5;
let y = &mut x;
```

`y`是一个（指向）可变引用的不可变绑定，它意味着你不能把`y`与其它变量绑定（`y = &mut z`），不过你可以改变`y`绑定变量的值（`*y = 5`）。一个微妙的区别。

当然，如果你想它们都可变：

```rust
let mut x = 5;
let mut y = &mut x;
```

现在`y`可以绑定到另外一个值，并且它引用的值也可以改变。

很重要的一点是`mut`是模式的一部分，所以你可以这样做：

```rust
let (mut x, y) = (5, 6);

fn foo(mut x: i32) {
# }
```

## 内部可变性-外部可变性

然而，当我们谈到Rust中什么是“不可变”的时候，它并不意味着它不能被改变：我们说它有“外部可变性”。例如，考虑下[`Arc<T>`](http://doc.rust-lang.org/nightly/std/sync/struct.Arc.html)：

```rust
use std::sync::Arc;

let x = Arc::new(5);
let y = x.clone();
```

当我们调用`clone()`时，`Arc<T>`需要更新引用计数。以为你并未使用任何`mut`，`x`是一个不可变绑定，并且我们也没有取得`&mut 5`或者什么。

为了解释这些，我们不得不回到Rust指导哲学的核心，内存安全，和Rust用以保证它的机制，所有权系统和借用规则.

> 你可能有这两种类型借用的其中一个，但不同同时拥有：
> * 0个或N个对一个资源的引用（`&T`）
> * 正好1个可变引用（`&mut T`）

这就是是“不可变性”的真正定义：当有两个引用指向同一事物是安全的吗？在`Arc<T>`的情况下，是安全的：改变完全包含在结构自身内部。它并不面向用户。为此，它用`clone()`分配`&T`。如果分配`&mut T`的话，这将会是一个问题。

其它类型，像[std::cell](http://doc.rust-lang.org/std/cell/)模块中的这一个，则有相反的属性：内部可变性。例如：

```rust
use std::cell::RefCell;

let x = RefCell::new(42);

let y = x.borrow_mut();
```

`RefCell`使用`borrow_mut()`方法来分配它内部资源的`&mut`引用。这很危险，如果我们：

```rust
use std::cell::RefCell;

let x = RefCell::new(42);

let y = x.borrow_mut();
let z = x.borrow_mut();
# (y, z);
```

事实上这会在运行时引起恐慌。这是`RefCell`如何工作的：它在运行时强制使用Rust的借用规则，并且如果有违反就会`panic!`。这让我们绕开了Rust可变性规则。

## 字段级别可变性

可变性是一个不是借用（`&mut`）就是绑定的属性（`&mut`）。这意味着，例如，你不能拥有一个一些字段可变而一些字段不可变的结构体：

```rust
struct Point {
    x: i32,
    mut y: i32, // nope
}
```

结构体的可变性位于它的绑定上：

```rust
struct Point {
    x: i32,
    y: i32,
}

let mut a = Point { x: 5, y: 6 };

a.x = 10;

let b = Point { x: 5, y: 6};

b.x = 10; // error: cannot assign to immutable field `b.x`
```

然而，通过使用`Cell<T>`，你可以模拟字段级别的可变性：

```rust
use std::cell::Cell;

struct Point {
    x: i32,
    y: Cell<i32>,
}

let point = Point { x: 5, y: Cell::new(6) };

point.y.set(7);

println!("y: {:?}", point.y);
```

这会打印`y: Cell { value: 7 }`。我们成功的更新了`y`。
