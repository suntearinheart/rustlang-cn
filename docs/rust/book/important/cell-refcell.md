# Cell-RefCell

Rust 标准库中，设计了这样一个系统的组件：`Cell`, `RefCell`，它们提供了 `内部可变性` 通过 `Cell`, `RefCell`，我们可以在需要的时候，就可以修改里面的对象。而不受编译期静态借用规则束缚。

## Cell

 `Cell<T>` 只能用于 `T` 实现了 `Copy` 的情况；

`.get()` 方法，返回内部值的一个拷贝。

```rust
use std::cell::Cell;

let c = Cell::new(5);

let five = c.get();
```

`.set()` 方法，更新值。

```rust
use std::cell::Cell;

let c = Cell::new(5);

c.set(10);
```

## UnsafeCell

`std::cell::UnsafeCell<T>` 用于内部可变性。 它确保编译器不会对这些类型执行不正确的优化。 它还确保具有内部可变性类型的静态项不会放在标记为只读的内存中。

## RefCell

## `RefCell<T>` 内部可变性模式

内部可变性是Rust中的一种设计模式，即使存在对该数据的不可变引用，也允许您改变数据; 通常，借款规则不允许这一行为。 为了改变数据，该模式使用数据结构中的不安全代码来弯曲Rust通常的规则来控制变异和借用。 我们还没有涵盖不安全的代码;当我们可以确保在运行时遵循借用规则时，我们可以使用使用内部可变性模式的类型，即使编译器无法保证这一点。 然后将涉及的不安全代码包装在安全的API中，外部类型仍然是不可变的。

## 使用`RefCell <T>`在运行时实施借用规则

与`Rc <T>`不同，`RefCell <T>`类型表示对其拥有的数据的单一所有权。

* 在任何给定时间，您可以拥有（但不是两个）一个可变引用或任意数量的不可变引用。
* 引用必须始终有效。

使用引用和`Box <T>`，借用规则的不变量在编译时强制执行。使用`RefCell <T>`，这些不变量在运行时强制执行。使用引用，如果您违反这些规则，您将收到编译器错误。使用`RefCell <T>`，如果您违反这些规则，您的程序将会出现恐慌并退出。

在编译时检查借用规则的优点是错误将在开发过程中更快地被捕获，并且对运行时性能没有影响，因为所有分析都是事先完成的。出于这些原因，在编译时检查借用规则是大多数情况下的最佳选择，这就是为什么这是Rust的默认值。

在运行时检查借用规则的优点是允许某些内存安全方案，而编译时检查则不允许这些方案。像Rust编译器一样，静态分析本质上是保守的。通过分析代码无法检测代码的某些属性：最着名的例子是停机问题，这超出了本书的范围，但却是一个有趣的研究课题。

由于某些分析是不可能的，如果Rust编译器无法确定代码是否符合所有权规则，则可能会拒绝正确的程序;这样，它是保守的。如果Rust接受了错误的程序，用户将无法信任Rust所做的保证。但是，如果Rust拒绝正确的程序，程序员将会感到不方便，但不会发生任何灾难。当您确定您的代码遵循借用规则但编译器无法理解并保证时，`RefCell <T>`类型非常有用。

与`Rc <T>`类似，`RefCell <T>`仅用于单线程场景，如果您尝试在多线程上下文中使用它，则会出现编译时错误。

以下是选择`Box <T>`，`Rc <T>`或`RefCell <T>`的原因概述：

* `Rc <T>`允许相同数据的多个所有者; `Box <T>`和`RefCell <T>`拥有单一所有者。
* `Box <T>`允许在编译时检查不可变或可变的借用; `Rc <T>`只允许在编译时检查不可变的借用; `RefCell <T>`允许在运行时检查不可变或可变的借用。
* 因为`RefCell <T>`允许在运行时检查可变借用，所以即使`RefCell <T>`是不可变的，也可以改变`RefCell <T>`中的值。

在不可变值内变换值是内部可变性模式。一个值可以在其方法中改变自身，但看起来对其他代码是不可变的。 值的方法之外的代码将无法改变该值。 使用`RefCell <T>`是获得内部可变性的一种方法。 但是`RefCell <T>`并没有完全绕过借用规则：编译器中的借用检查器允许这种内部可变性，并且在运行时检查借用规则。 如果你违反规则，你会恐慌！ 而不是编译器错误。

