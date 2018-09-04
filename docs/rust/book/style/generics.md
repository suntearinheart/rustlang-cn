# 泛型

我们可以使用泛型定义函数，结构体，枚举和方法

```rust
fn foo<T>(x: T)
fn bar<T>(x: T, y: T)       // 兩個以上同型別參數
fn baz<T, U>(x: T, y: U)    //兩個以上同型別參數

struct Foo<T> {
    x: T,
    y: T
}

impl<T> Foo<T> {
   fn do_something(x: T, ...) -> ... {
       // Implement method here
   }
}

impl<T> Bar for Foo<T> {
    fn method_from_bar(x: T, ...) -> ... {
        // Implement method here
    }
}

enum Option<T> {
    Some(T),
    None,
}
```

## 泛型结构体

```rust
struct Point<T, U> {
    x: T,
    y: U,
}

fn main() {
    let both_integer = Point { x: 5, y: 10 };
    let both_float = Point { x: 1.0, y: 4.0 };
    let integer_and_float = Point { x: 5, y: 4.0 };
}
```

## 泛型枚举

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

## 泛型方法

```rust
struct Point<T, U> {
    x: T,
    y: U,
}

impl<T, U> Point<T, U> {
    fn mixup<V, W>(self, other: Point<V, W>) -> Point<T, W> {
        Point {
            x: self.x,
            y: other.y,
        }
    }
}

fn main() {
    let p1 = Point { x: 5, y: 10.4 };
    let p2 = Point { x: "Hello", y: 'c'};

    let p3 = p1.mixup(p2);

    println!("p3.x = {}, p3.y = {}", p3.x, p3.y);
}
```

## 泛型函数

```rust
use std::ops::Add;

#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

// 为Point实现Add trait
impl Add for Point {
    type Output = Point; //执行返回值类型为Point
    fn add(self, p: Point) -> Point {
        Point{
            x: self.x + p.x,
            y: self.y + p.y,
        }
    }
}

fn add<T: Add<T, Output=T>>(a:T, b:T) -> T {
    a + b
}

fn main() {
    println!("{}", add(100i32, 1i32));
    println!("{}", add(100.11f32, 100.22f32));

    let p1 = Point{x: 1, y: 1};
    let p2 = Point{x: 2, y: 2};
    println!("{:?}", add(p1, p2));
}
```

>**输出:**
>101
200.33
Point { x: 3, y: 3 }

我们增加了自定义的类型，然后让add函数依然可以在上面工作。

```rust
use std::ops::Add;

#[derive(Debug)]
struct Point<T: Add<T, Output = T>> { //限制类型T必须实现了Add trait，否则无法进行+操作。
    x: T,
    y: T,
}

impl<T: Add<T, Output = T>> Add for Point<T> {
    type Output = Point<T>;

    fn add(self, p: Point<T>) -> Point<T> {
        Point{
            x: self.x + p.x,
            y: self.y + p.y,
        }
    }
}

fn add<T: Add<T, Output=T>>(a:T, b:T) -> T {
    a + b
}

fn main() {
    let p1 = Point{x: 1.1f32, y: 1.1f32};
    let p2 = Point{x: 2.1f32, y: 2.1f32};
    println!("{:?}", add(p1, p2));

    let p3 = Point{x: 1i32, y: 1i32};
    let p4 = Point{x: 2i32, y: 2i32};
    println!("{:?}", add(p3, p4));
}
```

>**输出：**
>Point { x: 3.2, y: 3.2 }
Point { x: 3, y: 3 }

我们不仅让自定义的Point类型支持了add操作，同时我们也为Point做了泛型化。

实际撰写泛型程式时，设定相关的trait相当重要，Rust需要足够的资讯来判断泛型中的变数是否能够执行特定的行为，而这个资讯是透过trait来指定

