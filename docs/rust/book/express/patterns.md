# 模式

模式由如下一些内容组合而成：

* 字面量
* 解构的数组、枚举、结构体或者元组
* 变量
* 通配符
* 占位符

`模式的位置`

* match 分支
* if let 条件表达式
* while let 条件循环
* for 循环
* let 语句
* 函数参数

## match

Rust 有一个`match` 极为强大的控制流标识符，将一个值与一系列的模式相比较并根据相匹配的模式执行相应代码，match 表达式必须是 穷尽的,模式 _用于匹配不想列举出的所有情况.

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u32 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

`match` 关键字后跟一个表达式。每个分支都是`val => expression`这种形式。当匹配到一个分支，它的表达式将被执行。`match`属于“模式匹配”的范畴.

`match`也是一个表达式，也就是说它可以用在`let`绑定的右侧或者其它直接用到表达式的地方：

```rust
let x = 5;

let number = match x {
    1 => "one",
    2 => "two",
    3 => "three",
    4 => "four",
    5 => "five",
    _ => "something else",
};
```

这是一个把一种类型的数据转换为另一个类型的好方法。

## 匹配枚举

```rust
enum Message {
    Quit,
    ChangeColor(i32, i32, i32),
    Move { x: i32, y: i32 },
    Write(String),
}

fn quit() { /* ... */ }
fn change_color(r: i32, g: i32, b: i32) { /* ... */ }
fn move_cursor(x: i32, y: i32) { /* ... */ }

fn process_message(msg: Message) {
    match msg {
        Message::Quit => quit(),
        Message::ChangeColor(r, g, b) => change_color(r, g, b),
        Message::Move { x: x, y: y } => move_cursor(x, y),
        Message::Write(s) => println!("{}", s),
    };
}
```

## 匹配`Option<T>`

```rust
fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(i) => Some(i + 1),
    }
}

let five = Some(5);
let six = plus_one(five);
let none = plus_one(None);
```

## 多个模式

你可以使用`|`匹配多个模式。

```rust
let x = 1;

match x {
    1 | 2 => println!("one or two"),
    3 => println!("three"),
    _ => println!("anything"),
}
```

这会输出`one or two`。

## 范围

你可以用`...`匹配一个范围的值,范围只允许用于数字或 char 值，因为编译器会在编译时检查范围不为空。char 和 数字值是 Rust 唯一知道范围是否为空的类型.

```rust
let x = 5;

match x {
    1 ... 5 => println!("one through five"),
    _ => println!("something else"),
}
```

这会输出`one through five`。

范围经常用在整数和`char`上。

```rust
let x = 'c';

match x {
    'a' ... 'j' => println!("early letter"),
    'k' ... 'z' => println!("late letter"),
    _ => println!("something else"),
}
```

这会输出`something else`。

## 解构

* 解构结构体和元组

```rust
let ((feet, inches), Point {x, y}) = ((3, 10), Point { x: 3, y: -10 });
```

* 解构结构体

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    let Point { x: a, y: b } = p;
    assert_eq!(0, a);
    assert_eq!(7, b);
}
//简化
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    let Point { x, y } = p;
    assert_eq!(0, x);
    assert_eq!(7, y);
}
```

* 解构枚举

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn main() {
    let msg = Message::ChangeColor(0, 160, 255);

    match msg {
        Message::Quit => {
            println!("The Quit variant has no data to destructure.")
        },
        Message::Move { x, y } => {
            println!(
                "Move in the x direction {} and in the y direction {}",
                x,
                y
            );
        }
        Message::Write(text) => println!("Text message: {}", text),
        Message::ChangeColor(r, g, b) => {
            println!(
                "Change the color to red {}, green {}, and blue {}",
                r,
                g,
                b
            )
        }
    }
}
```

```rust
enum Color {
   Rgb(i32, i32, i32),
   Hsv(i32, i32, i32)
}

enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(Color),
}

fn main() {
    let msg = Message::ChangeColor(Color::Hsv(0, 160, 255));

    match msg {
        Message::ChangeColor(Color::Rgb(r, g, b)) => {
            println!(
                "Change the color to red {}, green {}, and blue {}",
                r,
                g,
                b
            )
        },
        Message::ChangeColor(Color::Hsv(h, s, v)) => {
            println!(
                "Change the color to hue {}, saturation {}, and value {}",
                h,
                s,
                v
            )
        }
        _ => ()
    }
}
```

* 解构引用

```rust

#![allow(unused_variables)]
fn main() {
struct Point {
    x: i32,
    y: i32,
}

let points = vec![
    Point { x: 0, y: 0 },
    Point { x: 1, y: 5 },
    Point { x: 10, y: -3 },
];

let sum_of_squares: i32 = points
    .iter()
    .map(|&Point { x, y }| x * x + y * y)
    .sum();
}
```

## .. 忽略匹配

如果你只关心部分值，我们不需要给它们都命名：

```rust
struct Point {
    x: i32,
    y: i32,
}

let origin = Point { x: 0, y: 0 };

match origin {
    Point { x, .. } => println!("x is {}", x),
}
```

这会输出`x is 0`。

你可以对任何成员进行这样的匹配：

```rust
fn main() {
    let numbers = (2, 4, 8, 16, 32);

    match numbers {
        (first, .., last) => {
            println!("Some numbers: {}, {}", first, last);
        },
    }
}
```

## 绑定

