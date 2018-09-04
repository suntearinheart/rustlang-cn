# 运算符与重载

## 一元操作符

顾名思义，一元操作符是专门对一个Rust元素进行操纵的操作符，主要包括以下几个:

* `-`: 取负，专门用于数值类型。
* `*`: 解引用。这是一个很有用的符号，和`Deref`（`DerefMut`）这个trait关联密切。
* `!`: 取反。取反操作相信大家都比较熟悉了，不多说了。有意思的是，当这个操作符对数字类型使用的时候，会将其每一位都置反！也就是说，你对一个`1u8`进行`!`的话你将会得到一个`254u8`。
* `&`和`&mut`: 租借，borrow。向一个owner租借其使用权，分别是租借一个只读使用权和读写使用权。

### 二元操作符

### 算数操作符

算数运算符都有对应的trait的，他们都在`std::ops`下：

* `+`: 加法。实现了`std::ops::Add`。
* `-`: 减法。实现了`std::ops::Sub`。
* `*`: 乘法。实现了`std::ops::Mul`。
* `/`: 除法。实现了`std::ops::Div`。
* `%`: 取余。实现了`std::ops::Rem`。

### 位运算符

和算数运算符差不多的是，位运算也有对应的trait。

* `&`: 与操作。实现了`std::ops::BitAnd`。
* `|`: 或操作。实现了`std::ops::BitOr`。
* `^`: 异或。实现了`std::ops::BitXor`。
* `<<`: 左移运算符。实现了`std::ops::Shl`。
* `>>`: 右移运算符。实现了`std::ops::Shr`。

### 惰性boolean运算符

逻辑运算符有三个，分别是`&&`、`||`、`!`。其中前两个叫做惰性boolean运算符，之所以叫这个名字。是因为在Rust里也会出现其他类C语言的逻辑短路问题。有点不同的是Rust里这个运算符只能用在bool类型变量上。如 `1 && 1` 之类的表达式无效。

### 比较运算符

比较运算符其实也是某些trait的语法糖啦，不同的是比较运算符所实现的trait只有两个`std::cmp::PartialEq`和`std::cmp::PartialOrd`

其中， `==`和`!=`实现的是`PartialEq`。
而，`<`、`>`、`>=`、`<=`实现的是`PartialOrd`。

`std::cmp`有四个trait，Rust对于这四个trait的处理是明确的。IEEE的浮点数有一个特殊的值叫`NaN`，这个值表示未定义的一个浮点数。在Rust中可以用`0.0f32 / 0.0f32`来求得其值。这个数他是一个确定的值，但它表示的是一个不确定的数！ `NaN != NaN` 的结果是 `true` 。但这么写又不符合`Eq`的定义里`total equal`(每一位一样两个数就一样)的定义。因此有了`PartialEq`这么一个定义，我们只支持部分相等好吧，NaN这个情况我就特指。

Rust编译器选择了`PartialOrd`和`PartialEq`来作为其默认的比较符号的trait。

### 类型转换运算符

运算符`as`。

```rust
fn avg(vals: &[f64]) -> f64 {
    let sum: f64 = sum(vals);
    let num: f64 = len(vals) as f64;
    sum / num
}
```

Rust 允许运算符重载。特定的运算符可以被重载。要支持一个类型间特定的运算符，你可以实现一个的特定的重载运算符的trait。

例如，`+`运算符可以通过`Add`特性重载：

```rust
use std::ops::Add;

#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

impl Add for Point {
    type Output = Point;

    fn add(self, other: Point) -> Point {
        Point { x: self.x + other.x, y: self.y + other.y }
    }
}

fn main() {
    let p1 = Point { x: 1, y: 0 };
    let p2 = Point { x: 2, y: 3 };

    let p3 = p1 + p2;

    println!("{:?}", p3);
}
```

在`main`中，我们可以对我们的两个`Point`用`+`号，因为我们已经为`Point`实现了`Add<Output=Point>`。

有一系列可以这样被重载的运算符，并且所有与之相关的trait都在[`std::ops`](http://doc.rust-lang.org/stable/std/ops/)模块中。查看它的文档来获取完整的列表。

实现这些特性要遵循一个模式。让我们仔细看看[`Add`](http://doc.rust-lang.org/stable/std/ops/trait.Add.html)：

```rust
# mod foo {
pub trait Add<RHS = Self> {
    type Output;

    fn add(self, rhs: RHS) -> Self::Output;
}
# }
```

这里总共涉及到3个类型：你`impl Add`的类型，`RHS`，它默认是`Self`，和`Output`。对于一个表达式`let z = x + y`，`x`是`Self`类型的，`y`是`RHS`，而`z`是`Self::Output`类型。

```rust
# struct Point;
# use std::ops::Add;
impl Add<i32> for Point {
    type Output = f64;

    fn add(self, rhs: i32) -> f64 {
        // add an i32 to a Point and get an f64
# 1.0
    }
}
```
这个`Output`是肿么回事:类型转换！我们在现实中会出现`0.5+0.5=1`这样的算式，用Rust的语言来描述就是： 两个`f32`相加得到了一个`i8`。显而易见，Output就是为这种情况设计的。


```rust
use std::ops::Add;

#[derive(Debug)]
struct Complex {
    a: f64,
    b: f64,
}

impl Add for Complex {
    type Output = Complex;
    fn add(self, other: Complex) -> Complex {
        Complex {a: self.a+other.a, b: self.b+other.b}
    }
}

impl Add<i32> for Complex {
    type Output = f64;
    fn add(self, other: i32) -> f64 {
        self.a + self.b + (other as f64)
    }
}

fn main() {
    let cp1 = Complex{a: 1f64, b: 2.0};
    let cp2 = Complex{a: 5.0, b:8.1};
    let cp3 = Complex{a: 9.0, b:20.0};
    let complex_add_result = cp1 + cp2;
    print!("{:?}\n", complex_add_result);
    print!("{:?}", cp3 + 10i32);
}
```

输出结果：

```
Complex { a: 6, b: 10.1 }
39
```

## 对范型的限制

Rust的运算符是基于trait系统的，同样的，运算符可以被当成一种对范型的限制，我们可以这么要求`范型T必须实现了trait Mul<Output=T>`。

现在我们知道了运算符 trait 是如何定义的了，我们可以更通用的定义`HasArea` trait 和`Square`结构体：

```rust
use std::ops::Mul;

trait HasArea<T> {
    fn area(&self) -> T;
}

struct Square<T> {
    x: T,
    y: T,
    side: T,
}

impl<T> HasArea<T> for Square<T>
        where T: Mul<Output=T> + Copy {
    fn area(&self) -> T {
        self.side * self.side
    }
}

fn main() {
    let s = Square {
        x: 0.0f64,
        y: 0.0f64,
        side: 12.0f64,
    };

    println!("Area of s: {}", s.area());
}
```
对于trait `HasArea<T>`和 struct `Square<T>`，我们通过`where T: Mul<Output=T> + Compy` 限制了`T`必须实现乘法。同时Copy则限制了Rust不再将self.side给move到返回值里去。
