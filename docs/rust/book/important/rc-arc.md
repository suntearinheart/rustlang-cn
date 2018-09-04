# Rc-Arc

## `Rc<T>`，引用计数智能指针

大多数情况下，所有权是明确的：您确切地知道哪个变量拥有给定值。但是有时单个值可能包含多个所有者。例如在图形数据结构中，多个边可能指向同一个节点，并且该节点在概念上由指向它的所有边所拥有。除非没有任何指向它的边缘，否则不应清除节点。

为了启用多个所有权，Rust有一个名为`Rc <T>`的类型，它是引用计数的缩写。 `Rc <T>`类型跟踪对值的引用的数量，该值确定值是否仍在使用中。如果对值的引用为零，则可以清除该值，而不会使任何引用变为无效。

当我们想要在堆上分配一些数据时，我们使用`Rc <T>`类型来读取我们程序的多个部分，并且我们无法在编译时确定哪个部分将最后使用数据完成。如果我们知道哪个部分最后会完成，我们可以将该部分作为数据的所有者，并且在编译时强制执行的正常所有权规则将生效。

请注意，`Rc <T>`仅用于单线程.`Arc` 是原子引用计数，用于多线程。

## 使用`Rc<T>`共享数据

1. 用 `Rc` 包装起来的类型对象，是 `immutable` 的，即 不可变的。即你无法修改 `Rc<T>` 中的 `T` 对象，只能读；
2. 一旦最后一个拥有者消失，则资源会被自动回收，这个生命周期是在编译期就确定下来的；
3. `Rc` 只能用于同一线程内部，不能用于线程之间的对象共享（不能跨线程传递）；
4. `Rc` 实际上是一个指针，它不影响包裹对象的方法调用形式（即不存在先解开包裹再调用值这一说）。

例子：

```rust
use std::rc::Rc;

let a = Rc::new(5);
let b = Rc::clone(&a);
let c = Rc::clone(&a);
println!("{}-{}-{}", a,b,c);
println!("{}",Rc::strong_count(&a));
```

我们可以调用`a.clone（）`而不是`Rc :: clone（＆a）`，但Rust的惯例是在这种情况下使用`Rc :: clone`。 `Rc :: clone`的实现并不像大多数类型的clone实现那样对所有数据进行深层复制。 对`Rc :: clone`的调用只会增加引用计数，这不会花费太多时间。 深层数据可能需要很长时间。 通过使用`Rc :: clone`进行引用计数，我们可以在视觉上区分深拷贝类型的克隆和增加引用计数的克隆类型。 在代码中查找性能问题时，我们只需要考虑深拷贝克隆，并且可以忽略对`Rc :: clone`的调用。

通过不可变引用，`Rc <T>`允许您在程序的多个部分之间共享数据以供只读。 如果`Rc <T>`允许您也有多个可变引用，则可能违反借用规则之一：多个可变借用到同一个地方会导致数据争用和不一致。 但是能够改变数据是非常有用的！ 在下一节中，我们将讨论内部可变性模式和`RefCell <T>`类型，您可以将它与`Rc <T>`结合使用以处理此不变性限制。

## Rc Weak

`Weak` 通过 `use std::rc::Weak` 来引入。

`Rc` 是一个引用计数指针，而 `Weak` 是一个指针，但不增加引用计数，是 `Rc` 的 weak 版。它有以下几个特点：

1. 可访问，但不拥有。不增加引用计数，因此，不会对资源回收管理造成影响；
2. 可由 `Rc<T>` 调用 `downgrade` 方法而转换成 `Weak<T>`；
3. `Weak<T>` 可以使用 `upgrade` 方法转换成 `Option<Rc<T>>`，如果资源已经被释放，则 Option 值为 `None`；
4. 常用于解决循环引用的问题。

例子：

```rust
use std::rc::Rc;

let five = Rc::new(5);

let weak_five = Rc::downgrade(&five);

let strong_five: Option<Rc<_>> = weak_five.upgrade();
```

## Arc

`Arc` 是原子引用计数，是 `Rc` 的多线程版本。`Arc` 通过 `std::sync::Arc` 引入。

它的特点：

1. `Arc` 可跨线程传递，用于跨线程共享一个对象；
2. 用 `Arc` 包裹起来的类型对象，对可变性没有要求；
3. 一旦最后一个拥有者消失，则资源会被自动回收，这个生命周期是在编译期就确定下来的；
4. `Arc` 实际上是一个指针，它不影响包裹对象的方法调用形式（即不存在先解开包裹再调用值这一说）；
5. `Arc` 对于多线程的共享状态**几乎是必须的**（减少复制，提高性能）。

示例：

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let numbers: Vec<_> = (0..100u32).collect();
    let shared_numbers = Arc::new(numbers);

    for _ in 0..10 {
        let child_numbers = shared_numbers.clone();

        thread::spawn(move || {
            let local_numbers = &child_numbers[..];

            // Work with the local numbers
        });
    }
}
```

### Arc Weak

与 `Rc` 类似，`Arc` 也有一个对应的 `Weak` 类型，从 `std::sync::Weak` 引入。

意义与用法与 `Rc Weak` 基本一致，不同的点是这是多线程的版本。故不再赘述。

## 一个例子

实现多个对象同时引用另外一个对象。

```rust
use std::rc::Rc;

struct Owner {
    name: String
}

struct Gadget {
    id: i32,
    owner: Rc<Owner>
}

fn main() {
    // Create a reference counted Owner.
    let gadget_owner : Rc<Owner> = Rc::new(
        Owner { name: String::from("Gadget Man") }
    );

    // Create Gadgets belonging to gadget_owner. To increment the reference
    // count we clone the `Rc<T>` object.
    let gadget1 = Gadget { id: 1, owner: gadget_owner.clone() };
    let gadget2 = Gadget { id: 2, owner: gadget_owner.clone() };

    drop(gadget_owner);

    // Despite dropping gadget_owner, we're still able to print out the name
    // of the Owner of the Gadgets. This is because we've only dropped the
    // reference count object, not the Owner it wraps. As long as there are
    // other `Rc<T>` objects pointing at the same Owner, it will remain
    // allocated. Notice that the `Rc<T>` wrapper around Gadget.owner gets
    // automatically dereferenced for us.
    println!("Gadget {} owned by {}", gadget1.id, gadget1.owner.name);
    println!("Gadget {} owned by {}", gadget2.id, gadget2.owner.name);

    // At the end of the method, gadget1 and gadget2 get destroyed, and with
    // them the last counted references to our Owner. Gadget Man now gets
    // destroyed as well.
}
```
