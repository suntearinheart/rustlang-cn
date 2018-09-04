# 生命周期

当我们有一个获取引用作为参数的函数，我们可以隐式或显式涉及到引用的生命周期：

```rust
fn main() {
  let a = 100_i32;
  {
     let x = &a;
  }  // x 作用域结束
  println!("{}", x);
}
```

编译时，我们会看到一个严重的错误提示：

> error: unresolved name `x`.

错误的意思是“无法解析 `x` 标识符”，也就是找不到 `x` , 这是因为像很多编程语言一样，Rust中也存在作用域概念，当资源离开离开作用域后，资源的内存就会被释放回收，当借用/引用离开作用域后也会被销毁，所以 `x` 在离开自己的作用域后，无法在作用域之外访问。

上面的涉及到几个概念：

* **Owner**: 资源的所有者 `a`
* **Borrower**: 资源的借用者 `x`
* **Scope**: 作用域，资源被借用/引用的有效期

## 隐式Lifetime

我们经常会遇到参数或者返回值为引用类型的函数：

```rust
fn foo(x: &str) -> &str {
   x
}
```

实际上，上面函数包含该了隐性的生命周期命名，这是由编译器自动推导的，相当于：

```rust
fn foo<'a>(x: &'a str) -> &'a str {
    x
}
```

在这里，约束返回值的Lifetime必须大于或等于参数`x`的Lifetime。下面函数写法也是合法的：

```rust
fn foo<'a>(x: &'a str) -> &'a str {
   "hello, world!"
}
```

为什么呢？这是因为字符串"hello, world!"的类型是`&'static str`，我们知道`static`类型的Lifetime是整个程序的运行周期，所以她比任意传入的参数的Lifetime`'a`都要长，即`'static >= 'a`满足。

## 显式Lifetime

```rust
fn foo(x: &str, y: &str) -> &str {
    if true {
       x
    } else {
       y
    }
}
```

这时候再编译，就没那么幸运了：

```rust
error: missing lifetime specifier [E0106]
fn foo(x: &str, y: &str) -> &str {
                            ^~~~
```

编译器告诉我们，需要我们显式指定Lifetime标识符，因为这个时候，编译器无法推导出返回值的Lifetime应该是比 `x`长，还是比`y`长。虽然我们在函数中中用了 `if true` 确认一定可以返回`x`，但是要知道，编译器是在编译时候检查，而不是运行时，所以编译期间会同时检查所有的输入参数和返回值。

修复后的代码如下：

```rust
fn foo<'a>(x: &'a str, y: &'a str) -> &'a str {
    if true {
       x
    } else {
       y
    }
}
```

## Lifetime推导

要推导Lifetime是否合法，先明确两点：

* 输出值（也称为返回值）依赖哪些输入值
* 输入值的Lifetime大于或等于输出值的Lifetime (准确来说：子集，而不是大于或等于)

**Lifetime推导公式：**
当输出值R依赖输入值X Y Z ...，当且仅当输出值的Lifetime为所有输入值的Lifetime交集的子集时，生命周期合法。

```rust
    Lifetime(R) ⊆ ( Lifetime(X) ∩ Lifetime(Y) ∩ Lifetime(Z) ∩ Lifetime(...) )
```

对于例子1：

```rust
fn foo<'a>(x: &'a str, y: &'a str) -> &'a str {
    if true {
       x
    } else {
       y
    }
}
```

因为返回值同时依赖输入参数`x`和`y`，所以

```rust
    Lifetime(返回值) ⊆ ( Lifetime(x) ∩ Lifetime(y) )

    即：

   'a ⊆ ('a ∩ 'a)  // 成立
```

### 多个Lifetime

那我们继续看个更复杂的例子，定义多个Lifetime标识符：

```rust
fn foo<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
    if true {
       x
    } else {
       y
    }
}
```

先看下编译，又报错了：

```rust
<anon>:5:3: 5:4 error: cannot infer an appropriate lifetime for automatic coercion due to conflicting requirements [E0495]
<anon>:5        y
                ^
<anon>:1:1: 7:2 help: consider using an explicit lifetime parameter as shown: fn foo<'a>(x: &'a str, y: &'a str) -> &'a str
<anon>:1 fn bar<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
<anon>:2   if true {
<anon>:3      x
<anon>:4   } else {
<anon>:5      y
<anon>:6   }
```