可以使用`@`把值绑定到名字上：

```rust
let x = 1;

match x {
    e @ 1 ... 5 => println!("got a range element {}", e),
    _ => println!("anything"),
}
```

这会输出`got a range element 1`。

```rust
#[derive(Debug)]
struct Person {
    name: Option<String>,
}

let name = "Steve".to_string();
let mut x: Option<Person> = Some(Person { name: Some(name) });
match x {
    Some(Person { name: ref a @ Some(_), .. }) => println!("{:?}", a),
    _ => {}
}
```

这会输出 `Some("Steve")`，因为我们把Person里面的`name`绑定到`a`。

如果你在使用`|`的同时也使用了`@`，你需要确保名字在每个模式的每一部分都绑定名字：

```rust
let x = 5;

match x {
    e @ 1 ... 5 | e @ 8 ... 10 => println!("got a range element {}", e),
    _ => println!("anything"),
}
```

## 忽略绑定

你可以在模式中使用`_`来忽视它的类型和值。例如，这是一个`Result<T, E>`的`match`：

```rust
# let some_value: Result<i32, &'static str> = Err("There was an error");
match some_value {
    Ok(value) => println!("got a value: {}", value),
    Err(_) => println!("an error occurred"),
}
```

在第一个分支，我们绑定了`Ok`变量中的值为`value`，不过在`Err`分支，我们用`_`来忽视特定的错误，而只是打印了一个通用的错误信息。

`_`在任何创建绑定的模式中都有效。这在忽略一个大大结构体的部分字段时很有用：

```rust
fn coordinate() -> (i32, i32, i32) {
    // generate and return some sort of triple tuple
# (1, 2, 3)
}

let (x, _, z) = coordinate();
```

这里，我们绑定元组第一个和最后一个元素为`x`和`z`，不过省略了中间的元素。

相似的，你可以在模式中用`..`来忽略多个值。

```rust
enum OptionalTuple {
    Value(i32, i32, i32),
    Missing,
}

let x = OptionalTuple::Value(5, -2, 3);

match x {
    OptionalTuple::Value(..) => println!("Got a tuple!"),
    OptionalTuple::Missing => println!("No such luck."),
}
```

这会打印`Got a tuple!`。

## `ref`和`ref mut`

**使用ref引用，这样值的所有权就不会移动到模式中的变量**。通常，当您与模式匹配时，模式引入的变量将绑定到值。Rust的所有权规则意味着该值将被移动到match您使用该模式的地方或任何地方,借用值的方式是使用引用`&`，所以你可能会认为解决的办法是改变Some(name)为Some(&name),但是模式中的语法不会创建引用，但会匹配值中的现有引用。所以因为`&`在模式中已经具有这种含义，我们不能用于在模式中创建引用`&`。那么要在模式中创建引用，我们在新变量之前使用关键`ref`

```rust
let robot_name = Some(String::from("Bors"));

match robot_name {
    Some(ref name) => println!("Found a name: {}", name),
    None => (),
}
println!("robot_name is: {:?}", robot_name);

//ref mut
let mut robot_name = Some(String::from("Bors"));

match robot_name {
    Some(ref mut name) => *name = String::from("Another name"),
    None => (),
}

println!("robot_name is: {:?}", robot_name);
```

## 额外条件

```rust
let num = Some(4);

match num {
    Some(x) if x < 5 => println!("less than five: {}", x),
    Some(x) => println!("{}", x),
    None => (),
}

//
fn main() {
    let x = Some(5);
    let y = 10;

    match x {
        Some(50) => println!("Got 50"),
        Some(n) if n == y => println!("Matched, n = {:?}", n),
        _ => println!("Default case, x = {:?}", x),
    }

    println!("at the end: x = {:?}, y = {:?}", x, y);
}
//
let x = 4;
let y = false;

match x {
    4 | 5 | 6 if y => println!("yes"),
    _ => println!("no"),
}
```

## if let


我们有一些`Option<T>`。我们想让它是`Some<T>`时在其上调用一个函数，而它是`None`时什么也不做。这看起来像：

```rust
let option = Some(5);
fn foo(x: i32) { }
match option {
    Some(x) => { foo(x) },
    None => {},
}
```

我们并不一定要在这使用`match`，例如，我们可以使用`if`：

```rust
# let option = Some(5);
# fn foo(x: i32) { }
if option.is_some() {
    let x = option.unwrap();
    foo(x);
}
```

可以使用`if let`来优雅地完成相同的功能：

```rust
# let option = Some(5);
# fn foo(x: i32) { }
if let Some(x) = option {
    foo(x);
}
```

如果一个[模式](Patterns 模式.md)匹配成功，它绑定任何值的合适的部分到模式的标识符中，并计算这个表达式。如果模式不匹配，啥也不会发生。

如果你想在模式不匹配时做点其他的，你可以使用`else`：

```rust
# let option = Some(5);
# fn foo(x: i32) { }
# fn bar() { }
if let Some(x) = option {
    foo(x);
} else {
    bar();
}
```

## `while let`

使用`while let`可以把类似这样的代码：

```rust
let mut v = vec![1, 3, 5, 7, 11];
loop {
    match v.pop() {
        Some(x) =>  println!("{}", x),
        None => break,
    }
}
```

变成这样的代码：

```rust
let mut v = vec![1, 3, 5, 7, 11];
while let Some(x) = v.pop() {
    println!("{}", x);
}
```
