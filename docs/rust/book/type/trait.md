# Trait

`trait`告诉Rust编译器特定类型具有的功能，并且可以与其他类型共享。 我们可以使用`trait`以抽象的方式定义共享行为。 我们可以使用`trait bounds`来指定泛型可以是具有特定行为的任何类型。。

## 定义 trait

类型的行为crate括我们可以在该类型上调用的方法。 如果我们可以在所有这些类型上调用相同的方法，则不同类型共享相同的行为。 trait定义是一种将方法签名组合在一起以定义实现某些目的所必需的一组行为的方法。

src/lib.rs

```rust
pub trait Summary {
    fn summarize(&self) -> String;
}
```

trait可以在其主体中具有多个方法：方法签名每行列出一个，每行以分号结尾。

## Auto traits

`Send`，`Syn`c，`UnwindSafe`和`RefUnwindSafe`特征是Auto traits。Auto traits具有特殊属性。

如果没有为给定类型的Auto traits写出显式实现或否定实现，则编译器将根据以下规则自动实现它：

* &T, &mut T, *const T, *mut T, [T; n] and [T] implement the trait if T does.
* Function item types and function pointers automatically implement the trait.
* Structs, enums, unions and tuples implement the trait if all of their fields do.
* Closures implement the trait if the types of all of their captures do. A closure that captures a T by shared reference and a U by value implements any auto traits that both &T and U do.

对于泛型类型（将上面的内置类型计为T上的泛型），如果可以使用泛型实现，则编译器不会自动为可以使用该实现的类型实现它，除非它们不满足必需的特征边界。例如，标准库实现`Send` for all`＆T`，其中T是Sync;这意味着如果T是Send而不是Sync，编译器将不会实现`Send` for`＆T`。

Auto traits也可能有否定实现，在标准库文档中显示为`impl !AutoTrait for T`，它会覆盖自动实现。例如，`* mut T`具有Send的否定实现，因此`* mut T`不是`Send`，即使T是。目前还没有稳定的方法来指定其他否定实现;它们只存在于标准库中。

Auto traits可以作为任何特征对象的附加边界添加，即使通常只允许一个特征。例如，`Box <dyn Debug + Send + UnwindSafe>`是有效类型。

## 为类型实现 trait

```rust
pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }
}

pub struct Tweet {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub retweet: bool,
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}

```

在类型上实现trait类似于实现常规方法。 不同之处在于，在`impl`之后，我们放置了我们想要实现的trait名称，然后使用`for`关键字，然后指定我们想要实现trait的类型的名称。 在`impl`块中，我们放置了trait定义已定义的方法签名。 我们不使用每个签名后添加分号，而是使用大括号，并使用我们希望trait的方法对特定类型具有的特定行为填充方法主体。

在实现trait之后，我们可以像调用常规方法一样调用`NewsArticle`和`Tweet`实例上的方法，如下所示：

```rust
let tweet = Tweet {
    username: String::from("horse_ebooks"),
    content: String::from("of course, as you probably already know, people"),
    reply: false,
    retweet: false,
};

println!("1 new tweet: {}", tweet.summarize());
```

这会打印出 `1 new tweet: horse_ebooks: of course, as you probably already know, people`。

注意:只有当trait或类型是我们的crate的本地时，我们才能在类型上实现trait。例如，我们可以在自定义类型（如Tweet）上实现标准库trait，例如`Display`作为crate功能的一部分，因为类型`Tweet`是我们crate的本地类型。我们还可以在crate中实现`Vec <T>`上的`Summary`，因为`Summary`trait在我们的crate的本地。

但我们无法在外部类型上实现外部trait。例如，我们无法在crate中的`Vec <T>`上实现显示trait，因为`Display`和`Vec <T>`在标准库中定义，并且不是我们的crate的本地。此限制是称为一致性的程序属性的一部分，更具体地说是孤立规则，因为父类型不存在而命名。此规则可确保其他人的代码不会破坏您的代码，反之亦然。如果没有规则，两个crate可以为同一类型实现相同的特性，Rust不知道要使用哪个实现。

## 默认实现

对于trai中的部分或全部方法具有默认行为是有用的，而不是要求对每种类型的所有方法实现。 然后，当我们在特定类型上实现trai时，我们可以保留或覆盖每个方法的默认行为。