编译器说自己无法正确地推导返回值的Lifetime，读者可能会疑问，“我们不是已经指定返回值的Lifetime为`'a`了吗？"。

这儿我们同样可以通过生命周期推导公式推导：

因为返回值同时依赖`x`和`y`，所以

```rust
    Lifetime(返回值) ⊆ ( Lifetime(x) ∩ Lifetime(y) )

    即：

    'a ⊆ ('a ∩ 'b)  //不成立
```

很显然，上面我们根本没法保证成立。

所以，这种情况下，我们可以显式地告诉编译器`'b`比`'a`长（`'a`是`'b`的子集），只需要在定义Lifetime的时候, 在`'b`的后面加上`: 'a`, 意思是`'b`比`'a`长，`'a`是`'b`的子集:

```rust
fn foo<'a, 'b: 'a>(x: &'a str, y: &'b str) -> &'a str {
    if true {
       x
    } else {
       y
    }
}
```

这里我们根据公式继续推导：

```rust
    条件：Lifetime(x) ⊆ Lifetime(y)
    推导：Lifetime(返回值) ⊆ ( Lifetime(x) ∩ Lifetime(y) )

    即：

    条件： 'a ⊆ 'b
    推导：'a ⊆ ('a ∩ 'b) // 成立
```

上面是成立的，所以可以编译通过。

#### 推导总结

通过上面的学习相信大家可以很轻松完成Lifetime的推导，总之，记住两点：

1. 输出值依赖哪些输入值。
2. 推导公式。

## 'static

`static`的作用域是特殊的。它代表某样东西具有横跨整个程序的生命周期。大部分 Rust 程序员当他们处理字符串时第一次遇到`'static`：

```rust
let x: &'static str = "Hello, world.";
```

基本字符串是`&'static str`类型的因为它的引用一直有效：它们被写入了最终库文件的数据段。另一个例子是全局量：

```rust
static FOO: i32 = 5;
let x: &'static i32 = &FOO;
```

它在二进制文件的数据段中保存了一个`i32`，而`x`是它的一个引用。

## in struct

上面我们更多讨论了函数中Lifetime的应用，在`struct`中Lifetime同样重要。

我们来定义一个`Person`结构体：

```rust
struct Foo<'a> {
    x: &'a i32,
}

fn main() {
    let y = &5; // this is the same as `let _y = 5; let y = &_y;`
    let f = Foo { x: y };

    println!("{}", f.x);
}
```

`struct`可以有多个Lifetime参数用来约束不同的`field`，实际的Lifetime应该是所有`field`Lifetime交集的子集。例如：

```rust
fn main() {
    let x = 20_u8;
    let stormgbs = Person {
        age: &x,
    };
}
```

这里，生命周期/Scope的示意图如下：

```rust
                  {   x    stormgbs      *     }
所有者 x:              |________________________|
所有者 stormgbs:                |_______________|  'a
借用者 stormgbs.age:            |_______________|  stormgbs.age = &x
```

既然`<'a>`作为`Person`的泛型参数，所以在为`Person`实现方法时也需要加上`<'a>`

## 函数签名中的生命周期

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

## `impl`块

让我们在`Foo`中实现一个方法：

```rust
struct Foo<'a> {
    x: &'a i32,
}

impl<'a> Foo<'a> {
    fn x(&self) -> &'a i32 { self.x }
}

fn main() {
    let y = &5; // this is the same as `let _y = 5; let y = &_y;`
    let f = Foo { x: y };

    println!("x is: {}", f.x());
}
```

如你所见，我们需要在`impl`行为`Foo`声明一个生命周期。我们重复了`'a`两次，就像在函数中：`impl<'a>`定义了一个生命周期`'a`，而`Foo<'a>`使用它。

### **输出依赖了多个输入**

```rust
impl<'a, 'b> Person<'a> {
    fn get_max_age(&'a self, p: &'a Person) -> &'a u8 {
        if self.age > p.age {
           self.age
       } else {
           p.age
       }
    }
}
```

类似之前的Lifetime推导章节，当返回值（借用）依赖多个输入值时，需显示声明Lifetime。和函数Lifetime同理。

## 泛型类型参数，trait bounds和生命周期

