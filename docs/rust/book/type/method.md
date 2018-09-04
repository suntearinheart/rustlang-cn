# 方法

[参考](https://doc.rust-lang.org/reference/items/implementations.html)

- 固有实现
- `Trait`实现
  - `Trait`实现一致性
- 泛型实现

## 方法定义

```rust
[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };

    println!(
        "The area of the rectangle is {} square pixels.",
        rect1.area()
    );
}
```

在 `area` 的签名中，开始使用 `&self` 来替代 `rectangle: &Rectangle`，因为该方法位于 `impl Rectangle` 上下文中所以 Rust 知道 `self` 的类型是 `Rectangle`。注意仍然需要在 `self` 前面加上` &`，就像 `&Rectangle` 一样。方法可以选择获取 `self` 的所有权，或者像我们这里一样不可变地借用 `self`，或者可变地借用 `self`，就跟其他别的参数一样。

`&self`。它有3种变体：`self`，`&self`和`&mut self`。这里选择 `&self` 跟在函数版本中使用 `&Rectangle` 出于同样的理由：我们并不想获取所有权，只希望能够读取结构体中的数据，而不是写入。如果想要在方法中改变调用方法的实例，需要将第一个参数改为` &mut self`。通过仅仅使用 `self` 作为第一个参数来使方法获取实例的所有权是很少见的；这种技术通常用在当方法将 `self` 转换成别的实例的时候，这时我们想要防止调用者在转换之后使用原始的实例。

我们应该更多使用`&self`，就像相比获取所有权你应该更倾向于借用，同样相比获取可变引用更倾向于不可变引用一样。这是一个三种变体的例子：

```rust
struct Circle {
    x: f64,
    y: f64,
    radius: f64,
}

impl Circle {
    fn reference(&self) {
       println!("taking self by reference!");
    }

    fn mutable_reference(&mut self) {
       println!("taking self by mutable reference!");
    }

    fn takes_ownership(self) {
       println!("taking ownership of self!");
    }
}
```

## 链式方法调用

现在我们知道如何调用方法，例如`foo.bar()`。那么`foo.bar().baz()`？我们称这个为“方法链”，我们可以通过返回`self`来做到这点。

```rust
struct Circle {
    x: f64,
    y: f64,
    radius: f64,
}

impl Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * (self.radius * self.radius)
    }

    fn grow(&self, increment: f64) -> Circle {
        Circle { x: self.x, y: self.y, radius: self.radius + increment }
    }
}

fn main() {
    let c = Circle { x: 0.0, y: 0.0, radius: 2.0 };
    println!("{}", c.area());

    let d = c.grow(2.0).area();
    println!("{}", d);
}
```

注意返回值：

```rust
struct Circle;

impl Circle {
    fn grow(&self, increment: f64) -> Circle {
        Circle
    }
}
```

我们看到我们返回了一个`Circle`。通过这个函数，我们可以增长一个圆的面积到任意大小。

## 关联函数

impl 块的另一个有用的功能是：允许在` impl `块中定义 不 以 `self` 作为参数的函数。这被称为 关联函数，因为它们与结构体相关联。即便如此它们仍是函数而不是方法，因为它们并不作用于一个结构体的实例。关联函数经常被用作返回一个结构体新实例的构造函数。使用结构体名和 `:: `语法来调用这个关联函数，`:: `语法用于关联函数和模块创建的命名空间。

```rust
struct Circle {
    x: f64,
    y: f64,
    radius: f64,
}

impl Circle {
    fn new(x: f64, y: f64, radius: f64) -> Circle {
        Circle {
            x: x,
            y: y,
            radius: radius,
        }
    }
}

fn main() {
    let c = Circle::new(0.0, 0.0, 2.0);
}
```

这个*关联函数*（*associated function*）为我们构建了一个新的`Circle`。注意静态函数是通过`Struct::method()`语法调用的，而不是`ref.method()`语法。

## 创建者模式

我们可以创建圆，不过我们只允许他们设置他们关心的属性。否则，`x`和`y`将是`0.0`，并且`radius`将是`1.0`。Rust 并没有方法重载，命名参数或者可变参数。我们利用创建者模式来代替。它看起像这样：

```rust
struct Circle {
    x: f64,
    y: f64,
    radius: f64,
}

impl Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * (self.radius * self.radius)
    }
}

struct CircleBuilder {
    x: f64,
    y: f64,
    radius: f64,
}

impl CircleBuilder {
    fn new() -> CircleBuilder {
        CircleBuilder { x: 0.0, y: 0.0, radius: 1.0, }
    }

    fn x(&mut self, coordinate: f64) -> &mut CircleBuilder {
        self.x = coordinate;
        self
    }

    fn y(&mut self, coordinate: f64) -> &mut CircleBuilder {
        self.y = coordinate;
        self
    }

    fn radius(&mut self, radius: f64) -> &mut CircleBuilder {
        self.radius = radius;
        self
    }

    fn finalize(&self) -> Circle {
        Circle { x: self.x, y: self.y, radius: self.radius }
    }
}

fn main() {
    let c = CircleBuilder::new()
                .x(1.0)
                .y(2.0)
                .radius(2.0)
                .finalize();

    println!("area: {}", c.area());
    println!("x: {}", c.x);
    println!("y: {}", c.y);
}
```

我们在这里又声明了一个结构体，`CircleBuilder`。我们给它定义了一个创建者函数。我们也在`Circle`中定义了`area()`方法。我们还定义了另一个方法`CircleBuilder: finalize()`。这个方法从构造器中创建了我们最后的`Circle`。现在我们使用类型系统来强化我们的考虑：我们可以用`CircleBuilder`来强制生成我们需要的`Circle`。

## 通用函数调用语法

有时，函数可能有相同的名字。就像下面这些代码：

```rust
trait Foo {
    fn f(&self);
}

trait Bar {
    fn f(&self);
}

struct Baz;

impl Foo for Baz {
    fn f(&self) { println!("Baz’s impl of Foo"); }
}

impl Bar for Baz {
    fn f(&self) { println!("Baz’s impl of Bar"); }
}

let b = Baz;
```

如果我们尝试调用`b.f()`，我们会得到一个错误：

```text
error: multiple applicable methods in scope [E0034]
b.f();
  ^~~
note: candidate #1 is defined in an impl of the trait `main::Foo` for the type
`main::Baz`
    fn f(&self) { println!("Baz’s impl of Foo"); }
    ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
note: candidate #2 is defined in an impl of the trait `main::Bar` for the type
`main::Baz`
    fn f(&self) { println!("Baz’s impl of Bar"); }
    ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

我们需要一个区分我们需要调用哪一函数的方法。这个功能叫做“通用函数调用语法”（universal function call syntax），这看起来像这样：

```rust
trait Foo {
    fn f(&self);
}

trait Bar {
    fn f(&self);
}

struct Baz;

impl Foo for Baz {
    fn f(&self) { println!("Baz’s impl of Foo"); }
}

impl Bar for Baz {
    fn f(&self) { println!("Baz’s impl of Bar"); }
}

let b = Baz;
Foo::f(&b);
Bar::f(&b);
```

让我们拆开来看。

```rust
Foo::
Bar::
```

调用的这一半是两个traits的类型：`Foo`和`Bar`。这样实际上就区分了这两者：Rust调用你使用的trait里面的方法。

```rust
f(&b)
```

当我们使用`方法语法`调用像`b.f()`这样的方法时，如果`f()`需要`&self`，Rust实际上会自动地把`b`借用为`&self`。而在这个例子中，Rust并不会这么做，所以我们需要显式地传递一个`&b`。

刚才讨论的通用函数调用语法的形式：

```rust
Trait::method(args);
```

上面的形式其实是一种缩写。这是在一些情况下需要使用的扩展形式：

```rust
<Type as Trait>::method(args);
```

`<>::`语法是一个提供类型提示的方法。类型位于`<>`中。在这个例子中，类型是`Type as Trait`，表示我们想要`method`的`Trait`版本被调用。在没有二义时`as Trait`部分是可选的。尖括号也是一样。因此上面的形式就是一种缩写的形式。

这是一个使用较长形式的例子。

```rust
trait Foo {
    fn foo() -> i32;
}

struct Bar;

impl Bar {
    fn foo() -> i32 {
        20
    }
}

impl Foo for Bar {
    fn foo() -> i32 {
        10
    }
}

fn main() {
    assert_eq!(10, <Bar as Foo>::foo());
    assert_eq!(20, Bar::foo());
}
```

使用尖括号语法让你可以调用指定trait的方法而不是继承到的那个。