```rust
pub trait Summary {
    fn summarize(&self) -> String {
        String::from("(Read more...)")
    }
}
```

要使用默认实现来汇总NewsArticle的实例而不是定义自定义实现，我们使用`impl Summary for NewsArticle {}`指定一个空的impl块。即使我们不再直接在NewsArticle上定义`summarize`方法，我们也提供了一个默认实现，并指定`NewsArticle`实现`Summary`trait。 因此，我们仍然可以在`NewsArticle`的实例上调用`summarize`方法：

```rust
let article = NewsArticle {
    headline: String::from("Penguins win the Stanley Cup Championship!"),
    location: String::from("Pittsburgh, PA, USA"),
    author: String::from("Iceburgh"),
    content: String::from("The Pittsburgh Penguins once again are the best
    hockey team in the NHL."),
};

println!("New article available! {}", article.summarize());
```

### Trait作为参数

我们在类型`NewsArticle`和`Tweet`上实现了`Summary`trait。 我们可以定义一个notify函数，它在其参数项上调用`summarize`方法，该参数项是某种实现`Summary`trait的类型。 为此，我们可以使用`impl Trait`语法，如下所示：

```rust
pub fn notify(item: impl Summary) {
    println!("Breaking news! {}", item.summarize());
}
```

在notify中，我们可以调用来自`Summary`trait的item上的任何方法，如`summarize`。

## Trait Bounds


`impl Trait`语法适用于简短示例，是更长形式('Trait Bounds')的语法糖：

```rust
pub fn notify<T: Summary>(item: T) {
    println!("Breaking news! {}", item.summarize());
}
```

虽然impl Trait对于较短的例子很好，但是对于更复杂的trait，`Trait Bounds`是很好的。 假设我们想要实现`Summary`的两件事：

```rust
pub fn notify(item1: impl Summary, item2: impl Summary) {
pub fn notify<T: Summary>(item1: T, item2: T) {

```

 `Trait Bounds`的版本更容易一些。 通常您应该使用使您的代码最容易理解的形式。

### 多个trait bounds *

可以使用+语法在泛型类型上指定多个trait边界。 例如要在函数中使用类型T的`display`格式以及`summarize`方法，我们可以使用`T：Summary + Display`来表示T可以是实现Summary和Display的任何类型,这会变得非常复杂！

```rust
fn some_function<T: Display + Clone, U: Clone + Debug>(t: T, u: U) -> i32 {}
```

### where 条件

Rust具有替代语法简化多trait bounds语法，用于在函数签名之后的where子句中指定trait边界：

```rust
fn some_function<T, U>(t: T, u: U) -> i32
    where T: Display + Clone,
          U: Clone + Debug
{}
```

## 返回多个trait

可以在返回位置使用`impl Trait`简化语法，以返回实现trait的东西：

```rust
fn returns_summarizable() -> impl Summary {
    Tweet {
        username: String::from("horse_ebooks"),
        content: String::from("of course, as you probably already know, people"),
        reply: false,
        retweet: false,
    }
}
```

但是，只有在您返回的单一类型时才有效。 例如这不起作用,我们尝试返回`NewsArticle`或`Tweet`。 由于对Trait如何工作的限制，这不起作用。 要编写此代码，必须`trait objects`.

```rust
fn returns_summarizable(switch: bool) -> impl Summary {
    if switch {
        NewsArticle {
            headline: String::from("Penguins win the Stanley Cup Championship!"),
            location: String::from("Pittsburgh, PA, USA"),
            author: String::from("Iceburgh"),
            content: String::from("The Pittsburgh Penguins once again are the best
            hockey team in the NHL."),
        }
    } else {
        Tweet {
            username: String::from("horse_ebooks"),
            content: String::from("of course, as you probably already know, people"),
            reply: false,
            retweet: false,
        }
    }
}
```

## 使用Trait Bounds有条件实施方法

通过在带有泛型类型参数的impl块使用Trait Bounds，我们可以有条件地为那些实现指trait的类型实现方法。根据trait边界有条件地实现泛型类型的方法.

```rust

#![allow(unused_variables)]
fn main() {
use std::fmt::Display;

struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self {
            x,
            y,
        }
    }
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("The largest member is x = {}", self.x);
        } else {
            println!("The largest member is y = {}", self.y);
        }
    }
}
}
```