```rust
use std::fmt::Display;

fn longest_with_an_announcement<'a, T>(x: &'a str, y: &'a str, ann: T) -> &'a str
    where T: Display
{
    println!("Announcement! {}", ann);
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

## 理解作用域

理解生命周期的一个办法是想象一个引用有效的作用域。例如：

```rust
fn main() {
    let y = &5;     // -+ y goes into scope
                    //  |
    // stuff        //  |
                    //  |
}                   // -+ y goes out of scope
```

加入我们的`Foo`：

```rust
struct Foo<'a> {
    x: &'a i32,
}

fn main() {
    let y = &5;           // -+ y goes into scope
    let f = Foo { x: y }; // -+ f goes into scope
    // stuff              //  |
                          //  |
}                         // -+ f and y go out of scope
```

我们的`f`生存在`y`的作用域之中，所以一切正常。那么如果不是呢？下面的代码不能工作：

```rust
struct Foo<'a> {
    x: &'a i32,
}

fn main() {
    let x;                    // -+ x goes into scope
                              //  |
    {                         //  |
        let y = &5;           // ---+ y goes into scope
        let f = Foo { x: y }; // ---+ f goes into scope
        x = &f.x;             //  | | error here
    }                         // ---+ f and y go out of scope
                              //  |
    println!("{}", x);        //  |
}                             // -+ x goes out of scope
```

噢！就像你在这里看到的一样，`f`和`y`的作用域小于`x`的作用域。不过当我们尝试`x = &f.x`时，我们让`x`引用一些将要离开作用域的变量。

命名作用域用来赋予作用域一个名字。有了名字是我们可以谈论它的第一步。

## 生命周期隐式

Rust支持强大的在函数体中的局部类型推断，不过这在项签名中是禁止的以便允许只通过项签名本身推导出类型。

```rust
fn foo<'a>(bar: &'a str)
```

这个有一个输出生命周期：

```rust
fn foo<'a>() -> &'a str
```

这个两者皆有：

```rust
fn foo<'a>(bar: &'a str) -> &'a str
```

## 函数中的隐式生命周期

为了使公共模式更符合人体工程学，可以在函数项，函数指针和闭包特征签名中隐式生命周期参数。 以下规则用于推断省生命周期隐式的生命周期隐式参数。 忽略无法推断的生命周期参数是错误的。 占位符生命周期'_，也可用于以相同方式推断生命周期。 对于路径中的生命周期，使用'_是首选。 特质对象的生命周期遵循下面讨论的不同规则。

* 参数中的每个隐式的生命周期隐式变为不同的生命周期隐式参数。
* 如果参数中只使用了一个生命周期隐式（隐式或未使用），则将该生命周期隐式分配给所有隐式的输出生命周期隐式。
  
在方法签名中，还有另一个规则

* 如果接收器具有类型`＆Self`或`＆mut Self`，则将对Self的引用的生命周期分配给所有隐式的输出生命周期参数。

```rust
fn print(s: &str);                                      // elided
fn print(s: &'_ str);                                   // also elided
fn print<'a>(s: &'a str);                               // expanded

fn debug(lvl: usize, s: &str);                          // elided
fn debug<'a>(lvl: usize, s: &'a str);                   // expanded

fn substr(s: &str, until: usize) -> &str;               // elided
fn substr<'a>(s: &'a str, until: usize) -> &'a str;     // expanded

fn get_str() -> &str;                                   // ILLEGAL

fn frob(s: &str, t: &str) -> &str;                      // ILLEGAL

fn get_mut(&mut self) -> &mut T;                        // elided
fn get_mut<'a>(&'a mut self) -> &'a mut T;              // expanded

fn args<T: ToCStr>(&mut self, args: &[T]) -> &mut Command;                  // elided
fn args<'a, 'b, T: ToCStr>(&'a mut self, args: &'b [T]) -> &'a mut Command; // expanded

fn new(buf: &mut [u8]) -> BufWriter<'_>;                // elided - preferred
fn new(buf: &mut [u8]) -> BufWriter;                    // elided
fn new<'a>(buf: &'a mut [u8]) -> BufWriter<'a>;         // expanded

type FunPtr = fn(&str) -> &str;                         // elided
type FunPtr = for<'a> fn(&'a str) -> &'a str;           // expanded