## 内部可变性：对不可变值的可变借用

## 内部可变性的用例：模拟对象

Rust没有与其他语言具有对象相同意义上的对象，并且Rust没有像其他语言那样在标准库中内置模拟对象功能。但是，您绝对可以创建一个与模拟对象具有相同目的的结构。

这是我们要测试的场景：我们将创建一个库，该库根据最大值跟踪一个值，并根据当前值的最大值接近发送消息。例如，该库可用于跟踪用户对其允许的API调用数量的配额。

我们的库只提供跟踪最大值的接近程度以及消息在什么时间应该是什么的功能。使用我们的库的应用程序将提供发送消息的机制：应用程序可以在应用程序中发送消息，发送电子邮件，发送文本消息或其他内容。图书馆不需要知道这个细节。它所需要的只是实现我们提供的称为Messenger的trait。

```rust
pub trait Messenger {
    fn send(&self, msg: &str);
}

pub struct LimitTracker<'a, T: 'a + Messenger> {
    messenger: &'a T,
    value: usize,
    max: usize,
}

impl<'a, T> LimitTracker<'a, T>
    where T: Messenger {
    pub fn new(messenger: &T, max: usize) -> LimitTracker<T> {
        LimitTracker {
            messenger,
            value: 0,
            max,
        }
    }

    pub fn set_value(&mut self, value: usize) {
        self.value = value;

        let percentage_of_max = self.value as f64 / self.max as f64;

        if percentage_of_max >= 0.75 && percentage_of_max < 0.9 {
            self.messenger.send("Warning: You've used up over 75% of your quota!");
        } else if percentage_of_max >= 0.9 && percentage_of_max < 1.0 {
            self.messenger.send("Urgent warning: You've used up over 90% of your quota!");
        } else if percentage_of_max >= 1.0 {
            self.messenger.send("Error: You are over your quota!");
        }
    }
}
```

这段代码的一个重要部分是`Messenger` trait有一个名为send的方法，它接受对self的不可变引用和消息文本。这是我们的模拟对象需要的接口。另一个重要的部分是我们想要在`LimitTracker`上测试`set_value`方法的行为。我们可以更改我们为value参数传入的内容，但是set_value不返回任何内容供我们进行断言。我们希望能够说，如果我们创建一个LimitTracker，其中包含实现`Messenger` trait的东西和特定的max值，当我们传递不同的数值时，会告诉messenger发送相应的消息。

我们需要一个模拟对象，它不会在我们调用send时发送电子邮件或短信，而只会跟踪它要发送的消息。我们可以创建一个模拟对象的新实例，创建一个使用模拟对象的LimitTracker，在LimitTracker上调用set_value方法，然后检查模拟对象是否有我们期望的消息。清单15-21显示了实现模拟对象的尝试，但借用检查器不允许它：

```rust
#[cfg(test)]
mod tests {
    use super::*;

    struct MockMessenger {
        sent_messages: Vec<String>,
    }

    impl MockMessenger {
        fn new() -> MockMessenger {
            MockMessenger { sent_messages: vec![] }
        }
    }

    impl Messenger for MockMessenger {
        fn send(&self, message: &str) {
            self.sent_messages.push(String::from(message));
        }
    }

    #[test]
    fn it_sends_an_over_75_percent_warning_message() {
        let mock_messenger = MockMessenger::new();
        let mut limit_tracker = LimitTracker::new(&mock_messenger, 100);

        limit_tracker.set_value(80);

        assert_eq!(mock_messenger.sent_messages.len(), 1);
    }
}
```

此测试代码定义了一个MockMessenger结构，该结构具有带有Vec of String值的sent_messages字段，以跟踪它被告知要发送的消息。我们还定义了一个新的关联函数，以便于创建以空列表消息开头的新MockMessenger值。然后我们为MockMessenger实现Messenger特性，这样我们就可以将一个MockMessenger提供给LimitTracker。在send方法的定义中，我们将传入的消息作为参数传递，并将其存储在sent_messages的MockMessenger列表中。

在测试中，我们正在测试当LimitTracker被告知将值设置为超过最大值的75％时会发生什么。首先，我们创建一个新的MockMessenger，它将以一个空的消息列表开头。然后我们创建一个新的LimitTracker，并为它提供对新MockMessenger的引用，最大值为100.我们在LimitTracker上调用set_value方法，其值为80，超过100的75％。然后我们断言MockMessenger正在跟踪的消息列表现在应该有一条消息。