我们还可以有条件地为任何实现其他trait的类型实现trait。 任何满足`Trait Bounds`的类型的trait的实现称为一揽子实现，并且在Rust标准库中广泛使用。 例如标准库在实现`Display `trait的任何类型上实现`ToString`trait。所以我们可以在实现`Display`trait的任何类型上调用由`ToString`trait定义的to_string方法。

```rust
impl<T: Display> ToString for T {
    // --snip--
}
```

```rust
let s = 3.to_string();
```

`Traits` 和 `trait bounds`让我们编写使用泛型类型参数的代码来减少重复，但也向编译器指定我们希望泛型类型具有特定行为。然后编译器可以使用 `trait bound`信息来检查与我们的代码一起使用的所有具体类型是否提供了正确的行为。在动态类型语言中，如果我们在类型未实现的类型上调用方法，则在运行时会出现错误。但是Rust将这些错误移动到编译时，因此我们不得不在代码甚至能够运行之前修复问题。此外，我们不必编写在运行时检查行为的代码，因为我们已经在编译时检查过。这样做可以提高性能，而不必放弃泛型的灵活性。

我们已经使用的另一种泛型称为生命周期。不是确保类型具有我们想要的行为，而是生命周期确保引用只要我们需要它们就是有效的。

## 使用关联类型在trait定义中指定占位符类型

关联类型将类型占位符与trait连接起来，以便trait方法定义可以在其签名中使用这些占位符类型。trait的实现者将指定在此类型的trait实现位置中使用的具体类型。这样我们可以定义一个使用某些类型的trait，而不需要确切知道这些类型是什么，直到实现trait。

具有关联类型trait的一个示例是标准库提供的`Iterator`trait。Iterator具有关联类型的trait的定义Item,关联类型名为Item，代表实现`Iterator`trait的类型迭代的值的类型。

```rust

#![allow(unused_variables)]
fn main() {
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
}
}
```

类型Item是占位符类型，`next`方法的定义显示它将返回`Option <Self :: Item>`类型的值。 `Iterator`trait的实现者将指定Item的具体类型，`next`方法将返回一个包含该具体类型值的`Option`。

```rust
// 关联类型
impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        // --snip--

// 泛型

#![allow(unused_variables)]
fn main() {
pub trait Iterator<T> {
    fn next(&mut self) -> Option<T>;
}
}
```

关联类型可能看起来与泛型相似，不同之处在于，当使用泛型时，我们必须在每个实现中注释类型; 因为我们也可以实现 `Iterator<String> for Counter`或任何其他类型，我们可以有多个Iteratorfor的实现Counter。换句话说，当trait具有泛型参数时，它可以多次实现一种类型，每次都改变泛型类型参数的具体类型。当我们使用 `next`方法时`Counter`，我们必须提供类型注释来指示Iterator我们想要使用哪个实现。

对于关联类型，我们不需要注释类型，因为我们不能多次在类型上实现trait。使用关联类型的定义，我们只能选择`Item`一次类型 ，因为只能有一个`impl Iterator for Counter`。我们没有指定我们想要的迭代器`u32`值无处不在，我们称之为`next`上`Counter`。

## 默认泛型参数和运算符重载

当我们使用泛型类型参数时，我们可以为泛型类型指定默认的具体类型。 如果默认类型有效，则不需要trait的实现者指定具体类型。 在声明泛型类型时，为泛型类型指定默认类型的语法是`<PlaceholderType = ConcreteType>`。

这种技术有用的一个很好的例子是运算符重载。 运算符重载是在特定情况下自定义运算符（例如+）的行为。

Rust不允许您创建自己的运算符或过载任意运算符。 但是您可以通过实现与运算符关联的trait来重载`std :: ops`中列出的操作和相应trait。 例如我们重载`+`运算符以将两个`Point`实例一起添加。 我们通过在`Point`结构上实现`Add` trait来实现这一点：

```rust
use std::ops::Add;

#[derive(Debug, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

impl Add for Point {
    type Output = Point;

    fn add(self, other: Point) -> Point {
        Point {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

fn main() {
    assert_eq!(Point { x: 1, y: 0 } + Point { x: 2, y: 3 },
               Point { x: 3, y: 3 });
}
```