type FunTrait = dyn Fn(&str) -> &str;                   // elided
type FunTrait = dyn for<'a> Fn(&'a str) -> &'a str;     // expanded
```

## 默认trait object的生命周期

`trait object`所持有的引用的假定生命周期称为其默认对象生命周期制。这些在RFC 599中定义并在RFC 1156中进行了修改。

当完全省略生命周期时，将使用这些默认对象生命周期，而不是上面定义的生命周期参数省略规则。如果'_用作生命周期绑定，则绑定遵循通常的省略规则。

如果trait对象用作泛型类型的类型参数，则首先使用包含类型来尝试推断绑定。

* 如果包含类型存在唯一绑定，那么这是默认值
* 如果包含的类型有多个绑定，则必须指定显式绑定
  
如果这些规则都不适用，则使用特征的边界：

* 如果使用单个生命周期绑定定义特征，则使用该边界。
* 如果'static用于任何生命周期，那么'使用静态。
* 如果特征没有生命周期边界，则生命周期在表达式中推断，并且在表达式之外是静态的。

```rust
trait Foo { }

// These two are the same as Box<T> has no lifetime bound on T
Box<dyn Foo>
Box<dyn Foo + 'static>

// ...and so are these:
impl dyn Foo {}
impl dyn Foo + 'static {}

// ...so are these, because &'a T requires T: 'a
&'a dyn Foo
&'a (dyn Foo + 'a)

// std::cell::Ref<'a, T> also requires T: 'a, so these are the same
std::cell::Ref<'a, dyn Foo>
std::cell::Ref<'a, dyn Foo + 'a>

// This is an error:
struct TwoBounds<'a, 'b, T: ?Sized + 'a + 'b>
TwoBounds<'a, 'b, dyn Foo> // Error: the lifetime bound for this object type
                           // cannot be deduced from context
```

请注意，最里面的对象设置了边界，因此`＆'a Box <dyn Foo>`仍然是`＆'box <dyn Foo +'static>`。

```rust
// For the following trait...
trait Bar<'a>: 'a { }

// ...these two are the same:
Box<dyn Bar<'a>>
Box<dyn Bar<'a> + 'a>

// ...and so are these:
impl<'a> dyn Foo<'a> {}
impl<'a> dyn Foo<'a> + 'a {}

// This is still an error:
struct TwoBounds<'a, 'b, T: ?Sized + 'a + 'b>
TwoBounds<'a, 'b, dyn Foo<'c>>
```

## `'static` 生命周期

除非指定显式生存期，否则引用类型的常量和静态声明都具有隐式的“静态生命周期”。 因此，涉及“静态以上”的常量声明可以在没有生命周期的情况下编写。

```rust
// STRING: &'static str
const STRING: &str = "bitstring";

struct BitsNStrings<'a> {
    mybits: [u32; 2],
    mystring: &'a str,
}

// BITS_N_STRINGS: BitsNStrings<'static>
const BITS_N_STRINGS: BitsNStrings<'_> = BitsNStrings {
    mybits: [1, 2],
    mystring: STRING,
};
```

请注意，如果`static`或`const`项包括函数或闭包引用（它们本身包含引用），编译器将首先尝试标准省略规则。 如果它无法按照通常的规则解决生命周期，那么它就会出错。 举例来说：

```rust
// Resolved as `fn<'a>(&'a str) -> &'a str`.
const RESOLVED_SINGLE: fn(&str) -> &str = ..

// Resolved as `Fn<'a, 'b, 'c>(&'a Foo, &'b Bar, &'c Baz) -> usize`.
const RESOLVED_MULTIPLE: &dyn Fn(&Foo, &Bar, &Baz) -> usize = ..

// There is insufficient information to bound the return reference lifetime
// relative to the argument lifetimes, so this is an error.
const RESOLVED_STATIC: &dyn Fn(&Foo, &Bar) -> &Baz = ..
```

## 高级生命周期

我们将看看我们尚未涉及的三个生命周期的高级功能：

* 终身子类型：确保一个生命周期超过另一个生命周期
* 生命周期边界：指定对泛型类型的引用的生命周期
* `trait object`生命周期的推断：允许编译器推断`trait object`的生命周期以及何时需要指定它们

### 使用终身子类型确保一个终身超过另一个终身

生命周期子类型指定一个生命周期应该超过另一个生命周期。 要探索生命周期子类型，想象一下我们想要编写一个解析器。 我们将使用一个名为Context的结构来保存对我们正在解析的字符串的引用。 我们将编写一个解析器来解析此字符串并返回成功或失败。 解析器需要借用Context来进行解析。 实现这个解析器代码，除了代码没有所需的生存期注释，因此它不会编译。

```rust
struct Context(&str);