```rust
use std::fmt;
 
pub struct Point<T> where T: Copy + fmt::Display {
    x: T,
    y: T
}
 
impl<T> Point<T> where T: Copy + fmt::Display {
    pub fn new(x: T, y: T) -> Point<T> {
        Point::<T>{ x: x, y: y }
    }
}
 
impl<T> Point<T> where T: Copy + fmt::Display {
    pub fn x(&self) -> T {
        self.x
    }
}
 
impl<T> Point<T> where T: Copy + fmt::Display {
    pub fn y(&self) -> T {
        self.y
    }
}
 
impl<T> fmt::Display for Point<T> where T: Copy + fmt::Display {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x(), self.y())
    }
}
 
fn main() {
    let p1 = Point::<i32>::new(3, 4);
    println!("{}", p1);
 
    let p2 = Point::<f64>::new(2.4, 3.6);
    println!("{}", p2);
}

```

## 实例：实作向量运算

我们用一个比较长的例子展示如何实作泛型程式在我们这个例子中，我们实作向量类别，这个类别可以进行向量运算;为了简化范例，我们仅实作向量加法首先，建立Vector类别，内部使用Rust内建的vector来储存资料，在这里一并呼叫相关的特征：

```rust
extern crate num;

use std::fmt;
use std::ops::Add;

pub struct Vector<T> where T: Copy + fmt::Display + num::Num {
     vec: Vec<T>,
}

//接著，實作 Clone trait，使得本向量類別可以像基礎型別般，在計算時拷貝向量，由於 Rust 的限制，目前不能實作 Copy trait。

impl<T> Clone for Vector<T> where T: Copy + fmt::Display + num::Num {
     fn clone(&self) -> Vector<T> {
         let mut vec: Vec<T> = Vec::new();

         for i in 0..(self.vec.len()) {
             vec.push(self.vec[i]);
         }

         Vector::<T>{ vec: vec }
     }
 }

 // 我們的建構子可接受 slice，簡化建立物件的流程：

 // Constructor
impl<T> Vector<T> where T: Copy + fmt::Display + num::Num {
    pub fn from_slice(v: &[T]) -> Vector<T> {
        let mut vec: Vec<T> = Vec::new();

        for i in 0..(v.len()) {
             vec.push(v[i])
        }

        Vector::<T>{ vec: vec }
    }
}

// 實作 fmt::Debug trait，之後可直接從 console 印出本類別的內容。這裡實作的方式參考 Rust 的 vector 在終端機印出的形式。

// Overloaded debug string
impl<T> fmt::Debug for Vector<T> where T: Copy + fmt::Display + num::Num {
    fn fmt(&self, f:&mut fmt::Formatter) -> fmt::Result {
        let mut s = String::new();

        s += "[";

        for i in 0..(self.vec.len()) {
            s += &format!("{}", self.vec[i]);

            if i < self.vec.len() - 1 {
                s += ", ";
            }
        }

        s += "]";

        // Write string to formatter
        write!(f, "{}", s)
    }
}

// 实作加法运算子，需实作std::ops::Add性状。向量加法的方式是两向量间同位置元素相加，相加前应检查两向量是否等长。

// Overloaded binary '+' operator
impl<T> Add for Vector<T> where T: Copy + fmt::Display + num::Num {
    type Output = Vector<T>;

    fn add(self: Vector<T>, other: Vector<T>) -> Vector<T> {
        if self.vec.len() != other.vec.len() {
            panic!("The length of the two vectors are unequal");
        }

        let mut v: Vec<T> = Vec::new();

        for i in 0..(self.vec.len()) {
            v.push(self.vec[i] + other.vec[i]);
        }

        Vector{ vec: v }
    }
}

// 最後，從外部程式呼叫此類別：

fn main() {
    let v1 = vec![1, 2, 3];
    let v2 = vec![2, 3, 4];

    let vec1 = Vector::<i32>::from_slice(&v1);
    let vec2 = Vector::<i32>::from_slice(&v2);

    // We have to explictly clone our Vector object at present.
    let vec3 = vec1.clone() + vec2.clone();

    println!("{:?}", vec1);
    println!("{:?}", vec2);
    println!("{:?}", vec3);
}

```