但是，此测试存在一个问题，如下所示：

```rust
error[E0596]: cannot borrow immutable field `self.sent_messages` as mutable
  --> src/lib.rs:52:13
   |
51 |         fn send(&self, message: &str) {
   |                 ----- use `&mut self` here to make mutable
52 |             self.sent_messages.push(String::from(message));
   |             ^^^^^^^^^^^^^^^^^^ cannot mutably borrow immutable field
```

我们无法修改MockMessenger来跟踪消息，因为send方法对self进行了不可变的引用。 我们也不能从错误文本中获取使用＆mut self的建议，因为那时发送的签名与Messenger trait定义中的签名不匹配（随意尝试查看你得到的错误消息）。

这是内部可变性可以帮助的情况！ 我们将sent_messages存储在`RefCell <T>`中，然后发送消息将能够修改sent_messages以存储我们看到的消息.

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;

    struct MockMessenger {
        sent_messages: RefCell<Vec<String>>,
    }

    impl MockMessenger {
        fn new() -> MockMessenger {
            MockMessenger { sent_messages: RefCell::new(vec![]) }
        }
    }

    impl Messenger for MockMessenger {
        fn send(&self, message: &str) {
            self.sent_messages.borrow_mut().push(String::from(message));
        }
    }

    #[test]
    fn it_sends_an_over_75_percent_warning_message() {
        // --snip--

        assert_eq!(mock_messenger.sent_messages.borrow().len(), 1);
    }
}
```

`sent_messages`字段现在是`RefCell <Vec <String >>`类型而不是`Vec <String>`。 在新函数中，我们在空向量周围创建一个新的`RefCell <Vec <String >>`实例。

对于send方法的实现，第一个参数仍然是self的不可变借用，它与trait定义匹配。 我们在`self.sent_messages`中的`RefCell <Vec <String >>`上调用`borrow_mut`，以获得对`RefCell <Vec <String >>`内部值的可变引用，该值是向量。 然后我们可以调用push对向量的可变引用来跟踪测试期间发送的消息。

我们要做的最后一个更改是在断言中：要查看内部向量中有多少项，我们在`RefCell <Vec <String >>`上调用borrow来获得对向量的不可变引用。

既然您已经了解了如何使用`RefCell <T>`，那么让我们深入了解它是如何工作的！

## 使用`RefCell <T>`在运行时跟踪借用

在创建不可变和可变引用时，我们分别使用＆和＆mut语法。使用`RefCell <T>`，我们使用`borrow`和`borrow_mut`方法，这些方法属于属于`RefCell <T>`的安全API。 borrow方法返回智能指针类型`Ref <T>`，`borrow_mut`返回智能指针类型`RefMut <T>`。这两种类型都实现了Deref，因此我们可以将它们视为常规引用。

`RefCell <T>`跟踪当前有多少`Ref <T>`和`RefMut <T>`智能指针处于活动状态。每次我们调用借用时，`RefCell <T>`都会增加有多少不可变借用的活动数。当`Ref <T>`值超出范围时，不可变借用的数量减少1。就像编译时借用规则一样，`RefCell <T>`允许我们在任何时间点都有许多不可变借用或一个可变借用。

如果我们试图违反这些规则，而不是像引用那样得到编译器错误，那么`RefCell <T>`的实现将在运行时出现混乱。我们故意尝试为同一范围创建两个可变的借用，以说明`RefCell <T>`阻止我们在运行时执行此操作。

```rust
impl Messenger for MockMessenger {
    fn send(&self, message: &str) {
        let mut one_borrow = self.sent_messages.borrow_mut();
        let mut two_borrow = self.sent_messages.borrow_mut();

        one_borrow.push(String::from(message));
        two_borrow.push(String::from(message));
    }
}
```

我们为从borrow_mut返回的`RefMut <T>`智能指针创建一个变量`one_borrow`。 然后我们在变量`two_borrow`中以相同的方式创建另一个可变借用。 这使得两个可变引用在同一范围内，这是不允许的。 当我们运行库的测试时，代码将编译而没有任何错误，但测试将失败：

```rust
---- tests::it_sends_an_over_75_percent_warning_message stdout ----
    thread 'tests::it_sends_an_over_75_percent_warning_message' panicked at
