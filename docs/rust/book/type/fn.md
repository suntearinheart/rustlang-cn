# 函数

```rust
fn foo(a: i32) -> i32 { a }

fn foo<A, B>(x: A, y: B) {}                           // generic function 

fn foo<T>(x: T) where T: Debug {}                     // generic function 

// Declares an extern fn, the ABI defaults to "C"
extern fn new_i32() -> i32 { 0 }                      // Extern function

// Declares an extern fn with "stdcall" ABI
extern "stdcall" fn new_i32_stdcall() -> i32 { 0 }    // Extern function

let fptr: extern "C" fn() -> i32 = new_i32;
```

函数也有一个类型！它们看起来像这样：

```rust
fn foo(a: i32) -> i32 { a }

let x: fn(i32) -> i32 = foo;
```

在这个例子中，`x`是一个“函数指针”，指向一个获取一个`i32`参数并返回一个`i32`值的函数。

函数不支持默认參數，要用其他的方式模拟此特性。其中一个是利用 `Default` trait

```rust
use std::default::Default;

#[derive(Debug)]
pub struct Parameter {
    a: u32,
    b: u32,
    c: u32,
}

// Set default values for Parameter struct
impl Default for Parameter {
    fn default() -> Self {
        Parameter { a: 2, b: 4, c: 6}
    }
}

fn some_calc(p: Parameter) -> u32 {
    let (a, b, c) = (p.a, p.b, p.c);
    a + b + c
}

fn main() {
    // Set default values for p except c
    let p = Parameter { c: 10, .. Parameter::default() };
    println!("{}", some_calc(p));
}

```

## 提早返回

Rust有一个关键字，`return`.

```rust
fn foo(x: i32) -> i32 {
    return x;

    // we never run this code!
    x + 1
}
```

## Diverging functions

Rust有些特殊的语法，这些函数并不返回：

```rust
fn diverges() -> ! {
    panic!("This function never returns!");
}
```

`panic!`是一个宏，类似我们已经见过的`println!()`。与`println!()`不同的是，`panic!()`导致当前的执行线程崩溃并返回指定的信息。因为这个函数会崩溃，所以它不会返回，所以它拥有一个类型`!`，它代表“发散”。

如果你添加一个叫做`diverges()`的函数并运行，你将会得到一些像这样的输出：

```text
thread ‘<main>’ panicked at ‘This function never returns!’, hello.rs:2
```

如果你想要更多信息，你可以设定`RUST_BACKTRACE`环境变量来获取 backtrace ：

```bash
$ RUST_BACKTRACE=1 ./diverges
thread '<main>' panicked at 'This function never returns!', hello.rs:2
stack backtrace:
   1:     0x7f402773a829 - sys::backtrace::write::h0942de78b6c02817K8r
   2:     0x7f402773d7fc - panicking::on_panic::h3f23f9d0b5f4c91bu9w
   3:     0x7f402773960e - rt::unwind::begin_unwind_inner::h2844b8c5e81e79558Bw
   4:     0x7f4027738893 - rt::unwind::begin_unwind::h4375279447423903650
   5:     0x7f4027738809 - diverges::h2266b4c4b850236beaa
   6:     0x7f40277389e5 - main::h19bb1149c2f00ecfBaa
   7:     0x7f402773f514 - rt::unwind::try::try_fn::h13186883479104382231
   8:     0x7f402773d1d8 - __rust_try
   9:     0x7f402773f201 - rt::lang_start::ha172a3ce74bb453aK5w
  10:     0x7f4027738a19 - main
  11:     0x7f402694ab44 - __libc_start_main
  12:     0x7f40277386c8 - <unknown>
  13:                0x0 - <unknown>
```

`RUST_BACKTRACE`也可以用于 Cargo 的`run`命令：

```bash
$ RUST_BACKTRACE=1 cargo run
     Running `target/debug/diverges`
thread '<main>' panicked at 'This function never returns!', hello.rs:2
stack backtrace:
   1:     0x7f402773a829 - sys::backtrace::write::h0942de78b6c02817K8r
   2:     0x7f402773d7fc - panicking::on_panic::h3f23f9d0b5f4c91bu9w
   3:     0x7f402773960e - rt::unwind::begin_unwind_inner::h2844b8c5e81e79558Bw
   4:     0x7f4027738893 - rt::unwind::begin_unwind::h4375279447423903650
   5:     0x7f4027738809 - diverges::h2266b4c4b850236beaa
   6:     0x7f40277389e5 - main::h19bb1149c2f00ecfBaa
   7:     0x7f402773f514 - rt::unwind::try::try_fn::h13186883479104382231
   8:     0x7f402773d1d8 - __rust_try
   9:     0x7f402773f201 - rt::lang_start::ha172a3ce74bb453aK5w
  10:     0x7f4027738a19 - main
  11:     0x7f402694ab44 - __libc_start_main
  12:     0x7f40277386c8 - <unknown>
  13:                0x0 - <unknown>
```

diverge函数可以被用作任何类型：

```rust
fn diverges() -> ! {
   panic!("This function never returns!");
}
let x: i32 = diverges();
let x: String = diverges();
```

## 函数指针

我们也可以创建指向函数的变量绑定：

```rust
fn plus_one(i: i32) -> i32 {
    i + 1
}

// without type inference
let f: fn(i32) -> i32 = plus_one;

// with type inference
let f = plus_one;
```

你可以用`f`来调用这个函数：

```rust
# fn plus_one(i: i32) -> i32 { i + 1 }
# let f = plus_one;
let six = f(5);
```

## 高阶函数

