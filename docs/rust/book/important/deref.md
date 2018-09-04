# Deref

## 使用`Deref` trait让处理智能指针像正常引用一样

实现`Deref` trait允许您自定义解引用运算符*的行为（与乘法或glob运算符相对）。 通过以这样的方式实现`Deref`，可以将智能指针视为常规引用，您可以编写对引用进行操作的代码，并将该代码与智能指针一起使用。

首先看一下dereference运算符如何使用常规引用。 然后我们将尝试定义一个行为类似于`Box <T>`的自定义类型，并查看为什么取消引用运算符不像我们新定义的类型的引用那样工作。 我们将探索如何实现`Deref`特性使智能指针以与引用类似的方式工作。 然后我们将看看Rust的`deref`强制功能以及它如何让我们使用引用或智能指针。

常规引用是一种指针，一种思考指针的方法是指向存储在其他地方的值的箭头。

## 像引用一样使用`Box<T>`

```rust
fn main() {
    let x = 5;
    let y = &x;

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
// 相等于
fn main() {
    let x = 5;
    let y = Box::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y);
}
```

## 定义我们自己的智能指针,并通过实现`Deref` trait来处理类似引用的类型

```rust
use std::ops::Deref;

struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}
impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &T {
        &self.0
    }
}
```

如果没有该`Deref` trait，编译器只能解引用&引用。该`deref`方法使编译器能够获取实现的任何类型的值，Deref并调用该deref方法以获取&引用,它知道如何解引用。

Rust通过调用deref方法替换*运算符，然后使用简单的解引用，因此我们不必考虑是否需要调用deref方法。 这个Rust功能允许我们编写具有相同功能的代码，无论我们是否有常规引用或实现Deref的类型。我们的代码中每次使用`*`时只调用一次`*`运算符。 因为`*`运算符的替换不会无限递归.

## 用函数和方法隐式强制`Deref`

Deref强制是Rust对函数和方法的参数执行的便利。 Deref强制转换将对实现Deref的类型的引用转换为对Deref可以将原始类型转换为的类型的引用。当我们将对特定类型的值的引用作为参数传递给与函数或方法定义中的参数类型不匹配的函数或方法时，Deref强制自动发生。对deref方法的一系列调用将我们提供的类型转换为参数所需的类型。

Deref强制被添加到Rust中，因此编写函数和方法调用的程序员不需要使用＆和*添加任意数量的显式引用和解引用。 deref强制功能还允许我们编写更多可用于引用或智能指针的代码。
当Deref为所涉及的类型定义 trait时，Rust将分析类型并Deref::deref根据需要多次使用以获得与参数类型匹配的引用。Deref::deref需要插入的次数在编译时解决，因此利用deref强制没有运行时惩罚！

```rust
fn hello(name: &str) {
    println!("Hello, {}!", name);
}
fn main() {
    let m = MyBox::new(String::from("Rust"));
    hello(&m);       // 相等于 hello(&(*m);
}
```

## Deref强制与可变性相互作用

与使用`Deref` trait覆盖不可变引用上的`*`运算符的方式类似，您可以使用`DerefMut` trait覆盖可变引用上的`*`运算符。

当在三种情况下发现类型和 trait实现时，Rust会做出强制`deref`：

* 当`T：Deref <Target = U>`时，从`＆T`到`＆U`
* 当`T：DerefMut <Target = U>`时，从`＆mut T`到`＆mut U`
* 当`T：Deref <Target = U>`时，从`＆mut T`到`＆U`

除了可变性之外，前两种情况是相同的。第一种情况表明，如果你有一个＆T，而T实现Deref到某个类型U，你可以透明地得到一个＆U.第二种情况表明，对于可变引用，会发生相同的deref强制。

第三种情况比较棘手：Rust也会强制引用一个不可变的引用。但反过来是不可能的：不可变引用永远不会强制引用可变引用。由于借用规则，如果你有一个可变引用，那个可变引用必须是对该数据的唯一引用（否则，程序将无法编译）。将一个可变引用转换为一个不可变引用永远不会破坏借用规则。将不可变引用转换为可变引用将要求对该数据只有一个不可变引用，并且借用规则不保证这一点。因此，Rust不能假设将不可变引用转换为可变引用是可能的。