此代码中的默认泛型类型位于Add trait中。 这是它的定义：

```rust

#![allow(unused_variables)]
fn main() {
trait Add<RHS=Self> {
    type Output;

    fn add(self, rhs: RHS) -> Self::Output;
}
}
```

具有一种方法和相关类型的trait。 新部件是`RHS = Self`：此语法称为默认类型参数。 `RHS`泛型类型参数（“右侧”的缩写）定义了add方法中rhs参数的类型。 如果我们在实现`Add` trait时没有为`RHS`指定具体类型，则`RHS`的类型将默认为`Self`，这将是我们实现`Add`的类型。

当我们实现`Add for Point`时，我们使用了RHS的默认值，因为我们想要添加两个Point实例。 让我们看一个实现`Add` trait的例子，我们想要自定义RHS类型而不是使用默认值。

```rust

#![allow(unused_variables)]
fn main() {
use std::ops::Add;

struct Millimeters(u32);
struct Meters(u32);

impl Add<Meters> for Millimeters {
    type Output = Millimeters;

    fn add(self, other: Meters) -> Millimeters {
        Millimeters(self.0 + (other.0 * 1000))
    }
}
}
```

以两种主要方式使用默认类型参数：

* 在不破坏现有代码的情况下扩展类型
* 为了在大多数用户不需要的特定情况下进行自定义

标准库的`Add` trait是第二个目的的一个示例：通常，您将添加两个类似的类型，但`Add` trait提供了自定义之外的能力。 在`Add` trait定义中使用默认类型参数意味着您不必在大多数时间指定额外参数。 换句话说，不需要一些实现样板，使得更容易使用trait。

第一个目的与第二个目的类似但反过来：如果要将类型参数添加到现有trait，可以给它一个默认值，以允许扩展trait的功能而不破坏现有的实现代码。

### 用于消除歧义的完全限定语法：使用相同名称调用方法

调用具有相同名称的方法时，您需要告诉Rust您要使用哪个方法。

```rust

#![allow(unused_variables)]
trait Pilot {
    fn fly(&self);
}

trait Wizard {
    fn fly(&self);
}

struct Human;

impl Pilot for Human {
    fn fly(&self) {
        println!("This is your captain speaking.");
    }
}

impl Wizard for Human {
    fn fly(&self) {
        println!("Up!");
    }
}

impl Human {
    fn fly(&self) {
        println!("*waving arms furiously*");
    }
}
fn main() {
    let person = Human;
    person.fly();
}
```

当我们调用fly一个实例时Human，编译器默认调用直接在该类型上实现的方法，此代码将打印*waving arms furiously*，要从trait或trait 调用fly方法，我们需要使用更明确的语法来指定我们所指的方法。

```rust
fn main() {
    let person = Human;
    Pilot::fly(&person);
    Wizard::fly(&person);
    person.fly();
}
```

使用完全限定的语法: `<Type as Trait>::function(receiver_if_method, next_arg, ...);`

```rust
trait Animal {
    fn baby_name() -> String;
}

struct Dog;

impl Dog {
    fn baby_name() -> String {
        String::from("Spot")
    }
}

impl Animal for Dog {
    fn baby_name() -> String {
        String::from("puppy")
    }
}

fn main() {
    println!("A baby dog is called a {}", Dog::baby_name());              // A baby dog is called a Spot
    println!("A baby dog is called a {}", Animal::baby_name());           // Error
    println!("A baby dog is called a {}", <Dog as Animal>::baby_name());  // A baby dog is called a puppy
}
```

1,对于关联函数，不会有`receiver`：只有其他参数的列表。 您可以在调用函数或方法的任何地方使用完全限定的语法。 但是您可以省略,Rust可以从程序中的其他信息中找出的此语法的任何部分。2, 在有多个使用相同名称的实现的情况下，您只需要使用这种更详细的完全限定语法，Rust需要帮助来识别您要调用的实现。

### 使用Supertraits在另一个trait中要求一个trait的功能

您可能需要一个`trait`来使用其他`trait`的功能。 在这种情况下，您需要依赖`trait`依赖性。 你所依赖的`trait`是你正在实施的`trait`的`supertrait`。