struct Parser {
    context: &Context,
}

impl Parser {
    fn parse(&self) -> Result<(), &str> {
        Err(&self.context.0[1..])
    }
}
```

编译代码会导致错误，因为Rust期望Context中字符串切片上的生命周期参数以及Parser中Context的引用。

为简单起见，parse函数返回`Result <（），＆str>`。也就是说，该函数在成功时将不执行任何操作，并且在失败时将返回未正确解析的字符串切片部分。真正的实现将提供更多错误信息，并在解析成功时返回结构化数据类型。我们不会讨论这些细节，因为它们与此示例的生命周期部分无关。

为了简化这段代码，我们不会编写任何解析逻辑。但是，很可能在解析逻辑中的某个地方我们会通过返回引用无效输入部分的错误来处理无效输入;这个引用使代码示例在生命周期中变得有趣。让我们假装解析器的逻辑是第一个字节后输入无效。请注意，如果第一个字节不在有效字符边界上，则此代码可能会发生混乱。再一次，我们正在简化示例，专注于所涉及的生命周期。

要使此代码进行编译，我们需要在Context中填充字符串切片的生命周期参数，并在Parser中填充Context的引用。最直接的方法是在任何地方使用相同的生命周期名称，如清单19-13所示。回想一下第10章中“结构定义中的生命周期注释”一节，`struct Context<'a>`，`struct Parser <'a>`和`impl <'a>`中的每一个都声明了一个新的生命周期参数。虽然它们的名称恰好相同，但此示例中声明的三个生命周期参数不相关。

```rust
struct Context<'a>(&'a str);

struct Parser<'a> {
    context: &'a Context<'a>,
}

impl<'a> Parser<'a> {
    fn parse(&self) -> Result<(), &str> {
        Err(&self.context.0[1..])
    }
}
```

这段代码编译得很好。 它告诉Rust，Parser持有对生命周期为a的Context的引用，并且Context持有一个字符串切片，该切片也与Parser中的Context的引用一样长。 Rust的编译器错误消息表明这些引用需要生命周期参数，我们现在已经添加了生命周期参数。

接下来，我们将添加一个接受Context实例的函数，使用Parser解析该上下文，并返回解析返回的内容。 这段代码不太有效。

```rust
fn parse_context(context: Context) -> Result<(), &str> {
    Parser { context: &context }.parse()
}
```

```rust
error[E0597]: borrowed value does not live long enough
  --> src/lib.rs:14:5
   |
14 |     Parser { context: &context }.parse()
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ does not live long enough
15 | }
   | - temporary value only lives until here
   |
note: borrowed value must be valid for the anonymous lifetime #1 defined on the function body at 13:1...
  --> src/lib.rs:13:1
   |
13 | / fn parse_context(context: Context) -> Result<(), &str> {
14 | |     Parser { context: &context }.parse()
15 | | }
   | |_^

error[E0597]: `context` does not live long enough
  --> src/lib.rs:14:24
   |
14 |     Parser { context: &context }.parse()
   |                        ^^^^^^^ does not live long enough
15 | }
   | - borrowed value only lives until here
   |
note: borrowed value must be valid for the anonymous lifetime #1 defined on the function body at 13:1...
  --> src/lib.rs:13:1
   |
13 | / fn parse_context(context: Context) -> Result<(), &str> {
14 | |     Parser { context: &context }.parse()
15 | | }
   | |_^
```

这些错误表明创建的Parser实例和上下文参数仅在parse_context函数结束时生效。 但它们都需要在功能的整个生命周期中存活。

换句话说，解析器和上下文需要比整个函数生命周期隐式更长并且在函数启动之前以及在它结束之后有效，以使该代码中的所有引用始终有效。 我们正在创建的解析器和上下文参数在函数末尾超出范围，因为parse_context取得了上下文的所有权。

为了弄清楚为什么会出现这些错误，让我们再看一下定义，特别是parse方法签名中的引用：

```rust
fn parse(&self) -> Result<(), &str> {
```

