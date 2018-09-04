# 引用-借用

Rust中的每个引用都有一个生命周期，这是该引用有效的范围。

## 借用检查器

Rust编译器有一个借用检查器，用于比较范围以确定所有借用是否有效

### 函数中的范型生命周期

### 生命周期注释语法

生命周期注释不会改变任何引用的生存时间。 正如函数可以在签名指定泛型类型参数时接受任何类型一样，函数可以通过指定泛型生存期参数来接受任何生命周期的引用。 生命周期注释描述了多个引用的生命周期之间的关系，而不会影响生命周期。

### 函数签名中的生命周期注释

### 方法定义中的生命周期注释

### 结构定义中的生命周期注释

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.')
        .next()
        .expect("Could not find a '.'");
    let i = ImportantExcerpt { part: first_sentence };
}
```

### 静态生命周期

需要讨论的一个特殊生命周期是'static，它表示整个计划的持续时间。所有字符串文字都有'static生命周期

```rust
let s: &'static str = "I have a static lifetime.";
```

### 隐式生命周期

每个引用都有生命周期，并且您需要为使用引用的函数或结构指定生存期参数。

函数或方法参数的生命周期称为输入生命周期，返回值的生命周期称为输出生命周期。

编译器使用三个规则来确定没有显式注释时生命周期引用的内容。第一条规则适用于输入生命周期，第二条和第三条规则适用于输出生命周期。如果编译器到达三个规则的末尾并且仍然存在无法计算生命周期的引用，则编译器将停止并出现错误。

* 第一个规则是作为引用的每个参数都有自己的生命周期参数。换句话说，具有一个参数的函数获得一个生命周期参数：fn foo <'a>（x：＆'a i32）;具有两个参数的函数获得两个单独的生命周期参数：fn foo <'a，'b>（x：＆'a i32，y：＆'b i32）;等等。

* 第二个规则是，如果只有一个输入生命周期参数，则将生命周期分配给所有输出生命周期参数：fn foo <'a>（x：＆'a i32） - >＆'a i32。

* 第三个规则是，如果有多个输入生命周期参数，但其中一个是＆self或＆mut self，因为这是一个方法，self的生命周期被分配给所有输出生命周期参数。第三个规则使得方法读取和写入更好，因为需要更少的符号。

### 范型参数， Trait Bounds和生命周期

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
