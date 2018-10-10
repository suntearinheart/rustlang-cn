# 析构

当Rust中的初始化变量超出范围或不再需要临时变量时，将运行析构函数。赋值也运行其左操作数的析构函数，除非它是一个整数变量。如果已部分初始化结构变量，则仅删除其初始化字段。

一种类型的析构函数包含

* 如果有就调用它的std :: ops :: Drop :: drop方法。
* 递归运行其所有字段的析构函数.
  * struct，tuple或enum变量的字段按声明顺序消毁。
  * 数组或拥有的切片的元素从第一个元素消毁到最后一个元素。
  * 捕获的闭包值以未指定的顺序删除。
  * Trait对象运行底层类型的析构函数。
  * 其他类型不会导致任何步骤消毁。

变量按声明的相反顺序消毁。以相同模式声明的变量以未指定的顺序消毁。

如果必须手动运行析构函数，例如在实现自己的智能指针时，可以使用`std :: ptr :: drop_in_place`。

```rust
struct ShowOnDrop(&'static str);

impl Drop for ShowOnDrop {
    fn drop(&mut self) {
        println!("{}", self.0);
    }
}

{
    let mut overwritten = ShowOnDrop("Drops when overwritten");
    overwritten = ShowOnDrop("drops when scope ends");
}
{
    let declared_first = ShowOnDrop("Dropped last");
    let declared_last = ShowOnDrop("Dropped first");
}
{
    // Tuple elements drop in forwards order
    let tuple = (ShowOnDrop("Tuple first"), ShowOnDrop("Tuple second"));
}
loop {
    // Tuple expression doesn't finish evaluating so temporaries drop in reverse order:
    let partial_tuple = (ShowOnDrop("Temp first"), ShowOnDrop("Temp second"), break);
}
{
    let moved;
    // No destructor run on assignment.
    moved = ShowOnDrop("Drops when moved");
    // drops now, but is then uninitialized
    moved;
    let uninitialized: ShowOnDrop;
    // Only first element drops
    let mut partially_initialized: (ShowOnDrop, ShowOnDrop);
    partially_initialized.0 = ShowOnDrop("Partial tuple first");
}
```

## 不运行析构函数

不在Rust中运行析构函数是安全的，即使它的类型不是`'static`。 `std :: mem :: ManuallyDrop`提供了一个包装器来防止变量或字段被自动删除。