由于Rust为了保持函数库的相容性，现阶段不允许对非copy data实作复制trait，像是本例的向量类别内部使用的vector，所以，我们必须在外部程序中明确地拷贝向量类别。经笔者实测，对于有解构子的类别也不能使用Copy trait，所以，即使我们用C风格的阵列重新实作vector，同样也不能用Copy trait。

另外，我们在这里用了一个外部函数库提供Num trait，这个trait代表该型别符合数字，透过使用这个trait，不需要重新实现代表数字的trait，简化我们的程式。

刚开始写Rust泛型程式时，会遭到许多错误而无法顺利编译，让初学者感到挫折。解决这个问题的关键在于Rust的trait系统。撰写泛型程式时，若没有对泛型变数T加上任何的trait限制，Rust没有足够的信息是否能对T呼叫相对应的内建trait，因而引发错误讯息。即使是使用运算子，Rust也会呼叫相对应的trait;因此，熟悉trait的运作，对撰写泛型程式有相当的帮助。

## （案例选读）模拟方法重载

Rust不支持方法重载，不过，可以利用泛型加上多型达到类似的效果。由于呼叫泛型函数时，不需要明确指定参数的型别，使得外部程式在呼叫该函式时，看起来像是方法重载般。接下来，我们以一个范例来展示如何模拟方法重载。首先，定义公开的特质：

```rust
use std::fmt;

// An holder for arbitrary type
pub trait Data: fmt::Display {
    // Omit interface
    // You may declare more methods later.
}

pub trait IntoData {
    type OutData: Data;

    fn into_data(&self) -> Self::OutData;
}

// 接着，实作Reader类别，在这个类别中，实作了一个泛型函数，搭配先前的特征类别来模拟方法重载：

pub struct Reader {}

// Use generic method to mimic functional overloading
impl<'a> Reader {
    pub fn get_data<I>(& self, data: I) -> Box<Data + 'a>
    where I: IntoData<'a> + 'a {
        Box::new(data.into_data())
    }
}

// 接着，实作StrData类别，这个类别会实作Data和IntoData这两个trait，以满足前述介面所定义的行为：

pub struct StrData<'a> {
    str: &'a str
}

impl<'a> StrData<'a> {
    pub fn new(s: &'a str) -> StrData<'a> {
        StrData{ str: s }
    }
}

impl<'a> fmt::Display for StrData<'a> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.str)
    }
}

impl<'a> Data for StrData<'a> {
    // Omit implementation
}

impl<'a> IntoData<'a> for StrData<'a> {
    type OutData = &'a str;

    fn into_data(&self) -> &'a str {
        self.str
    }
}

/* Even Data trait is empty, it is necessary to
   explictly implement it. */
impl<'a> Data for &'a str {
    // Omit implementation
}

// 接着，类似以StrData的方式实动词} IntData：

pub struct IntData{
    int: i32
}

impl IntData {
    pub fn new(i: i32) -> IntData {
        IntData{ int: i }
    }
}

impl fmt::Display for IntData {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.int)
    }
}

impl Data for IntData {
    // Omit implementation
}

impl IntoData for IntData {
    type OutData = i32;

    fn into_data(&self) -> i32 {
        self.int
    }
}

/* Even Data trait is empty, it is necessary to
   explictly implement it. */
impl<'a> Data for i32 {
    // Omit implementation
}

// 最后，从外部程式呼叫：

fn main() {
    let reader = Reader{};
    let str_data = StrData::new("string data");
    let int_data = IntData::new(10);

    // Call hidden generic method to minic functional overloading
    let str = reader.get_data(str_data);
    let int = reader.get_data(int_data);

    println!("Data from StrData: {}", str);
    println!("Data form IntData: {}", int);
}
```

在我们这个范例中，除了用泛型的机制模拟出方法重载以外，一个另外重点在于get_data函式隐藏了一些内部的操作，对于程式设计者来说，实只要动词} Data状语从句：IntoData后，从外部程式呼叫时，不需要在意其中操作的细节，这也是物件导向的优点之一。