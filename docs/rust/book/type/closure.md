# 闭包

闭包：可以捕获其环境的匿名函数.Rust的闭包是匿名函数，可以保存在变量中，也可以作为参数传递给其他函数。您可以在一个位置创建闭包，然后调用闭包以在不同的上下文中对其进行评估。函数和闭包都是实现了`Fn`、`FnMut`或`FnOnce`特质（trait）的类型。任何实现了这三种特质其中一种的类型的对象，都是 __可调用对象__ ，都能像函数和闭包一样通过这样`name()`的形式调用，`()`在rust中是一个操作符，操作符在rust中是可以重载的。rust的操作符重载是通过实现相应的`trait`来实现，而`()`操作符的相应`trait`就是`Fn`、`FnMut`和`FnOnce`，所以，任何实现了这三个`trait`中的一种的类型，其实就是重载了`()`操作符。Rust 將函數和 Closure 視為不同的東西，函數不是表達式，而 Closure 是。编译器倾向于通过不可变的借入捕获一个闭包变量，随后是可变借入，通过复制，最后通过移动。它会选择这些允许闭包进行编译的首选。如果使用move关键字，则无论借用是否有效，所有捕获都通过移动或复制进行.

闭包可以通过三种方式从其环境中捕获值，这直接映射到函数可以采用参数的三种方式：获取所有权，可变借入和不可变借入。

* 所有闭包都实现了FnOnce，它们都可以通过消耗闭包的所有权被调用至少一次
* 不移动捕获变量的闭包实现FnMut,可以通过可变引用调用，它可变地借用了值。
* 不需要对捕获变量进行可变访问的闭包实现Fn，可以通过共享引用调用
* 要强制闭包取得它在环境中使用的值的所有权，可以在参数列表之前使用`move`关键字。 当将闭包传递给新线程以`move`数据以使其由新线程拥有时，此技术非常有用。

注意：移动闭包仍然可以实现[Fn]或[FnMut]，即使它们通过移动捕获变量。 这是因为闭包类型实现的特征取决于闭包对捕获值的作用，而不是捕获它们的方式。

所有闭包类型都实现[Sized]。 此外，如果通过它存储的捕获类型允许这样做，闭包类型可以实现以下特征：

* [Clone]
* [Copy]
* [Sync]
* [Send]

[Send]和[Sync]匹配普通结构体的规则，而[Clone]和[Copy]的行为就像派生一样。 对于[Clone]，未指定克隆捕获变量的顺序。

The rules for `Send` and `Sync` match those for normal struct types, while `Clone` and `Copy` behave as if derived. For `Clone`, the order of cloning of the captured variables is left unspecified.

由于捕获通常是通过引用，因此出现以下一般规则：

* 如果通过`可变引用`、`复制`或`移动`捕获的所有变量都是[Sync]，则闭包是[Sync]。
* 如果共享引用捕获的所有变量都是[Sync]，则闭包为[Send]，并且`可变引用`，`复制`或`移动`捕获的所有值均为[Send]。
* 闭包是[Clone]或[Copy]，如果它没有通过可变引用捕获任何值，并且如果它通过`复制`或`移动`捕获的所有值分别是[Clone]或[Copy]。

## 语法

```rust
let plus_one = |x| x + 1;

assert_eq!(2, plus_one(1));
```

Rust 中，Closure 的类型被视为一种`trait`，和其他的 trait 一樣，本身不能实例化，借助 `Box<T>` 能將其实例化。为解決所有权问题，Rust 使用 move 关键字將变数的所有权移到函式外。

```rust
fn add_one(x: i32) -> Box<Fn(i32) -> i32> {
    Box::new(move |n| n + x)
}

fn main() {
    let f = add_one(5);
    assert_eq!(6, f(1));
}
```

## 闭包及环境

之所以把它称为“闭包”是因为它们“包含在环境中”（close over their environment）。这看起来像：

```rust
let num = 5;
let plus_num = |x| x + num;

assert_eq!(10, plus_num(5));
```

这个闭包，`plus_num`，引用了它作用域中的`let`绑定：`num`。更明确的说，它借用了绑定。如果我们做一些会与这个绑定冲突的事，我们会得到一个错误。

## `move`闭包

我们可以使用`move`关键字强制使我们的闭包取得它环境的所有权, move关键字通常用于允许闭包比捕获的值生命周期更长，例如，如果返回闭包或用于生成新线程。