```rust
fn parse<'a>(&'a self) -> Result<(), &'a str> {
```

也就是说，parse返回值的错误部分具有与Parser实例的生命周期相关的生命周期（解析方法签名中的＆self的生命周期）。这是有道理的：返回的字符串切片引用解析器持有的Context实例中的字符串切片，并且Parser结构的定义指定Context的引用的生命周期和Context保存的字符串切片的生存期应该是相同。

问题是parse_context函数返回从parse返回的值，因此parse_context的返回值的生命周期也与Parser的生命周期相关联。但是在parse_context函数中创建的Parser实例不会超过函数的结尾（它是临时的），并且上下文将超出函数末尾的范围（parse_context获取它的所有权）。

Rust认为我们正在尝试返回对函数末尾超出范围的值的引用，因为我们使用相同的生命周期参数注释了所有生命周期。注释告诉Rust，Context保存的字符串切片的生命周期与Parser持有的Context的生命周期相同。

parse_context函数无法在parse函数中看到，返回的字符串切片将比Context和Parser更长，并且引用parse_context返回引用的是字符串切片，而不是Context或Parser。

通过了解解析的实现，我们知道解析的返回值与Parser实例相关联的唯一原因是它引用了Parser实例的Context，它引用了字符串切片。 所以，它实际上是parse_context需要关注的字符串切片的生命周期。 我们需要一种方法告诉Rust，Context中的字符串切片和Parser中Context的引用具有不同的生命周期，并且parse_context的返回值与Context中字符串切片的生命周期相关联。

首先，我们将尝试给出Parser和Context不同的生命周期参数，. 我们将使用`'s`和`'c`作为生命周期参数名称来阐明哪个生命周期与Context中的字符串切片一起使用，哪个生命周期与Parser中的Context相关。 请注意，此解决方案不能完全解决问题，但这是一个开始。 我们将在尝试编译时查看为什么此修复不够。

```rust
struct Context<'s>(&'s str);

struct Parser<'c, 's> {
    context: &'c Context<'s>,
}

impl<'c, 's> Parser<'c, 's> {
    fn parse(&self) -> Result<(), &'s str> {
        Err(&self.context.0[1..])
    }
}

fn parse_context(context: Context) -> Result<(), &str> {
    Parser { context: &context }.parse()
}
```

我们注释它们的所有相同位置都注释了引用的生命周期。 但是这次我们使用不同的参数，具体取决于引用是使用字符串切片还是使用Context。 我们还在parse的返回值的字符串切片部分添加了一个注释，以指示它与Context中字符串切片的生命周期一致。

当我们尝试编译时，我们收到以下错误：

```rust
error[E0491]: in type `&'c Context<'s>`, reference has a longer lifetime than the data it references
 --> src/lib.rs:4:5
  |
4 |     context: &'c Context<'s>,
  |     ^^^^^^^^^^^^^^^^^^^^^^^^
  |
note: the pointer is valid for the lifetime 'c as defined on the struct at 3:1
 --> src/lib.rs:3:1
  |
3 | / struct Parser<'c, 's> {
4 | |     context: &'c Context<'s>,
5 | | }
  | |_^
note: but the referenced data is only valid for the lifetime 's as defined on the struct at 3:1
 --> src/lib.rs:3:1
  |
3 | / struct Parser<'c, 's> {
4 | |     context: &'c Context<'s>,
5 | | }
  | |_^
```

Rust不知道`'c`和`'s`之间有任何关系。 为了有效，需要约束Context中带有`'s`生命周期的引用数据，以保证它的生命周期隐式比生命周期`'c`的引用长。 如果`'s`不长于`'c`，则对Context的引用可能无效。

现在我们到达本节的要点：Rust特征生命周期子类型指定一个生命周期参数至少与另一个生命周期参数一样长。 在我们声明生命周期参数的尖括号中，我们可以像往常一样声明一个生命周期`'a`，并声明一个生命周期`'b`，它至少与`'a`一样长，使用语法`'b`：`'a`来声明`'b`。

在我们对Parser的定义中，假设`'a`（字符串切片的生命周期）保证至少与`'c`（对Context的引用的生命周期）一样长，我们将生命周期声明更改为如下所示：

```rust
struct Parser<'c, 's: 'c> {
    context: &'c Context<'s>,
}
```

