# Array-Vec-Slice

Array是一种线性的容器，储存同一种类型的数据，而其长度在生成后即固定下来，在内存中是连续而紧密排列的,好处在于可快速存取数据，Array是透过索引值存取数据，但当要改变长度时，效率则较差，因为要复制Array中的数据

```rust
//创建
let mut array: [i32; 3] = [0; 3];   // 方式一
let arr = [8,9,10];                 // 方式二
//修改
array[1] = 1;
array[2] = 2;

for x in &array {
    print!("{} ", x);
}
```

Rust的数组中的`N`（大小）也是类型的一部分，即`[u8; 3] != [u8; 4]`。

```rust
extern crate rand;

use rand::Rng;

fn main() {
    const SIZE: usize = 10;
    let mut array = [0; SIZE];

    for i in 0..array.len() {
        // Set a random number between 1 and 100
        array[i] = rand::thread_rng().gen_range(1, 100 + 1);
    }
}
```

或是使用迭代器，

```rust
fn main() {
    let array = ["eins", "zwei", "drei", "vier", "fünf"];

    for element in array.iter() {
        println!("{}", element);
    }
}

//-----------------------------
extern crate rand;

use rand::Rng;

fn main() {
    const SIZE: usize = 100;
    let mut array = [0; SIZE];

    for e in array.iter_mut() {
        *e = rand::thread_rng().gen_range(1, 100 + 1);
    }
}
```

目前 Rust 的Array有一些使用上的限制，某些函数在Array长度大於 32 時无法使用。

这些 trait 的大小限制是 Rust 內部实现问题，而不是Array的正常行為，Rust 官方提到这个问题。在 Rust 改善前，有几种处理方式，包括：

- 自行实现相关trait
- 避免使用这些方法
- 改用Vec

(1) 不是通用的方法，因为针对每个长度，都要重新一次，但若有需求，仍可考慮；(2) 会限制了Array的使用场合；通常可考慮 (3)。

## Vec

Vec 是一个动态或“可变”的数组容器，其內部实现也是Array，但可动态增加长度。向量在增減长度時有数据的拷贝，大量数据搬移的需求，可考虑其他容器。`Vec`具有动态的添加和删除元素的能力，并且能够以`O(1)`的效率进行随机访问。同时，对其尾部进行push或者pop操作的效率也是平摊`O(1)`的。Vec的所有内容项都是生成在堆空间上，你可以轻易的将`Vec` move出一个栈而不用担心内存拷贝影响执行效率——毕竟只是拷贝的栈上的指针。

`Vec<T>`中的泛型`T`必须是`Sized`的，也就是说必须在编译的时候就知道存一个内容项需要多少内存。对于那些在编译时候未知大小的项（函数类型等），我们可以用`Box`将其包裹，当成一个指针。

```rust
let v1: Vec<i32> = Vec::new();    // 方式一
let v = vec![1, 2, 3, 4, 5];      // 方式二
let v2 = vec![0;10];              //声明一个初始长度为10的值全为0的动态数组
```

### 从迭代器生成

因为Vec实现了`FromIterator`这个trait，因此，借助collect，我们能将任意一个迭代器转换为Vec。

```rust
let v: Vec<_> = (1..5).collect();
let mut v2 = (0i32..5).collect::<Vec<i32>>();
```

使用枚举来储存多种类型

```rust

enum SpreadsheetCell {
    Int(i32),
    Float(f64),
    Text(String),
}

let row = vec![
    SpreadsheetCell::Int(3),
    SpreadsheetCell::Text(String::from("blue")),
    SpreadsheetCell::Float(10.12),
];
```

## 访问元素

为了Vec特定索引的值，我们使用`[]`,索引从`0`开始.

```rust
let v = vec![1, 2, 3, 4, 5];
let r0 = v[1];
let r1 = &v[2];             //当引用一个不存在的元素时，会造成panic!.
let r2 = v.get(3);          //当引用一个不存在的元素时，返回None.
println!("The third element of v is{}, {},{}", r0, r1,r2);

fn main() {
    let vec = vec![1, 2, 3];

    for i in 0..(vec.len()) {
        println!("{}", i);
    }
}

//--------------------------
fn main() {
    let vec = vec![1, 2, 3];

    for element in vec.iter() {
        println!("{}", element);
    }
}

//----------------------------
fn main() {
    let mut vec = vec![1, 2, 3];

    for i in 0..vec.len() {
        vec[i] = vec[i] * vec[i];
    }

    assert_eq!(vec[0], 1);
    assert_eq!(vec[1], 4);
    assert_eq!(vec[2], 9);
}
//----------------------------
fn main() {
    let mut vec = vec![1, 2, 3];

    for element in vec.iter_mut() {
        *element = (*element) * (*element);
    }

    assert_eq!(vec[0], 1);
    assert_eq!(vec[1], 4);
    assert_eq!(vec[2], 9);
}

```

另外值得注意的是你必须用`usize`类型的值来索引：

```rust
let v = vec![1, 2, 3, 4, 5];

let i: usize = 0;
let j: i32 = 0;

// works
v[i];

// doesn’t
v[j];
```

用非`usize`类型索引的话会给出类似如下的错误：

