# 数据类型

## 一：原始类型

- array : 固定大小的数组，表示为[T; N]，目前其`trait`实现是静态生成最大到32。
- bool ：有两个值true和false。
- char ：单个Unicode值，存储为4个字节。Rust支持(u8)单字节字符b'H',仅限制于ASCII字符。
- number ：有符号整数 (i8,i16,i32,i64,i128,isize)、无符号整数 (u8,u16,u32,u64,u128,usize) 浮点数(f32,f64).整形默认为i32，浮点型默认为f64.
- str：常用&str和堆分配字符串String，&str是静态分配，固定大小，不可变，堆分配字符串是可变的。Rust支持单字节字符串b"Hello"和原始字节字符串使用br#"hello"#，仅限于ASCII字符,不需要对特殊字符进行转义。
- slice : slice是以指针和长度表示的内存块的视图。一个动态大小的视图变成一个连续的序列[T],slice是可变的或共享的。共享类型是&[T]可变类型&mut [T]、Box<[T]
- fn ：具有函数类型的变量实质上是一个函数指针。
- pointer ：最底层的是裸指针\*const T和\*mut T，但解引用它们是不安全的，必须放到unsafe块里。
- reference : 共享引用(&)、可变引用(&mut). 或者使用ref或ref mut模式来得到一个。
- tuple : 一个有限的异构序列，(T, U, ..).不多于12个元素的元组在值传递时是自动复制的。
- never:  `!`类型，没有值的类型.
- unit : `()`类型,也称为 "unit" 或 "nil".

## 二：自定义类型/递归类型

