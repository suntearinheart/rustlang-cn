# 面向对象

物件导向是一种将程式码以更高的层次组织起来的方法。大部分的物件导向以类别(class) 为基础，透过类别可产生实际的物件(object) 或实体(instance) ，类别和物件就像是饼干模子和饼干的关系，透过同一个模子可以产生很多片饼干。物件拥有属性(field) 和方法(method)，属性是其内在状态，而方法是其外在行为。透过物件，状态和方法是连动的，比起传统的程序式程式设计，更容易组织程式码。

许多物件导向语言支援封装(encapsulation)，透过封装，程式设计者可以决定物件的那些部分要对外公开，​​那些部分仅由内部使用，封装不仅限于静态的资料，决定物件应该对外公开的行为也是封装。当多个物件间互动时，封装可使得程式码容易维护，反之，过度暴露物件的内在属性和细部行为会使得程式码相互纠结，难以除错。

物件间可以透过组合(composition)再利用程式码。物件的属性不一定要是基本型别，也可以是其他物件。组合是透过有… (has-a)关系建立物件间的关连。例如，汽车物件有引擎物件，而引擎物件本身又有许多的状态和行为。继承(inheritance)是另一个再利用程式码的方式，透过继承，子类别(child class)可以再利用父类别(parent class)的状态和行为。继承是透过是… (is-a)关系建立物件间的关连。例如，研究生物件是学生物件的特例。然而，过度滥用继承，容易使程式码间高度相依，造成程式难以维护。可参考组合胜过继承(composition over inheritance)这个指导原则来设计自己的专案。

透过多型(polymorphism) 使用物件，不需要在意物件的实作，只需依照其公开介面使用即可。例如，我们想用汽车物件执行开车这项行为，不论使用Honda 汽车物件或是Ford 汽车物件，都可以执行开车这项行为，而不需在意不同汽车物件间的实作差异。多型有许多种形式，如：

- 特定多态(ad hoc polymorphism)：
  - 函数重载(functional overloading)：同名而不同参数型别的方法(method)
  - 运算子重载(operator overloading) ： 对不同型别的物件使用相同运算子(operator)
- 泛型(generics)：对不同型别使用相同实作
- 子类型(Subtyping)：不同子类别共享相同的公开介面，不同语言有不同的继承机制

以物件导向实作程式，需要从宏观的角度来思考，不仅要设计单一物件的公开行为，还有物件间如何互动，以达到良好且易于维护的程式码结构。

## 类别

在Rust，以struct 或enum 定义可实体化的类别。

```rust
struct Point {
    x : f64 ,
    y : f64
}
fn main ( ) {
    let p = Point { x : 3.0 , y : 4.0 } ;
    println ! ( "({}, {})" , p.x , p.y ) ;
}
```

只有属性而没有方法的类别不太实用，另外，对于不可实体化的抽象类别，使用trait 来达成；trait 在物件导向及泛型中都相当重要

## 方法

**公开方法和私有方法:**

方法是类别或物件可执行的动作，公开方法(public method) 可由物件外存取，而私有方法(private method) 则仅能由物件内存取。以下为实例：

```rust

mod lib {
    pub struct Car ;
    impl Car {
        // Public method
        pub fn run ( & self ) {
            // Call private method
            self .drive ( ) ;
        }
        // Private method
        fn drive ( & self ) {
            println ! ( "Driving a car..." ) ;
        }
    }
}
fn main ( ) {
    let car = lib :: Car { } ;
    car.run ( ) ;
}
```

## Getters 和Setters

我们的setter 没有特别的行为，但日后我们需要对资料进行筛选或转换时，只要修改setter 方法即可，其他部分的程式码则不受影响。在撰写物件导向程式时，我们会尽量将修改的幅度降到最小。

```rust
pub struct Point {
    x : f64 ,
    y : f64,
}

impl Point {
    // Constructor, which is just a regular method
    pub fn new ( x : f64 , y : f64 ) -> Point {
        let mut p = Point { x : 0.0 , y : 0.0 } ;
        // Set the fields of Point through setters
        p.set_x ( x ) ;
        p.set_y ( y ) ;
        p
    }
    // Setter for x, private
    fn set_x ( & mut self , x : f64 ) {
        self .x = x ;
    }
    // Setter for y, private
    fn set_y ( & mut self , y : f64 ) {
        self .y = y ;
    }

     // Getter for x, public
    pub fn x ( & self ) -> f64 {
        self .x
    }
    // Getter for y, public
    pub fn y ( & self ) -> f64 {
        self .y
    }
}

fn main ( ) {
    let p = Point :: new ( 3.0 , 4.0 ) ;
    println ! ( "({}, {})" , p.x ( ) , p.y ( ) ) ;
}

```

## 解构