```rust
let num = 5;

let owns_num = move |x: i32| x + num;
```

现在，即便关键字是`move`，变量遵循正常的移动语义。在这个例子中，`5`实现了`Copy`，所以`owns_num`取得一个`5`的拷贝的所有权。那么区别是什么呢？

```rust
let mut num = 5;

{
    let mut add_num = |x: i32| num += x;

    add_num(5);
}

assert_eq!(10, num);
```

那么在这个例子中，我们的闭包取得了一个`num`的可变引用，然后接着我们调用了`add_num`，它改变了其中的值，正如我们期望的。我们也需要将`add_num`声明为`mut`，因为我们会改变它的环境。

如果我们改为一个`move`闭包，这有些不同：

```rust
let mut num = 5;

{
    let mut add_num = move |x: i32| num += x;

    add_num(5);
}

assert_eq!(5, num);
```

我们只会得到`5`。与其获取一个我们`num`的可变借用，我们取得了一个拷贝的所有权。

另一个理解`move`闭包的方法：它给出了一个拥有自己栈帧的闭包。没有`move`，一个闭包可能会绑定在创建它的栈帧上，而`move`闭包则是独立的。例如，这意味着大体上你不能从函数返回一个非`move`闭包。

不过在我们讨论获取或返回闭包之前，我们应该更多的了解一下闭包实现的方法。作为一个系统语言，Rust给予你了大量的控制你代码的能力，而闭包也是一样。

## 闭包实现

Rust 的闭包实现与其它语言有些许不同。它们实际上是trait的语法糖。在这以前你会希望阅读**trait**。我们使用trait系统来重载运算符。调用函数也不例外。我们有三个trait来分别重载：

```rust
mod foo {
pub trait Fn<Args> : FnMut<Args> {
    extern "rust-call" fn call(&self, args: Args) -> Self::Output;
}

pub trait FnMut<Args> : FnOnce<Args> {
    extern "rust-call" fn call_mut(&mut self, args: Args) -> Self::Output;
}

pub trait FnOnce<Args> {
    type Output;

    extern "rust-call" fn call_once(self, args: Args) -> Self::Output;
}
# }
```

你会注意到这些 trait 之间的些许区别，不过一个大的区别是`self`：`Fn`获取`&self`，`FnMut`获取`&mut self`，而`FnOnce`获取`self`。这包含了所有3种通过通常函数调用语法的`self`。不过我们将它们分在 3 个 trait 里，而不是单独的 1 个。这给了我们大量的对于我们可以使用哪种闭包的控制。

闭包的`|| {}`语法是上面 3 个 trait 的语法糖。Rust 将会为了环境创建一个结构体，`impl`合适的 trait，并使用它。

## 闭包作为参数

现在我们知道了闭包是 trait，我们已经知道了如何接受和返回闭包；就像任何其它的 trait！

这也意味着我们也可以选择静态或动态分发。首先，让我们写一个函数，它接受可调用的参数，调用之，然后返回结果：

```rust
fn call_with_one<F>(some_closure: F) -> i32
    where F : Fn(i32) -> i32 {

    some_closure(1)
}

let answer = call_with_one(|x| x + 2);

assert_eq!(3, answer);
```

我们传递我们的闭包，`|x| x + 2`，给`call_with_one`。它正做了我们说的：它调用了闭包，`1`作为参数。

让我们更深层的解析`call_with_one`的签名：

```rust
fn call_with_one<F>(some_closure: F) -> i32
   where F : Fn(i32) -> i32 {
   some_closure(1) }
```

我们获取一个参数，而它有类型`F`。我们也返回一个`i32`。这一部分并不有趣。下一部分是：

```rust
fn call_with_one<F>(some_closure: F) -> i32
    where F : Fn(i32) -> i32 {
    some_closure(1) }
```

因为`Fn`是一个trait，我们可以用它限制我们的泛型。在这个例子中，我们的闭包取得一个`i32`作为参数并返回`i32`，所以我们用泛型限制是`Fn(i32) -> i32`。

还有一个关键点在于：因为我们用一个trait限制泛型，它会是单态的，并且因此，我们在闭包中使用静态分发。这是非常简单的。在很多语言中，闭包固定在堆上分配，所以总是进行动态分发。在Rust中，我们可以在栈上分配我们闭包的环境，并静态分发调用。这经常发生在迭代器和它们的适配器上，它们经常取得闭包作为参数。

当然，如果我们想要动态分发，我们也可以做到。trait对象处理这种情况，通常：