- 结构体(struct)
- 枚举(enum)
- [联合union](https://doc.rust-lang.org/reference/items/unions.html)

## 三：标准库数据类型

- String : UTF-8编码，可扩展的字符串
- Box : 智能指针
- Sequences: Vec, VecDeque, LinkedList
- Maps: HashMap, BTreeMap
- Sets: HashSet, BTreeSet
- Misc: BinaryHeap

## 指针类型

Rust中的所有指针都是显式的第一类值。 它们可以被移动或复制，存储到数据结构中，并从函数返回。

- 共享参考（＆）
- 可变引用（＆mut）
- 原始指针（* const和* mut）
- 智能指针（STD包含超出引用和原始指针的附加'智能指针'类型。）

## Function item types

没有直接引用函数项类型的语法，但编译器会在错误消息中将类型显示为`fn（u32） - > i32 {fn_name}`。 所有函数项都实现`Fn`，`FnMut`，`FnOnce`，`Copy`，`Clone`，`Send`和`Sync`。

## 元组（Tuples）

元组（tuples）是固定大小的有序列表。如下：

```rust
let x = (1, "hello");
let x: (i32, &str) = (1, "hello");

let mut x = (1, 2); // x: (i32, i32)
let y = (2, 3); // y: (i32, i32)
let e = x.1;
x = y;
```

你可以通过一个*解构let*（*destructuring let*）访问元组中的字段。下面是一个例子：

```rust
let (x, y, z) = (1, 2, 3);

println!("x is {}", x);
```

可以在`let`左侧写一个模式，如果它能匹配右侧的话，我们可以一次写多个绑定。这种情况下，`let`“解构”或“拆开”了元组，并分成了三个绑定。

你可以一个逗号来消除一个单元素元组和一个括号中的值的歧义：

```rust
(0,); // single-element tuple
(0); // zero
```

### 元组索引（Tuple Indexing）

你也可以用索引语法访问一个元组的字段,它使用`.`

```rust
let tuple = (1, 2, 3);

let x = tuple.0;
println!("x is {}", x);
```

## `?Sized`

如果你想要写一个接受动态大小类型的函数，你可以使用这个特殊的限制，`?Sized`：

```rust
struct Foo<T: ?Sized> {
    f: T,
}
```

这个`?`，读作“`T`可能是`Sized`的”，意味着这个限制是特殊的：它让我们的匹配更宽松，而不是相反。这几乎像每个`T`都隐式拥有`T: Sized`一样，`?`放松了这个默认（限制）。

## Type parameters

在具有类型参数声明的项的主体内，其类型参数的名称是类型：

```rust
#![allow(unused_variables)]
fn main() {
fn to_vec<A: Clone>(xs: &[A]) -> Vec<A> {
    if xs.is_empty() {
        return vec![];
    }
    let first: A = xs[0].clone();
    let mut rest: Vec<A> = to_vec(&xs[1..]);
    rest.insert(0, first);
    rest
}
}
```

这里，`first`是A类型，指的是`to_vec`的A类型参数; 和`rest`有类型`Vec <A>`，一个元素类型为A的向量。

## Self 类型

特殊类型`Self`在traits和实现中具有含义：它指的是实现类型。 例如：

```rust
pub trait From<T> {
    fn from(T) -> Self;
}

impl From<i32> for String {
    fn from(x: i32) -> Self {
        x.to_string()
    }
}
```

impl中的符号Self表示实现类型：String。 在另一个例子中：

```rust
trait Printable {
    fn make_string(&self) -> String;
}

impl Printable for String {
    fn make_string(&self) -> String {
        (*self).clone()
    }
}
```

**注意：** 符号`&self`是`self: &Self`的简写

## 使用Newtype模式进行类型安全和抽象

`newtype`模式对于我们到目前为止所讨论的任务之外的任务非常有用，包括静态强制执行，这些值永远不会混淆并指示值的单位。

newtype模式的另一个用途是抽象出类型的一些实现细节：如果我们直接使用新类型来限制可用的函数，新类型可以公开与私有内部类型的API不同的公共API。

Newtypes还可以隐藏内部实现。我们可以提供一个People类型来包装`HashMap <i32，String>`，它存储与其名称相关联的人员ID。使用People的代码只会与我们提供的公共API进行交互，例如向People集合添加名称字符串的方法;该代码不需要知道我们在内部为名称分配i32 ID。 newtype模式是一种实现封装以隐藏实现细节的轻量级方法。

## type别名

`type`关键字让你定义一个类型的别名,但不是一个独立的，新的类型,主要用例是减少重复。

```rust
type Name = String;
```

你可以像一个真正类型那样使用这个类型：

```rust
type Kilometers = i32;

let x: i32 = 5;
let y: Kilometers = 5;

println!("x + y = {}", x + y);

// 减少重复
use std::io::Error;
use std::fmt;

type Result<T> = Result<T, std::io::Error>;

pub trait Write {
    fn write(&mut self, buf: &[u8]) -> Result<usize>;
    fn flush(&mut self) -> Result<()>;

    fn write_all(&mut self, buf: &[u8]) -> Result<()>;
    fn write_fmt(&mut self, fmt: Arguments) -> Result<()>;
}
```

## 从不返回的`Never`类型

Rust有一个特殊的类型命名！ 这在类型理论中被称为空类型，因为它没有值。 我们更喜欢将它称为`Never`类型，因为它在函数永远不会返回时代表返回类型。”从不返回的函数称为发散函数,我们无法创建该类型的值.

```rust
let guess: u32 = match guess.trim().parse() {
    Ok(num) => num,
    Err(_) => continue,
};
```

`continue`有一个！ 值。 也就是说，当Rust计算`guess`的类型时，它会查看两个匹配臂，前者的值为u32，后者的值为！ 值。 因为！ 永远不会有值，Rust决定`guess`的类型是u32。

描述这种行为的正式方式是！类型的表达式可以强制进入任何其他类型。 我们被允许以`continue`结束这个匹配组因为`continue`不返回值; 相反，它将控制移回到循环的顶部，因此在Err情况下，我们从不指定`guess`值。

never类型对panic!宏也很有用.

```rust
impl<T> Option<T> {
    pub fn unwrap(self) -> T {
        match self {
            Some(val) => val,
            None => panic!("called `Option::unwrap()` on a `None` value"),
        }
    }
}
```

同样的事情：Rust看到val有类型T和panic！有！类型，所以整体匹配表达式的结果是T.这段代码有效，因为panic！ 没有产生价值; 它结束了程序。 在None情况下，我们不会从unwrap返回值，因此该代码有效。

## 动态大小的类型和`Sized` trait

大多数类型具有在编译时已知的固定大小并实现 trait。 具有仅在运行时已知的大小的类型称为有时也称为DST或unsized类型。 Slices和 trait对象是DST的两个示例。 此类型只能在某些情况下使用：

- 指向DST的指针类型的大小，但其大小是指向大小类型的指针的两倍。指向切片的指针也存储切片的元素数。指向 trait对象的指针也存储指向vtable的指针。
- 当？Sized的边界时，DST可以作为类型参数提供。 默认情况下，任何类型参数都具有Sized范围。
- 可以为DST实施 trait。 与类型参数不同：？ trait定义中默认大小。
- 结构体可能包含DST作为最后一个字段，这使结构体本身成为DST。

值得注意的是：变量，函数参数，const和静态项必须是固定大小。

让我们深入研究一个名为str的动态大小类型的细节，我们在本书中一直在使用它。 这是正确的，不是＆str，而是str，它本身就是DST。 我们不知道字符串在运行时有多长，这意味着我们不能创建str类型的变量，也不能使用str类型的参数。 请考虑以下代码，该代码不起作用：

```rust
let s1: str = "Hello there!";
let s2: str = "How's it going?";
```

Rust需要知道为特定类型的任何值分配多少内存，并且类型的所有值必须使用相同数量的内存。如果Rust允许我们编写此代码，则这两个str值需要占用相同的空间量。但是它们有不同的长度：s1需要12个字节的存储空间而s2需要15个。这就是为什么不可能创建一个包含动态大小类型的变量。

那么我们该怎么办？在这种情况下，您已经知道了答案：我们将s1和s2的类型设为＆str而不是str。回想一下，`String Slices`:切片数据结构存储切片的起始位置和长度。

因此，虽然＆T是存储T所在位置的内存地址的单个值，但＆str是两个值：str的地址及其长度。因此，我们可以在编译时知道＆str值的大小：它是usize长度的两倍。也就是说，无论它引用的字符串有多长，我们总是知道＆str的大小。通常，这是在Rust中使用动态大小类型的方式：它们具有额外的元数据，用于存储动态信息的大小。动态大小类型的黄金法则是我们必须始终将动态大小类型的值放在某种指针之后。

我们可以将str与各种指针结合起来：例如，`Box <str>`或`Rc <str>`。实际上，您之前已经看到了这种情况，但使用了不同的动态大小：traits。每个 trait都是动态大小的类型，我们可以通过使用 trait的名称来引用它。“使用允许不同类型的值的 trait对象”部分中，我们提到要将 trait用作 trait对象，我们必须将它们放在指针后面，例如`＆dyn Trait`或`Box <dyn Trait>`（`Rc < dyn Trait>`也会工作）。

为了使用DST，Rust有一个特殊的特性称为Sized trait，用于确定在编译时是否知道类型的大小。 对于在编译时已知大小的所有内容，将自动实现此 trait。 另外，Rust隐式地在Size上添加了一个绑定到每个泛型函数。 也就是说，这样的通用函数定义：

```rust
fn generic<T>(t: T) {
    // --snip--
}
// 实际上就像我们写过这样：
fn generic<T: Sized>(t: T) {
    // --snip--
}
```

默认情况下，泛型函数仅适用于在编译时具有已知大小的类型。但是，您可以使用以下特殊语法来放宽此限制：

```rust
fn generic<T: ?Sized>(t: &T) {
    // --snip--
}
```

绑定在？Sized上的 trait与Sized上绑定的 trait相反：我们将其视为“T可能或可能不是Sized”。此语法仅适用于Sized，而不适用于任何其他 trait。

另请注意，我们将t参数的类型从T切换为＆T。 因为类型可能不是大小，我们需要在某种指针后面使用它。 在这种情况下，我们选择了一个引用。

## 内部可变性

有时，类型需要在具有多个别名时进行变异。在Rust中，这是使用称为内部可变性的模式实现的。如果类型的内部状态可以通过对它的共享引用进行更改，则该类型具有内部可变性。这违反了通常的要求，即共享引用指向的值不会发生变异。

`std :: cell :: UnsafeCell <T>`类型是Rust中禁止此要求的唯一允许方式。当`UnsafeCell <T>`具有不变的别名时，仍然可以安全地变异，或者获得它包含的T的可变引用。与所有其他类型一样，具有多个`＆mut UnsafeCell  <T>`别名是未定义的行为。

可以使用`UnsafeCell<T>`作为字段来创建具有内部可变性的其他类型。标准库提供了多种类型，可提供安全的内部可变性API。例如，`std :: cell :: RefCell <T>`使用运行时借用检查来确保围绕多个引用的通常规则。 `std :: sync :: atomic`模块包含的类型包含只能通过原子操作访问的值，允许跨线程共享和变换值。

## 类型转换

强制允许在以下类型之间进行：

- T to U if T is a subtype of U (reflexive case)

- T_1 to T_3 where T_1 coerces to T_2 and T_2 coerces to T_3 (transitive case).**Note that this is not fully supported yet**

- &mut T to &T

- *mut T to *const T

- &T to *const T

- &mut T to *mut T

- &T or &mut T to &U if T implements Deref<Target = U>. For example:

```rust
use std::ops::Deref;

struct CharContainer {
    value: char,
}

impl Deref for CharContainer {
    type Target = char;

    fn deref<'a>(&'a self) -> &'a char {
        &self.value
    }
}

fn foo(arg: &char) {}

fn main() {
    let x = &mut CharContainer { value: 'y' };
    foo(x); //&mut CharContainer is coerced to &char.
}
```

- &mut T to &mut U if T implements DerefMut<Target = U>.

- TyCtor(T) to TyCtor(U), where TyCtor(T) is one of

  - &T
  - &mut T
  - *const T
  - *mut T
  - Box< T>
  
    and where T can obtained from U by unsized coercion.

- Non capturing closures to fn pointers

- ! to any T

## Unsized 强制转换

以下强制被称为 Unsized 强制转换，因为它们涉及将大小类型转换为`Unsized`的类型，并且在少数情况下允许其他强制转换，如上所述。 它们仍然可以发生在其他任何可能发生强制转换的地方。

两个特征， `Unsize` 和 `CoerceUnsized`，用于协助此过程并将其公开以供库使用。 这些强制转换是编译器内置的，如果T可以用其中一个强制转换为U，那么编译器将为T提供`Unsize <U>`的实现：

- [T; n] to [T]
- T to U, when U is a trait object type and either T implements U or T is a trait object for a subtrait of U.
- `Foo<..., T, ...>` to `Foo<..., U, ...>`, when: Foo is a struct.
- T implements `Unsize<U>`.
- The last field of Foo has a type involving T.
- If that field has type `Bar<T>`, then `Bar<T>` implements `Unsized<Bar<U>>`.
- T is not part of the type of any other fields.

另外，当T实现`Unsize<U>`或`CoerceUnsized <Foo<U >>`时，类型`Foo<T>`可以实现`CoerceUnsized <Foo<U >>`。 这允许它向`Foo<U>`提供unsized 强制转换。

**注意：虽然Unsized 强制转换的定义及其实施已经稳定，但traits本身尚不稳定，因此不能直接用于稳定的Rust**

## 关联类型

关联类型是与另一种类型关联的类型别名。 关联类型不能在固有实现中定义，也不能在特征中给出默认实现。

标识符是声明的类型别名的名称。 必须通过类型别名的实现来实现可选的trait bounds。

```rust
trait AssociatedType {
    // Associated type declaration
    type Assoc;
}

struct Struct;

struct OtherStruct;

impl AssociatedType for Struct {
    // Associated type definition
    type Assoc = OtherStruct;
}

impl OtherStruct {
    fn new() -> OtherStruct {
        OtherStruct
    }
}

fn main() {
    // Usage of the associated type to refer to OtherStruct as <Struct as AssociatedType>::Assoc
    let _other_struct: OtherStruct = <Struct as AssociatedType>::Assoc::new();
}
```

## 关联常量

关联常量是与类型关联的常量。关联常量定义：它的写法与常量项相同。

```rust
trait ConstantIdDefault {
    const ID: i32 = 1;    // 默认值
}

struct Struct;
struct OtherStruct;

impl ConstantIdDefault for Struct {}

impl ConstantIdDefault for OtherStruct {
    const ID: i32 = 5;
}

fn main() {
    assert_eq!(1, Struct::ID);
    assert_eq!(5, OtherStruct::ID);
}
```

### Characters and strings

type            | Example     | # sets | Characters  | Escapes
----------------|-------------|--------|-------------|------------
Character       | 'H'         | N/A    | All Unicode | Quote & ASCII & Unicode
String          | "hello"     | N/A    | All Unicode | Quote & ASCII & Unicode
Raw             | r#"hello"#  | 0...   | All Unicode | N/A
Byte            | b'H'        | N/A    | All ASCII   | Quote & Byte
Byte string     | b"hello"    | N/A    | All ASCII   | Quote & Byte
Raw byte string | br#"hello"# | 0...   | All ASCII   | N/A

## ASCII escapes

type | Name
-----|-----
\x41 | 7-bit character code (exactly 2 digits, up to 0x7F)
\n   | Newline
\r   | Carriage return
\t   | Tab
\\   | Backslash
\0   | Null

## Byte escapes

type | Name
-----|------
\x7F | 8-bit character code (exactly 2 digits)
\n   | Newline
\r   | Carriage return
\t   | Tab
\\   | Backslash
\0   | Null

## Unicode escapes

type     | Name
---------|------
\u{7FFF} | 24-bit Unicode character code (up to 6 digits)

## Quote escapes

type     | Name
---------|------
\'       | Single quote
\"       | Double quote

## Numbers

\* : All number literals allow _as a visual separator: 1_234.0E+18f64

Number literals\* | Example     | Exponentiation | Suffixes
------------------|-------------|----------------|----------------
Decimal integer  | 98_222      | N/A            | Integer suffixes
Hex integer      | 0xff        | N/A            | Integer suffixes
Octal integer    | 0o77        | N/A            | Integer suffixes
Binary integer   | 0b1111_0000 | N/A            | Integer suffixes
Floating-point   | 123.0E+77   | Optional       | Floating-point suffixes

## Raw string literals

```rust
"foo"; r"foo";                     // foo
"\"foo\""; r#""foo""#;             // "foo"

"foo #\"# bar";
r##"foo #"# bar"##;                // foo #"# bar

"\x52"; "R"; r"R";                 // R
"\\x52"; r"\x52";                  // \x52
```

## [Type Layout](https://doc.rust-lang.org/reference/type-layout.html)

## [Associated Items](https://doc.rust-lang.org/reference/items/associated-items.html)