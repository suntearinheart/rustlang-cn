# 枚举

枚举允许你通过列举可能的值来定义一个类型。Rust 的枚举分为2种，一种是无数据的枚举，一种是有数据的枚举。

```rust
enum Day {
    Sunday,
    Monday,
    Tuesday,
    Wednesday,
}

enum Message {
    Quit,                                   // 没有关联任何数据
    Write(String),                          //包含单独一个 String
    Dog(String, f64),
    ChangeColor(i32, i32, i32),             // 包含三个 i32
    Object(Box<HashMap<String, Json>>)，
    Cat { name: String, weight: f64 },      //包含一个匿名结构体
    ItsComplicated(Option<String>),
    ItsExtremelyComplicated {
        car: DifferentialEquation,
        dgh: EarlyModernistPoem,
    }
}

enum Option<T> {
    None,
    Some(T),
}
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

我们使用`::`语法来使用枚举的成员：

```rust
enum Message {
     Move { x: i32, y: i32 },
}
let x: Message = Message::Move { x: 3, y: 4 };

enum BoardGameTurn {
    Move { squares: i32 },
    Pass,
}

let y: BoardGameTurn = BoardGameTurn::Move { squares: 1 };
```

这两个变量都叫做`Move`，不过他们包含在枚举名字中，他们可以无冲突的使用。

枚举类型的一个值包含它是哪个变量的信息，以及任何与变量相关的数据。这有时被作为一个“标记的联合”被提及。因为数据包括一个“标签”表明它的类型是什么。编译器使用这个信息来确保安全的访问枚举中的数据。例如，我们不能简单的尝试解构一个枚举值，就像它是其中一个可能的变体那样：

```rust
fn process_color_change(msg: Message) {
    let Message::ChangeColor(r, g, b) = msg; // compile-time error
}
```

不支持这些操作（比较操作）可能看起来更像限制。不过这是一个我们可以克服的限制。有两种方法：我们自己实现相等（比较），或通过[`match` ](Match 匹配.md)表达式模式匹配变量，你会在下一部分学到它。我们还不够了解Rust如何实现相等，不过我们会在[特性](Traits.md)找到它们。

## 零变量枚举

零成员变量的枚举称为零变量枚举。 由于它们没有有效值，因此无法实例化它们。

```rust
enum ZeroVariants {}
```

## 自定义无字段枚举的值

在内存中，C风格枚举的值存储为整数。 偶尔它会很有用告诉Rust要使用哪个整数，默认Rust会为你分配数字，从0开始。Rust使用最小的内置整数类型存储C风格的枚举
容纳他们。 大多数适合单个字节,这些枚举可以通过数字转换使用as运算符转换为整数类型。 

枚举可以选择通过使用变量名后面的`=`来指定每个判别式获得的整数。 如果声明中的第一个变量未指定，则将其设置为零。 对于每个未指定的判别式，它都设置为比声明中的前一个变量高一个。

```rust
enum Foo {
    Bar,            // 0
    Baz = 123,      // 123
    Quux,           // 124
}

let baz_discriminant = Foo::Baz as u32;
assert_eq!(baz_discriminant, 123);
```

在[默认表示]下，指定的判别式被解释为isize值，尽管允许编译器在实际的内存布局中使用较小的类型。 可以通过使用[原始表示]或[C表示]来更改大小和可接受的值。

当两个变体共享相同的判别式时，这是一个错误。

```rust
enum SharedDiscriminantError {
    SharedA = 1,
    SharedB = 1
}

enum SharedDiscriminantError2 {
    Zero,       // 0
    One,        // 1
    OneToo = 1  // 1 (collision with previous!)
}
```

具有未指定的判别式也是错误的，其中先前的判别式是判别式的大小的最大值。

```rust
#[repr(u8)]
enum OverflowingDiscriminantError {
    Max = 255,
    MaxPlusOne // Would be 256, but that overflows the enum.
}

#[repr(u8)]
enum OverflowingDiscriminantError2 {
    MaxMinusOne = 254, // 254
    Max,               // 255
    MaxPlusOne         // Would be 256, but that overflows the enum.
}
```
