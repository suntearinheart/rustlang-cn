# Drop

## 使用`Drop` trait在运行代码时清理代码

对智能指针模式很重要的第二个 trait是Drop，它允许您自定义当值即将超出范围时发生的事情。您可以为任何类型的Drop trait提供实现，并且您指定的代码可用于释放文件或网络连接等资源。我们在智能指针的上下文中引入了Drop，因为在实现智能指针时几乎总是使用`Drop` trait的功能。例如，`Box <T>`自定义Drop以释放该框指向的堆上的空间。

在Rust中，您可以指定每当值超出范围时运行特定的代码位，编译器将自动插入此代码。因此，您不需要小心将清理代码放在程序中的任何地方，特定类型的实例已完成 - 仍然不会泄漏资源！

通过实现Drop trait，指定当值超出范围时要运行的代码。 Drop trait要求您实现一个名为drop的方法，该方法对self进行可变引用。要查看Rust调用何时丢弃。

```rust
struct CustomSmartPointer {
    data: String,
}

impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data);
    }
}

fn main() {
    let c = CustomSmartPointer { data: String::from("my stuff") };
    let d = CustomSmartPointer { data: String::from("other stuff") };
    println!("CustomSmartPointers created.");
}
```

```bash
CustomSmartPointers created.
Dropping CustomSmartPointer with data `other stuff`!
Dropping CustomSmartPointer with data `my stuff`!
```

## 使用std :: mem :: drop提前删除值

不幸的是，禁用自动删除功能并不简单。 通常不需要禁用`drop`; Drop trait的全部意义在于它是自动处理的。 有时您可能希望尽早清理一个值。 一个示例是当使用管理锁的智能指针时：您可能希望强制释放锁的drop方法运行，以便同一范围内的其他代码可以获取锁。 Rust不允许您手动调用Drop trait的drop方法,因为Rust仍会自动调用main的末尾值。 这将是一个双重释放错误; 如果要强制在其范围结束之前删除值，则必须调用标准库提供的`std :: mem :: drop`函数。

`std :: mem :: drop`函数与Drop trait中的drop方法不同。 通过传递想要强制的值作为参数提前删除来调用它。 该函数在`prelude`中.

```rust
fn main() {
    let c = CustomSmartPointer { data: String::from("some data") };
    println!("CustomSmartPointer created.");
    drop(c);
    println!("CustomSmartPointer dropped before the end of main.");
}
```

```bash
CustomSmartPointer created.
Dropping CustomSmartPointer with data `some data`!
CustomSmartPointer dropped before the end of main.
```

您可以通过多种方式使用Drop trait实现中指定的代码来方便和安全地进行清理：例如，您可以使用它来创建自己的内存分配器！ 使用Drop trait和Rust的所有权系统，您不必记得清理，因为Rust会自动执行清理。

您也不必担心因意外清理仍在使用的值而导致的问题：确保引用始终有效的所有权系统还确保在不再使用该值时仅调用一次drop。
