# 表达式

Rust 主要是一个基于表达式的语言。只有两种语句，其它的一切都是表达式。

表达式返回一个值，而语句不是。这就是为什么这里我们以“不是所有控制路径都返回一个值”。Rust 中有两种类型的语句：“声明语句”和“表达式语句”。其余的一切是表达式。

在 Rust 中，使用`let`引入一个绑定并*不是*一个表达式。下面的代码会产生一个编译时错误：

```rust
let x = (let y = 5); // expected identifier, found keyword `let`
```

编译器告诉我们这里它期望看到表达式的开头，而`let`只能开始一个语句，不是一个表达式。

注意赋值一个已经绑定过的变量（例如，`y = 5`）仍是一个表达式，即使它的（返回）值并不是特别有用。不像其它语言中赋值语句返回它赋的值（例如，前面例子中的`5`），在 Rust 中赋值的值是一个空的元组`()`：

```rust
let mut y = 5;

let x = (y = 6);  // x has the value `()`, not `6`
```

Rust中第二种语句是**表达式语句**。它的目的是把任何表达式变为语句。Rust 语法期望语句后跟其它语句。用分号来分隔各个表达式.

## 控制结构

- return
- if/if let
- while/while let
- loop
- for
- label
- break 与 continue
- match

### return

```rust

fn max(a: i32, b: i32) -> i32 {
    if a > b {
        return a;
    }
    return b;
}
```

### If

`if` 语句是*分支*这个更加宽泛的概念的一个特定形式。
Rust 的 if 表达式的显著特点是：1,判断条件不用小括号括起来；2,它是表达式，而不是语句。

```rust
let x = 5;

if x == 5 {
    println!("x is five!");
}
```

如果`if`后面的表达式的值为`true`，这个代码块将被执行。为`false`则不被执行。

如果你想当值为`false`时执行些什么，使用`else`：

```rust
let x = 5;

if x == 5 {
    println!("x is five!");
} else {
    println!("x is not five :(");
}
```

如果不止一种情况，使用`else if`：

```rust
let x = 5;

if x == 5 {
    println!("x is five!");
} else if x == 6 {
    println!("x is six!");
} else {
    println!("x is not five or six :(");
}
```

你可以（或许也应该）这么写：

```rust
let x = 5;

let y = if x == 5 { 10 } else { 15 }; // y: i32
```

这代码可以被执行是因为`if`是一个表达式。表达式的值是任何被选择的分支的最后一个表达式的值。一个没有`else`的`if`总是返回`()`作为返回值。

**if let模式** : match 的简化用法

```rust

let dish = ("Ham", "Eggs");

// this body will be skipped because the pattern is refuted
if let ("Bacon", b) = dish {
    println!("Bacon is served with {}", b);
} else {
    // This block is evaluated instead.
    println!("No bacon will be served");
}

// this body will execute
if let ("Ham", b) = dish {
    println!("Ham is served with {}", b);
}
```

```rust
fn main() {
    let favorite_color: Option<&str> = None;
    let is_tuesday = false;
    let age: Result<u8, _> = "34".parse();

    if let Some(color) = favorite_color {
        println!("Using your favorite color, {}, as the background", color);
    } else if is_tuesday {
        println!("Tuesday is green day!");
    } else if let Ok(age) = age {
        if age > 30 {
            println!("Using purple as the background color");
        } else {
            println!("Using orange as the background color");
        }
    } else {
        println!("Using blue as the background color");
    }
}
```

**Rust 目前提供一些迭代操作。他们是`loop`，`while`和`for`。每种方法都有自己的用途**

### loop

Rust 提供的循环执行,使用`loop`关键字。

```rust
loop {
    println!("Loop forever!");
}
```

### while

Rust 提供的条件执行。

```rust
let mut x = 5; // mut x: i32
let mut done = false; // mut done: bool

while !done {
    x += （x - 3）;

    println!("{}", x);

    if x % 5 == 0 {
        done = true;
    }
}
```

**while let**模式

```rust
let mut stack = Vec::new();

stack.push(1);
stack.push(2);
stack.push(3);

while let Some(top) = stack.pop() {
    println!("{}", top);
}
```

### for

Rust 提供的遍历执行。

```rust
for x in 0..10 {
    println!("{}", x); // x: i32
}

let v = vec!['a', 'b', 'c'];

for (index, value) in v.iter().enumerate() {
    println!("{} is at index {}", value, index);
}
```

更抽象的形式：

```rust
for var in expression {
    code
}
```

这个表达式是一个[迭代器](Iterators 迭代器.md).迭代器返回一系列的元素。`0..10`表达式取一个开始和结束的位置，然后给出一个含有这之间值得迭代器。它不包括上限值，所以我们的循环会打印`0`到`9`。

## Enumerate方法

当你需要记录你已经循环了多少次了的时候，你可以使用`.enumerate()`函数。

### 对范围（On ranges）：

```rust
for (i,j) in (5..10).enumerate() {
    println!("i = {} and j = {}", i, j);
}
```

输出：

```text
i = 0 and j = 5
i = 1 and j = 6
i = 2 and j = 7
i = 3 and j = 8
i = 4 and j = 9
```

### 对迭代器（On iterators）

```rust
let lines = "hello\nworld".lines();
for (linenumber, line) in lines.enumerate() {
    println!("{}: {}", linenumber, line);
}
```

输出：

```text
0: hello
1: world
```

## 提早结束迭代

让我们再看一眼之前的`while`循环：

```rust
let mut x = 5;
let mut done = false;

while !done {
    x += x - 3;

    println!("{}", x);

    if x % 5 == 0 {
        done = true;
    }
}
```

我们必须使用一个`mut`布尔型变量绑定，`done`,来确定何时我们应该推出循环。

**Rust 有两个关键字帮助我们来修改迭代：`break`和`continue`**

- break 用来跳出当前层的循环；
- continue 用来执行当前层的下一次迭代。

```rust
let mut x = 5;

loop {
    x += x - 3;

    println!("{}", x);

    if x % 5 == 0 { break; }
}
```

现在我们用`loop`来无限循环，然后用`break`来提前退出循环。

`continue`比较类似，不过不是退出循环，它直接进行下一次迭代。下面的例子只会打印奇数：

```rust
for x in 0..10 {
    if x % 2 == 0 { continue; }

    println!("{}", x);
}
```

`break`和`continue`在`while`循环和[`for`循环](#for)中都有效。

## 循环标签（Loop labels）

你也许会遇到这样的情形，当你有嵌套的循环而希望指定你的哪一个`break`或`continue`该起作用。就像大多数语言，默认`break`或`continue`将会作用于最内层的循环。当你想要一个`break`或`continue`作用于一个外层循环，你可以使用标签来指定你的`break`或`continue`语句作用的循环。如下代码只会在`x`和`y`都为奇数时打印他们：

```rust
'outer: for x in 0..10 {
    'inner: for y in 0..10 {
        if x % 2 == 0 { continue 'outer; } // continues the loop over x
        if y % 2 == 0 { continue 'inner; } // continues the loop over y
        println!("x: {}, y: {}", x, y);
    }
}
```