若要实作Rust 类别的解构子(destructor)，实作Drop trait 即可。由于Rust 会自动管理资源，纯Rust 实作的类别通常不需要实作解构子，但有时仍需要实作Drop trait，像是用到C 语言函式配置记忆体，则需明确于解构子中释放记忆体。

## 多态

Rust使用trait来实作多态；透过trait，Rust程式可像动态语言般使用不同类别。我们用一个实际的范例来说明。

首先，用trait设立共有的公开方法：

```rust
pub trait Drive {
    fn drive ( & self ) ;
}

// 建立三个不同的汽车类别，这三个类别各自实作Drivetrait：
pub struct Toyota ;
 
impl Drive for Toyota {
    fn drive ( & self ) {
        println ! ( "Driving a Toyota car" ) ;
    }
}
 
pub struct Honda ;
 
impl Drive for Honda {
    fn drive ( & self ) {
        println ! ( "Driving a Honda car" ) ;
    }
}
 
pub struct Ford ;
 
impl Drive for Ford {
    fn drive ( & self ) {
        println ! ( "Driving a Ford car" ) ;
    }
}

// 透过多型的机制由外部程式呼叫这三个类别：
fn main ( ) {
    let mut cars = Vec :: new ( ) as Vec < Box < Drive >>;
    cars.push ( Box :: new ( Toyota ) ) ;
    cars.push ( Box :: new ( Honda ) ) ;
    cars.push ( Box :: new ( Ford ) ) ;
    for c in & cars {
        c.drive ( ) ;
    }
}
```

在本例中，Toyota、Honda和Ford三个类别实质上是各自独立的，透过Drivetrait，达成多型的效果，从外部程式的角度来说，这三个物件视为同一个型别，拥有相同的行为。由于trait无法直接实体化，必需借助`Box<T>`等容器才能将其实体化，`Box<T>`会从堆积(heap)配置记忆体，并且不需要解参考，相当于C/C++的smart pointer。

## 组合胜于继承

Rust 的struct 和enum 无法继承，而trait 可以继承，而且trait 支援多重继承(multiple inheritance) 的机制；trait 可提供介面和实作，但本身无法实体化，反之，struct 和enum 可以实体化。Rust 用这样的机制避开C++ 的菱型继承(diamond inheritance) 问题，类似Java 的interface 的味道。

组合就是将某个类别内嵌在另一个类别中，变成另一个类别的属性，然后再透过多型提供相同的公开介面，外部程式会觉得好像类别有继承一般。

```rust
pub trait Priority {
    fn get_priority ( & self ) -> i32 ;
    fn set_priority ( & mut self , value : i32 ) ;
}

pub struct Creature {
    priority : i32 ,
    // Other fields omitted.
}
impl Creature {
    pub fn new ( ) -> Creature {
        Creature { priority : 0 }
    }
}
impl Priority for Creature {
     fn get_priority ( & self ) -> i32 {
         self .priority
     }
     fn set_priority ( & mut self , value : i32 ) {
         self .priority = value ;
     }
}

// 我们透过组合的机制将Creature 类别变成Character 类别的一部分：
pub struct Character {
    // Creature become a member of Character
   creature : Creature ,
   // Other field omitted.
}
 
impl Character {
    pub fn new ( ) -> Character {
       let c = Creature :: new ( ) ;
       Character { creature : c }
    }
}
impl Priority for Character {
    fn get_priority ( & self ) -> i32 {
        self .creature.get_priority ( )
    }
    fn set_priority ( & mut self , value : i32 ) {
        self .creature.set_priority ( value ) ;
    }
}

fn main ( ) {
    let mut goblin = Creature :: new ( ) ;
    let mut fighter = Character :: new ( ) ;
    println ! ( "The priority of the goblin is {}" , goblin.get_priority ( ) ) ;
    println ! ( "The priority of the fighter is {}" , fighter.get_priority ( ) ) ;
    println ! ( "Set the priority of the fighter" ) ;
    fighter.set_priority ( 2 ) ;
    println ! ( "The priority of the fighter is {} now" ,
        fighter.get_priority ( ) ) ;
}
```

Creature 是Character 的属性，但从外部程式看来，无法区分两者是透过继承还是组合得到相同的行为。struct 无法继承，而trait 可以继承。