```text
error: the trait `core::ops::Index<i32>` is not implemented for the type
`collections::Vec::Vec<_>` [E0277]
v[j];
^~~~
note: the type `collections::Vec::Vec<_>` cannot be indexed by `i32`
error: aborting due to previous error
```

### 随机访问

就像数组一样，因为Vec借助`Index`和`IndexMut`提供了随机访问的能力，我们通过`[index]`来对其进行访问，当然，既然存在随机访问就会出现越界的问题。而在Rust中，一旦越界的后果是极其严重的，可以导致Rust当前线程panic。因此，除非你确定自己在干什么或者在`for`循环中，不然我们不推荐通过下标访问。

以下是例子：

```rust
let a = vec![1, 2, 3];
assert_eq!(a[1usize], 2);
```

Rust中安全的下标访问机制：—— `.get(n: usize)` （`.get_mut(n: usize)`） 函数。函数返回一个`Option<&T>` (`Option<&mut T>`)，当`Option == None`的时候，即下标越界，其他情况下，我们能安全的获得一个Vec里面元素的引用。

```rust
let v =vec![1, 2, 3];
assert_eq!(v.get(1), Some(&2));
assert_eq!(v.get(3), None);
```

## 越界访问

如果你尝试访问并不存在的索引：

```rust
let v = vec![1, 2, 3];
println!("Item 7 is {}", v[7]);
```

那么当前的线程会**panic**并输出如下信息：

```text
thread '<main>' panicked at 'index out of bounds: the len is 3 but the index is 7'
```

如果你想处理越界错误而不是 panic，使用像[`get`](http://doc.rust-lang.org/std/Vec/struct.Vec.html#method.get)或[`get_mut`](http://doc.rust-lang.org/std/Vec/struct.Vec.html#method.get)这样的方法，他们当给出一个无效的索引时返回`None`：

```rust
let v = vec![1, 2, 3];
match v.get(7) {
    Some(x) => println!("Item 7 is {}", x),
    None => println!("Sorry, this Vector is too short.")
}
```

## 迭代

对于可变数组，Rust提供简单的遍历形式—— for循环,可以获得一个数组的引用、可变引用、所有权。

```rust
let mut v = vec![1, 2, 3];
for i in &v { .. } // 获得引用
for i in &mut v { .. } // 获得可变引用
for i in v { .. } // 获得所有权，注意此时Vec的属主将会被转移！！
```

但是，这么写很容易出现多层`for`循环嵌套，`Vec`提供了一个`into_iter()`方法，能显式地将自己转换成一个迭代器。



## Slice

Slice是一个引用视图。它有利于安全，有效的访问数组的一部分而不用进行拷贝，slice并不是直接创建的，而是引用一个已经存在的变量。有预定义的长度，是可变或不可变的。

可以用一个`&`和`[]`的组合从多种数据类型创建一个slice。`&`类似于引用，带有一个范围的`[]`，允许你定义slice的长度：

```rust
let a = [0, 1, 2, 3, 4];
let complete = &a[..]; // A slice containing all of the elements in a
let middle = &a[1..4]; // A slice of a: just the elements 1, 2, and 3

fn main() {
    /* Internally, it works as this:
       let _slice = [1, 2, 3, 4, 5];
       let slice = &_slice; */
    let slice = &[1, 2, 3, 4, 5];
    assert_eq!(slice[0], 1);

    let slice = &mut [1, 2, 3];

    // Write data into slice
    slice[1] = 99;
    assert_eq!(slice[1], 99);
}
```

Slice可自动转化为迭代器,如果切片是由Array而來

```rust
fn main() {
    let array = ["eins", "zwei", "drei", "vier", "fünf"];

    // It works when the array size <= 32
    for element in &array {
       println!("{}", element);
    }
}

//-----------------------------------
extern crate rand;

use rand::Rng;

fn main() {
    const SIZE: usize = 10;
    let mut array = [0; SIZE];

    for element in &mut array {
        *element = rand::thread_rng().gen_range(1, 100 + 1);
    }
}
```

### 案例选读: 插入排序法

```rust
//调用rand库
extern crate rand ;

使用 rand :: Rng ;

fn main （） {
    //初始化变量
    const SIZE ： usize = 10 ;
    让 mut数组： [ i32 ; SIZE ] = [ 0 ; SIZE ] ;

    //用随机整数设置数组元素
    对于我在 0 ..SIZE {
        阵列[我] =兰特:: thread_rng （） .gen_range （1 ， 100 + 1 ）;
    }

    //打印未排序的数组
    打印！（“排序前：” ）;
    display_slice （＆ array ）;

    //插入排序。
    //就地修改数组。
    对于我在 1 .. （ array.len （）） {
        让 x = array [ i ] ;  //临时数据
        让 mut j = i ;
        而 j > 0 &&  array [ j - 1 ] > x {
           array [ j ] = array [ j - 1 ] ;  //移动元素一步
           j - = 1 ;
        }
        数组[ j ] = x ;  //放回临时数据
    }
   //打印排序的数组
    打印！（“排序后：” ）;
    display_slice （＆ array ）;
}

//用任意大小打印数组的功能
fn display_slice （ slice ： ＆[ i32 ] ） {
    对于我在 0 ..slice.len （） {
        打印！（“{}” ， slice [ i ] ）;

        如果我< slice.len （） - 1 {
            打印！（“，” ）;
        }
    }
    println ！（“” ）;
}
```