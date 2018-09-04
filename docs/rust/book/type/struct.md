# 结构体

结构体可以创建更复杂数据类型,大写字母开头并且驼峰命名法.生命周期和泛型都写在 `<>` 里，先生命周期后泛型，用`,`分隔,只有`struct`的最后一个字段可能拥有一个动态大小类型；其它字段则不可以拥有动态大小类型。枚举变量不可以用动态大小类型作为数据。

* 结构体里的引用字段必须要有显式的生命周期
* 一个被显式写出生命周期的结构体，其自身的生命周期一定小于等于其显式写出的任意一个生命周期

Rust 的结构体三种：

* C风格结构体
* 元組结构体
* 单元结构体

## C风格结构体

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let origin = Point { x: 0, y: 0 }; // origin: Point
    let mut do = Point { x: 1, y: 2 };
    do.x = 5;

    println!("The origin is at ({}, {})", origin.x, origin.y);
    println!("The origin is at ({}, {})", do.x, do.y);
}
```

Rust 不支持结构体字段可变性，可变性是绑定的一个属性。

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let mut point = Point { x: 0, y: 0 };

    point.x = 5;

    let point = point; // now immutable

    point.y = 6; // this causes an error
}
```

结构体包含`&mut`指针，它会给你一些类型的可变性：

```rust
struct Point {
    x: i32,
    y: i32,
}

struct PointRef<'a> {
    x: &'a mut i32,
    y: &'a mut i32,
}

fn main() {
    let mut point = Point { x: 0, y: 0 };

    {
        let r = PointRef { x: &mut point.x, y: &mut point.y };

        *r.x = 5;
        *r.y = 6;
    }

    assert_eq!(5, point.x);
    assert_eq!(6, point.y);
}
```

## 元组结构体

元组结构体有着结构体名称提供的含义，但没有具体的字段名，只有字段的类型。

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

//这里`black`和`origin`并不相等，即使它们有一模一样的值：
let black = Color(0, 0, 0);
let origin = Point(0, 0, 0);
```

当元组结构体只有一个元素时。我们管它叫*新类型*（*newtype*），创建了一个与元素相似的类型：

```rust
struct Inches(i32);

let length = Inches(10);

let Inches(integer_length) = length;
println!("length is {} inches", integer_length);
```

可以通过一个解构`let`来提取内部的整型，`let Inches(integer_length)`给`integer_length`赋值为`10`。

## 单元结构体

定义一个没有任何成员的结构体，类似于 ()，即 unit 类型。类单元结构体常常在你想要在某个类型上实现 trait 但不需要在类型内存储数据的时候发挥作用。

```rust
struct Electron {}   
struct Proton;      

// Use the same notation when creating an instance.
let x = Electron {};
let y = Proton;
```

### 简写语法

参数名与字段名都完全相同，我们可以使用 字段初始化简写语法，这样其行为与之前完全相同

```rust
fn build_user(email: String, username: String) -> User {
    User {
        email,            // 简写: email: email,
        username,         // 简写: username: username,
        active: true,
        sign_in_count: 1,
    }
}
```

### 更新语法

一个包含`..`的`struct`表明你想要使用一些其它结构体的拷贝的一些值。例如：

```rust
struct Point3d {
    x: i32,
    y: i32,
    z: i32,
}

let mut point = Point3d { x: 0, y: 0, z: 0 };
point = Point3d { y: 1, .. point };
```

这给了`point`一个新的`y`，不过保留了`x`和`z`的值。这也并不必要是同样的`struct`，你可以在创建新结构体时使用这个语法，并会拷贝你未指定的值：

```rust
struct Point3d {
    x: i32,
    y: i32,
    z: i32,
}
let origin = Point3d { x: 0, y: 0, z: 0 };
let point = Point3d { z: 1, x: 2, .. origin };
```