```rust
// 。首先，定义Color 和Sharp trait，接着由Item trait 继承前两个trait：
pub trait Color {
    fn color < 'a>(&self) -> &' a str ;
}
 
// Parent trait
pub trait Shape {
    fn shape < 'a>(&self) -> &' a str ;
}
 
// Child trait
pub trait Item : Color + Shape {
    fn name < 'a>(&self) -> &' a str ;
}

// 实作Orange 类别，该类别实作Color trait：
pub struct Orange { }
 
impl Color for Orange {
     fn color < 'a>(&self) -> &' a str {
         "orange"
    }
}

// 实作Ball 类别，该类别实作Shape trait：
pub struct Ball { }
 
impl Shape for Ball {
    fn shape < 'a>(&self) -> &' a str {
        "ball"
    }
}

// 实作Basketball 类别，该类别透过多型机制置入Color 和Shape 两种类别：
pub struct Basketball {
     color : Box < Color >,
     shape : Box < Shape >,
}
 
impl Basketball {
    pub fn new ( ) -> Basketball {
        let orange = Box :: new ( Orange { } ) ;
        let ball = Box :: new ( Ball { } ) ;
        Basketball { color : orange , shape : ball }
    }
}
 
impl Color for Basketball {
    fn color < 'a>(&self) -> &' a str {
        self .color.color ( )
    }
}
 
impl Shape for Basketball {
    fn shape < 'a>(&self) -> &' a str {
        self .shape.shape ( )
    }
}
 
impl Item for Basketball {
    fn name < 'a>(&self) -> &' a str {
        "basketball"
    }
}

fn main ( ) {
    let b : Box < Item >= Box :: new ( Basketball :: new ( ) ) ;
    println ! ( "The color of the item is {}" , b.color ( ) ) ;
    println ! ( "The shape of the item is {}" , b.shape ( ) ) ;
    println ! ( "The name of the item is {}" , b.name ( ) ) ;
}
```

在本程式中，Item 继承了Color 和Shape 的方法，再加上自身的方法，共有三个方法。在实作Basketball 物件时，则需要同时实作三者的方法；在我们的实作中， color 和shape 这两个属性实际上是物件，由这些内部物件提供相关方法，但由外部程式看起来像是静态的属性，这里利用到物件导向的封装及组合，但外部程式不需担心内部的实作，展现物件导向的优点。

在撰写物件导向程式时，可将trait 视为没有内建状态的抽象类别。然而，trait 类别本身不能实体化，要使用Box等容器来实体化。这些容器使用到泛型的观念，在本章，我们暂时不会深入泛型的概念，基本上，透过泛型，同一套程式码可套用在不同型别上。

## 方法重载

方法重载指的是相同名称的方法，但参数不同。Rust 不支援方法重载，如果有需要的话，可以用泛型结合抽象类别来模拟，可见泛型范例。

## 运算子重载

Rust 的运算子重载利用了内建trait 来完成。每个Rust 的运算子，都有相对应的trait，在实作新类别时，只要实作某个运算子对应的trait，就可以直接使用该运算子。运算子重载并非物件导向必备的功能，像是Java 和Go 就没有提供运算子重载的机制。善用运算子重载，可减少使用者记忆公开方法的负担，但若运算子重载遭到滥用，则会产生令人困惑的程式码。

在本范例中，我们实作有理数(rational number) 及其运算，为了简化范例，本例仅实作加法。首先，宣告有理数型别，一并呼叫要实作的trait：

```rust
use std :: ops :: Add ;
// Trait for formatted string
use std :: fmt ;
// Automatically implement Copy and Clone trait
// Therefore, our class acts as a primitive type
# [ derive ( Copy , Clone ) ]
pub struct Rational {
    num : i32 ,
    denom : i32 ,
}

// 实作其建构子，在内部，我们会求其最大公约数后将其约分：
impl Rational {
    pub fn new ( p : i32 , q : i32 ) -> Rational {
        if q == 0 {
            panic ! ( "Denominator should not be zero." ) ;
        }
        let d = Rational :: gcd ( p , q ) .abs ( ) ;
        Rational { num : p / d , denom : q / d }
    }
}
 
impl Rational {
    fn gcd ( a : i32 , b : i32 ) -> i32 {
        if b == 0 {
            a
        } else {
            Rational :: gcd ( b , a % b )
        }
    }
}

// 实作加法运算，在这里，实作Add trait，之后就可以直接用+ 运算子来计算：
impl Add for Rational {
    type Output = Rational ;
    fn add ( self , other : Rational ) -> Rational {
         let p = self .nu​​m * other.denom + other.num * self .denom ;
         let q = self .denom * other.denom ;
         Rational :: new ( p , q )
     }
 }

 // 我们额外实作Display trait，方便​​我们之后可以直接从终端机印出有理数：

impl fmt :: Display for Rational {
    fn fmt ( & self , f : & mut fmt :: Formatter ) -> fmt :: Result {
        let is_positive = ( self .nu​​m > 0 && self .denom > 0 )
            || ( self .nu​​m < 0 && self .denom < 0 ) ;
        let sign = if is_positive { "" } else { "-" } ;
        write ! ( f , "{}{}/{}" , sign , self .nu​​m.abs ( ) , self .denom.abs ( ) )
    }
}


fn main ( ) {
     let a = Rational :: new ( - 1 , 4 ) ;
     let b = Rational :: new ( 1 , 5 ) ;
     // Call operator-overloaded binary '+' operator
     let y = a + b ;
     // Call operator-overloaded formated string
     println ! ( "{} + {} = {}" , a , b , y ) ;
}

```