'already borrowed: BorrowMutError', src/libcore/result.rs:906:4
note: Run with `RUST_BACKTRACE=1` for a backtrace.
```

请注意，代码因已经借用的消息而惊慌失措：`BorrowMutError`。 这就是`RefCell <T>`在运行时处理违反借用规则的方式。

在运行时而不是编译时捕获借用错误意味着您将在开发过程的后期发现代码中的错误，并且可能直到您的代码部署到生产中。 此外，由于在运行时而不是编译时跟踪借用，因此代码会导致运行时性能损失很小。 但是，使用`RefCell <T>`可以编写一个模拟对象，该对象可以修改自身以跟踪它在仅允许不可变值的上下文中使用它时所看到的消息。 您可以使用`RefCell <T>`尽管需要权衡以获得比常规引用提供的更多功能。

## 通过组合`Rc <T>`和`RefCell <T>`拥有多个可变数据所有者

使用`RefCell <T>`的常用方法是与`Rc <T>`组合。 回想一下，`Rc <T>`允许您拥有某些数据的多个所有者，但它只提供对该数据的不可变访问。 如果您拥有一个包含`RefCell <T>`的`Rc <T>`，您可以获得一个可以拥有多个所有者的值，并且您可以进行变异！

我们使用`Rc <T>`来允许多个列表共享另一个列表的所有权。 因为`Rc <T>`仅包含不可变值，所以一旦创建它们，我们就无法更改列表中的任何值。 让我们添加`RefCell <T>`以获得更改列表中值的功能。 通过在Cons定义中使用`RefCell <T>`，我们可以修改存储在所有列表中的值：

```rust
#[derive(Debug)]
enum List {
    Cons(Rc<RefCell<i32>>, Rc<List>),
    Nil,
}

use List::{Cons, Nil};
use std::rc::Rc;
use std::cell::RefCell;

fn main() {
    let value = Rc::new(RefCell::new(5));

    let a = Rc::new(Cons(Rc::clone(&value), Rc::new(Nil)));

    let b = Cons(Rc::new(RefCell::new(6)), Rc::clone(&a));
    let c = Cons(Rc::new(RefCell::new(10)), Rc::clone(&a));

    *value.borrow_mut() += 10;

    println!("a after = {:?}", a);
    println!("b after = {:?}", b);
    println!("c after = {:?}", c);
}
```

我们创建一个值为`Rc <RefCell <i32 >>`的实例，并将其存储在一个名为value的变量中，以便我们稍后可以直接访问它。然后我们在一个带有保留值的Cons变量的a中创建一个List。我们需要克隆价值，因此a和值都拥有内部5值的所有权，而不是将所有权从价值转移到或从价值借入。

我们将列表a包装在`Rc <T>`中，因此当我们创建列表b和c时，它们都可以引用a。

在我们在a，b和c中创建列表之后，我们在值中添加10。我们通过在值上调用borrow_mut来实现这一点，它使用我们在第5章中讨论的自动解除引用功能（参见“哪里是 - >运算符？”）将`Rc <T>`取消引用到内部`RefCell <T>`值。 `borrow_mut`方法返回一个`RefMut <T>`智能指针，我们在其上使用dereference运算符并更改内部值。

当我们打印a，b和c时，我们可以看到它们都具有15而不是5的修改值：

```rust
a after = Cons(RefCell { value: 15 }, Nil)
b after = Cons(RefCell { value: 6 }, Cons(RefCell { value: 15 }, Nil))
c after = Cons(RefCell { value: 10 }, Cons(RefCell { value: 15 }, Nil))
```

通过使用`RefCell <T>`，我们有一个向外不可变的List值。 但我们可以使用`RefCell <T>`上的方法来提供对其内部可变性的访问，以便我们可以在需要时修改数据。 借用规则的运行时检查保护我们免受数据竞争的影响，有时候我们的数据结构可以灵活地为这种灵活性进行交易。

标准库具有提供内部可变性的其他类型，例如`Cell <T>`，除了不提供对内部值的引用之外，该值被复制进出`Cell <T>`。 还有`Mutex <T>`，它提供了可以安全地跨线程使用的内部可变性;