高阶函数与普通函数的不同在于，它可以使用一个或多个函数作为参数，可以将函数作为返回值。rust的函数是first class type，所以支持高阶函数。而，由于rust是一个强类型的语言，如果要将函数作为参数或返回值，首先需要搞明白函数的类型。下面先说函数的类型，再说函数作为参数和返回值。

前面说过，关键字`fn`可以用来定义函数。除此以外，它还用来构造函数类型。与函数定义主要的不同是，构造函数类型不需要函数名、参数名和函数体。在Rust Reference中的描述如下：

> The function type constructor fn forms new function types. A function type consists of a possibly-empty set of function-type modifiers (such as unsafe or extern), a sequence of input types and an output type.

```rust

fn inc(n: i32) -> i32 {//函数定义
  n + 1
}

type IncType = fn(i32) -> i32;//函数类型

fn main() {
  let func: IncType = inc;
  println!("3 + 1 = {}", func(3));
}
```

上例首先使用`fn`定义了`inc`函数，它有一个`i32`类型参数，返回`i32`类型的值。然后再用`fn`定义了一个函数类型，这个函数类型有i32类型的参数和i32类型的返回值，并用`type`关键字定义了它的别名`IncType`。在`main`函数中定义了一个变量`func`，其类型就为`IncType`，并赋值为`inc`，然后在`pirntln`宏中调用：`func(3)`。可以看到，`inc`函数的类型其实就是`IncType`。 

```rust
fn main() {
  let func: IncType = inc;
  println!("3 + 1 = {}", func(3));
  println!("3 + 1 = {}", inc(3));
}

type IncType = fn(i32) -> i32;

fn inc(n: i32) -> i32 {
  n + 1
}
```

```text
3 + 1 = 4
3 + 1 = 4
```

这说明，赋值时，`inc`函数的所有权并没有被转移到`func`变量上，而是更像不可变引用。在rust中，函数的所有权是不能转移的，我们给函数类型的变量赋值时，赋给的一般是函数的指针，所以rust中的函数类型，就像是C/C++中的函数指针，当然，rust的函数类型更安全。可见，rust的函数类型，其实应该是属于指针类型（Pointer Type）。rust的Pointer Type有两种，一种为引用（Reference`&`），另一种为原始指针（Raw pointer `*`），详细内容请看[Rust Reference 8.18 Pointer Types](http://doc.rust-lang.org/reference.html#pointer-types)。而rust的函数类型应是引用类型，因为它是安全的，而原始指针则是不安全的，要使用原始指针，必须使用`unsafe`关键字声明。

### 函数作参数

函数作为参数，其声明与普通参数一样

```rust
fn main() {
  println!("3 + 1 = {}", process(3, inc));
  println!("3 - 1 = {}", process(3, dec));
}

fn inc(n: i32) -> i32 {
  n + 1
}

fn dec(n: i32) -> i32 {
  n - 1
}

fn process(n: i32, func: fn(i32) -> i32) -> i32 {
  func(n)
}
```

例子中，`process`就是一个高阶函数，它有两个参数，一个类型为`i32`的`n`，另一个类型为`fn(i32)->i32`的函数`func`，返回一个`i32`类型的参数；它在函数体内以`n`作为参数调用`func`函数，返回`func`函数的返回值。运行可以得到以下结果：

```text
3 + 1 = 4
3 - 1 = 2
```

不过，这不是函数作为参数的唯一声明方法，使用泛型函数配合特质（`trait`）也是可以的，因为rust的函数都会实现一个`trait`:`FnOnce`、`Fn`或`FnMut`。将上例中的`process`函数定义换成以下形式是等价的：

```rust
fn process<F>(n: i32, func: F) -> i32
    where F: Fn(i32) -> i32 {
    func(n)
}
```

### 函数作为返回值

函数作为返回值，其生命与普通函数的返回值类型声明一样。看例子：

```rust
fn main() {
   let a = [1,2,3,4,5,6,7];
   let mut b = Vec::<i32>::new();
   for i in &a {
       b.push(get_func(*i)(*i));
   }
   println!("{:?}", b);
}

fn get_func(n: i32) -> fn(i32) -> i32 {
    fn inc(n: i32) -> i32 {
        n + 1
    }
    fn dec(n: i32) -> i32 {
        n - 1
    }
    if n % 2 == 0 {
        inc
    } else {
        dec
    }
}
```

例子中的高阶函数为`get_func`，它接收一个i32类型的函数，返回一个类型为`fn(i32) -> i32`的函数，若传入的参数为偶数，返回`inc`，否则返回`dec`。这里需要注意的是，`inc`函数和`dec`函数都定义在`get_func`内。在函数内定义函数在很多其他语言中是不支持的，不过rust支持，这也是rust灵活和强大的一个体现。不过，在函数中定义的函数，不能包含函数中（环境中）的变量，若要包含，应该闭包。

#### 返回多个值

rust的函数不支持多返回值,但是我们可以利用元组来返回多个值,配合rust的模式匹配,使用起来十分灵活。先看例子:

```rust
fn main() {
    let (p2,p3) = pow_2_3(789);
    println!("pow 2 of 789 is {}.", p2);
  println!("pow 3 of 789 is {}.", p3);
}
fn pow_2_3(n: i32) -> (i32, i32) {
  (n*n, n*n*n)
}
```

可以看到,上例中, pow_2_3函数接收一个i32类型的值,返回其二次方和三次方的值,这两个值包装在一个元组中返回。在 main函数中, let语句就可以使用模式匹配将函数返回的元组进行解构,将这两个返回值分别赋给 p2和p3,从而可以得到 789二次方的值和三次方的值。