```rust
fn call_with_one(some_closure: &Fn(i32) -> i32) -> i32 {
    some_closure(1)
}

let answer = call_with_one(&|x| x + 2);

assert_eq!(3, answer);
```

现在我们取得一个trait对象，一个`&Fn`。并且当我们将我们的闭包传递给`call_with_one`时我们必须获取一个引用，所以我们使用`&||`。

## 函数指针和闭包

我们已经讨论过如何将闭包传递给函数; 你也可以将常规函数传递给函数！ 当您想要传递已定义的函数而不是定义新的闭包时，此技术非常有用。 使用函数指针执行此操作将允许您将函数用作其他函数的参数。 函数强制转换为fn类型。 fn类型称为函数指针。 指定参数是函数指针的语法类似于闭包的语法.

与闭包不同，fn是一种类型而不是一种 trait，因此我们直接将fn指定为参数类型，而不是将一个Fn trait声明为 trait绑定的泛型类型参数。

函数指针实现所有三个闭包 trait（Fn，FnMut和FnOnce），因此您始终可以将函数指针作为期望闭包的函数的参数传递。 最好使用泛型类型和闭包 trait之一来编写函数，这样您的函数就可以接受函数或闭包。

您希望仅接受fn而不是闭包的示例是在与没有闭包的外部代码交互时：C函数可以接受函数作为参数，但C没有闭包。

作为可以使用内联闭包或命名函数的闭包的示例，让我们看一下map的用法。 要使用map函数将数字向量转换为字符串向量，我们可以使用闭包，如下所示：

```rust
// 使用闭包
let list_of_numbers = vec![1, 2, 3];
let list_of_strings: Vec<String> = list_of_numbers
    .iter()
    .map(|i| i.to_string())
    .collect();
// 使用函数
let list_of_numbers = vec![1, 2, 3];
let list_of_strings: Vec<String> = list_of_numbers
    .iter()
    .map(ToString::to_string)
    .collect();
```

我们必须使用完全限定语法，因为有多个可用的函数名为to_string。 这里，我们使用`ToString` trait中定义的`to_string`函数，标准库已为实现Display的任何类型实现了该函数。有些人喜欢这种风格，有些人更喜欢使用封口。 他们最终编译成相同的代码，因此请使用更清晰的样式。

在这个例子中，我们并不是严格的需要这个中间变量`f`，函数的名字就可以了：

```rust
let answer = call_with_one(&add_one);
```

## 返回闭包

闭包由traits表示，这意味着您无法直接返回闭包。 在大多数情况下，您可能希望返回trait，可以使用实现 trait的具体类型作为函数的返回值。 但是你不能用闭包这样做，因为它们没有可回收的具体类型; 例如，您不允许将函数指针fn用作返回类型。

```rust
fn returns_closure() -> Fn(i32) -> i32 {
    |x| x + 1
}
```

编译错误：

```text
error[E0277]: the trait bound `std::ops::Fn(i32) -> i32 + 'static:
std::marker::Sized` is not satisfied
 -->
  |
1 | fn returns_closure() -> Fn(i32) -> i32 {
  |                         ^^^^^^^^^^^^^^ `std::ops::Fn(i32) -> i32 + 'static`
  does not have a constant size known at compile-time
  |
  = help: the trait `std::marker::Sized` is not implemented for
  `std::ops::Fn(i32) -> i32 + 'static`
  = note: the return type of a function must have a statically known size
    ^
```

该错误再次引用了Sized trait！ Rust不知道存储闭包需要多少空间。 我们之前看到了解决这个问题的方法。 我们可以使用trait对象：

```rust
fn returns_closure() -> Box<dyn Fn(i32) -> i32> {
    Box::new(|x| x + 1)
}
```

这还有最后一个问题：

```text
error: closure may outlive the current function, but it borrows `num`,
which is owned by the current function [E0373]
Box::new(|x| x + num)
         ^~~~~~~~~~~
```

好吧，正如我们上面讨论的，闭包借用他们的环境。而且在这个例子中。我们的环境基于一个栈分配的`5`，`num`变量绑定。所以这个借用有这个栈帧的生命周期。所以如果我们返回了这个闭包，这个函数调用将会结束，栈帧也将消失，那么我们的闭包获得了被释放的内存环境！再有最后一个修改，我们就可以让它运行了：

```rust
fn factory() -> Box<Fn(i32) -> i32> {
    let num = 5;

    Box::new(move |x| x + num)
}
# fn main() {
let f = factory();