```rust
use std::fmt;

trait OutlinePrint: fmt::Display {
    fn outline_print(&self) {
        let output = self.to_string();
        let len = output.len();
        println!("{}", "*".repeat(len + 4));
        println!("*{}*", " ".repeat(len + 2));
        println!("* {} *", output);
        println!("*{}*", " ".repeat(len + 2));
        println!("{}", "*".repeat(len + 4));
    }
}
```

因为我们已经指定OutlinePrint需要Display特性，所以我们可以使用为实现Display的任何类型自动实现的to_string函数。 如果我们尝试使用to_string而不添加冒号并在trait名称后面指定显示trait，我们会收到一条错误消息，指出在当前范围内没有找到名为to_string的类型＆Self。

```rust
use std::fmt;

struct Point {
    x: i32,
    y: i32,
}

impl OutlinePrint for Point {}

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}
```

### 使用Newtype模式实现外部类型的外部trait

孤立规则声明我们可以在类型上实现trait，只要trait或类型是我们的crate的本地trait。 使用newtype模式可以绕过这个限制，这涉及在元组结构中创建一个新类型。元组结构将有一个字段，并且是我们想要实现trait的类型的薄包装。 然后包装器类型对我们的crate是本地的，我们可以在包装器上实现trait。 使用Newtype此模式没有运行时性能损失，并且在编译时省略了包装器类型。

```rust
use std::fmt;

struct Wrapper(Vec<String>);

impl fmt::Display for Wrapper {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

fn main() {
    let w = Wrapper(vec![String::from("hello"), String::from("world")]);
    println!("w = {}", w);
}
```

Display的实现使用`self.0`来访问内部`Vec <T>`，因为Wrapper是一个元组结构，而`Vec <T>`是元组中索引`0`处的项。然后我们可以在Wrapper上使用Display类型的功能。

使用这种技术的缺点是`Wrapper`是一种新类型，因此它没有它所持有的值的方法。我们必须直接在Wrapper上实现`Vec <T>`的所有方法，这样方法委托给`self.0`，这样我们就可以像处理`Vec <T>`一样处理`Wrapper`。如果我们希望新类型具有内部类型具有的每个方法，则在包装器上实现`Deref`特性以返回内部类型将是一个办法。如果我们不希望Wrapper类型具有内部类型的所有方法 - 例如为了限制Wrapper类型的行为 - 我们必须只实现我们手动想要的方法。

现在您知道newtype模式如何与trait相关使用;即使不涉及trait，它也是一种有用的模式。

## Trait Objects 执行动态调度

我们讨论了当我们在泛型上使用特征边界时由编译器执行的单态化过程：编译器为我们使用的每个具体类型生成函数和方法的非泛型实现泛型类型参数。从单态化产生的代码是进行静态分派，这是编译器知道在编译时调用的方法。这与动态调度相反，动态调度是编译器在编译时无法告诉您调用哪种方法。在动态调度的情况下，编译器会发出代码，在运行时会找出要调用的方法。

当我们使用rait Objects 时，Rust必须使用动态调度。编译器不知道可能与使用特征对象的代码一起使用的所有类型，因此它不知道在哪种类型上调用哪个方法。相反，在运行时，Rust使用trait对象内的指针来知道要调用哪个方法。发生此查找时存在运行时成本，静态调度不会发生。动态调度还会阻止编译器选择内联方法的代码，从而阻止某些优化。我们在获得了额外的灵活性，所以这是一个需要考虑的权衡。

## Trait Objects 需要 对象安全

您只能将`Trait Objects`设置为对象安全。一些复杂的规则管理使`Trait Objects`具有安全的所有属性，但在实践中，只有两个规则是相关的。如果`trait`中定义的所有方法都具有以下属性，则`trait`是对象安全的：

* 返回类型不是Self。
* 没有泛型类型参数。

Self关键字是我们实现`trait`或方法的类型的别名。`Trait Objects`必须是对象安全的，因为一旦你使用了`Trait Objects`，Rust就不再知道实现该`trait`的具体类型了。如果`trait`方法返回具体的`Self`类型，但是`Trait Object`忘记了`Self`的确切类型，则该方法无法使用原始的具体类型。在使用`trait`时，使用具体类型参数填充的泛型类型参数也是如此：具体类型成为实现`trait`的类型的一部分。当通过使用`Trait Object`忘记类型时，无法知道要在哪些类型中填充泛型类型参数。