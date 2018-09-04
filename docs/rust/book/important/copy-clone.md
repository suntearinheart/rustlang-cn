# Copy-Clone

`Copy` trait会更改实现它的类型的语义。 类型实现Copy的值将被复制，而不是在赋值时移动。 无法对实现Drop的类型实现复制，或者具有非`Copy`的字段。 复制由编译器实现

- Numeric类型
- char，bool和！
- Copy类型的Tuples
- Copy类型的Arrays
- 共享引用
- 原始指针
- 函数指针和函数项类型( function item types)

## Clone

`Clone` trait是`Copy`的一个supertrait，因此它还需要编译器生成实现。 它有以下类型的编译器实现：

- 具有内置Copy实现的类型（见上文）
- Clone类型的Tuples
- Clone类型的Arrays