现在，在Parser中对Context的引用和Context中对字符串切片的引用具有不同的生命周期; 我们已经确保字符串切片的生命周期长于对Context的引用。

这是一个非常冗长的例子，但正如我们在本章开头所提到的，Rust的高级功能非常具体。 您不会经常需要我们在此示例中描述的语法，但在这种情况下，您将知道如何引用某些内容并为其提供必要的生命周期。

## 关于泛型类型的生命周期界限

我们讨论了在泛型类型上使用特征边界。 我们还可以添加生命周期参数作为泛型类型的约束; 这些被称为生命周期隐式边界。 生命周期边界帮助Rust验证泛型类型中的引用不会比它们引用的数据更长。

考虑一个类型，它是引用的包装器。 回想一下`RefCell <T>`类型：它`的`borrow`和`borrow_mut`方法分别返回`Ref`和`RefMut`类型。 这些类型是在运行时跟踪借用规则的引用的包装器。`Ref`结构的定义，现在没有生命周期限制。

```rust
struct Ref<'a, T>(&'a T);
```

如果没有明确地约束与通用参数`T`相关的生命周期`'a`，Rust将会出错，因为它不知道通用类型`T`将存在多长时间：

```rust
error[E0309]: the parameter type `T` may not live long enough
 --> src/lib.rs:1:19
  |
1 | struct Ref<'a, T>(&'a T);
  |                   ^^^^^^
  |
  = help: consider adding an explicit lifetime bound `T: 'a`...
note: ...so that the reference type `&'a T` does not outlive the data it points at
 --> src/lib.rs:1:19
  |
1 | struct Ref<'a, T>(&'a T);
  |                   ^^^^^^
```

因为T可以是任何类型，所以T可以是引用或包含一个或多个引用的类型，每个引用都可以有自己的生命周期。 Rust不能确定T会像`'a`一样长寿。

```rust
struct Ref<'a, T: 'a>(&'a T);
```

此代码现在编译，因为`T：'a`语法指定T可以是任何类型，但如果它包含任何引用，则引用必须至少与`'a`一样长。

我们可以用不同的方式解决这个问题，如`StaticRef`结构的定义所示，通过在`T`上添加`'static`生命周期绑定。这意味着如果`T`包含任何引用，它们必须具有`'static`生命周期。

```rust
struct StaticRef<T: 'static>(&'static T);
```

因为`'static`意味着引用必须与整个程序一样长，所以不包含引用的类型符合所有引用的标准，只要整个程序（因为没有引用）。 对于关注生命足够长的引用的借用检查器，没有引用的类型和具有永久存在的引用的类型之间没有真正的区别：两者对于确定引用的生命周期是否短于 它指的是。

## trait对象生命周期的推断

我们讨论了trait对象，它由引用后面的trait组成，允许我们使用动态分派。 我们还没有讨论如果在trait对象中实现特征的类型具有自己的生命周期会发生什么。 考虑我们有一个特征`Red`和一个`struct Ball`。`Ball`结构包含一个引用（因此具有一个生命周期参数），并且还实现了trait`Red`。 我们想使用`Ball`的实例作为`trait object``Box <dyn Red>`。

```rust
trait Red { }

struct Ball<'a> {
    diameter: &'a i32,
}

impl<'a> Red for Ball<'a> { }

fn main() {
    let num = 5;

    let obj = Box::new(Ball { diameter: &num }) as Box<dyn Red>;
}
```

这段代码编译没有任何错误，即使我们没有明确注释`obj`中涉及的生命周期。此代码有效，因为有使用生命周期和`trait object`的规则：

* trait对象的默认生命`周期是`'static`.
* 使用`＆'a Trait`或`＆'mut Trait`，trait对象的默认生命周期是`'a`。
* 使用单个`T：'a`子句，`trait object`的默认生命周期为`'a`。
* 有多个子句如`T：'a`，没有默认的生命周期;我们必须明确。
 
当我们必须明确时，我们可以使用语法`Box <dyn Red +'static>`或`Box <dyn Red +'a>`在`Box <dyn Red>`等`trait object`上添加生命周期绑定，具体取决于参考是否适用于整个计划与否。与其他边界一样，添加生命周期边界的语法意味着在该类型中具有引用的`Red`特征的任何实现者必须具有在`trait object`边界中指定的相同生命周期作为那些引用。