let answer = f(1);
assert_eq!(6, answer);
# }
```

通过把内部闭包变为`move Fn`，我们为闭包创建了一个新的栈帧。通过`Box`装箱，我们提供了一个已知大小的返回值，并允许它离开我们的栈帧。

### 使用闭包创建行为抽象

```rust
use std::thread;
use std::time::Duration;

fn simulated_expensive_calculation(intensity: u32) -> u32 {
    println!("calculating slowly...");
    thread::sleep(Duration::from_secs(2));
    intensity
}
fn generate_workout(intensity: u32, random_number: u32) {
    if intensity < 25 {
        println!(
            "Today, do {} pushups!",
            simulated_expensive_calculation(intensity)
        );
        println!(
            "Next, do {} situps!",
            simulated_expensive_calculation(intensity)
        );
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated!");
        } else {
            println!(
                "Today, run for {} minutes!",
                simulated_expensive_calculation(intensity)
            );
        }
    }
}

fn main() {
    let simulated_user_specified_value = 10;
    let simulated_random_number = 7;

    generate_workout(
        simulated_user_specified_value,
        simulated_random_number
    );
}
```

## **使用函数重构**

```rust
use std::thread;
use std::time::Duration;

fn simulated_expensive_calculation(intensity: u32) -> u32 {
    println!("calculating slowly...");
    thread::sleep(Duration::from_secs(2));
    intensity
}
fn generate_workout(intensity: u32, random_number: u32) {
    let expensive_result =
        simulated_expensive_calculation(intensity);

    if intensity < 25 {
        println!(
            "Today, do {} pushups!",
            expensive_result
        );
        println!(
            "Next, do {} situps!",
            expensive_result
        );
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated!");
        } else {
            println!(
                "Today, run for {} minutes!",
                expensive_result
            );
        }
    }
}
fn main() {
    let simulated_user_specified_value = 10;
    let simulated_random_number = 7;

    generate_workout(
        simulated_user_specified_value,
        simulated_random_number
    );
}
```

## **使用闭包重构存储代码**

```rust
use std::thread;
use std::time::Duration;

let expensive_closure = |num| {
    println!("calculating slowly...");
    thread::sleep(Duration::from_secs(2));
    num
};

fn generate_workout(intensity: u32, random_number: u32) {
    let expensive_closure = |num| {
        println!("calculating slowly...");
        thread::sleep(Duration::from_secs(2));
        num
    };

    if intensity < 25 {
        println!(
            "Today, do {} pushups!",
            expensive_closure(intensity)
        );
        println!(
            "Next, do {} situps!",
            expensive_closure(intensity)
        );
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated!");
        } else {
            println!(
                "Today, run for {} minutes!",
                expensive_closure(intensity)
            );
        }
    }
}
fn main() {
    let simulated_user_specified_value = 10;
    let simulated_random_number = 7;

    generate_workout(
        simulated_user_specified_value,
        simulated_random_number
    );
}
```

## 泛型参数和`Fn` trait存储闭包

```rust
struct Cacher<T>
    where T: Fn(u32) -> u32
{
    calculation: T,
    value: Option<u32>,
}

impl<T> Cacher<T>
    where T: Fn(u32) -> u32
{
    fn new(calculation: T) -> Cacher<T> {
        Cacher {
            calculation,
            value: None,
        }
    }

    fn value(&mut self, arg: u32) -> u32 {
        match self.value {
            Some(v) => v,
            None => {
                let v = (self.calculation)(arg);
                self.value = Some(v);
                v
            },
        }
    }
}

fn generate_workout(intensity: u32, random_number: u32) {
    let mut expensive_result = Cacher::new(|num| {
        println!("calculating slowly...");
        thread::sleep(Duration::from_secs(2));
        num
    });

    if intensity < 25 {
        println!(
            "Today, do {} pushups!",
            expensive_result.value(intensity)
        );
        println!(
            "Next, do {} situps!",
            expensive_result.value(intensity)
        );
    } else {
        if random_number == 3 {
            println!("Take a break today! Remember to stay hydrated!");
        } else {
            println!(
                "Today, run for {} minutes!",
                expensive_result.value(intensity)
            );
        }
    }
}
fn main() {
    let simulated_user_specified_value = 10;
    let simulated_random_number = 7;

    generate_workout(
        simulated_user_specified_value,
        simulated_random_number
    );
}
```
