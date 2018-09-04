# 属性

[reference](https://doc.rust-lang.org/reference/attributes.html)

属性（Attribute）是一种通用的用于表达元数据的特性，借鉴ECMA-334(C#)的语法来实现ECMA-335中描述的Attributes。属性只能应用于Item（元素、项），
例如 `use` 声明、模块、函数等。

- 实现条件编译 (conditional compilation)
- 设置包装箱名字、版本以及类型
- 取消可疑代码的警告
- 设置编译器选项
- 链接外部库
- 标记测试函数

属性有两种语法：#![crate_attribute]应用于整个包装箱， 而#[crate_attribute]应用于紧邻的一个模块或者条目。 属性的参数也有三种不同的形式：

```rust
#[attribute = "value"]
#[attribute(key = "value")]
#[attribute(value)]
```

下面列举几个经常用到的属性：

```rust
#[path="foo.rs"]用于设置一个模块需要载入的文件路径。
#[allow(dead_code)]用于取消对死代码的默认lint检查。
#[derive(PartialEq, Clone)]用于自动推导PartialEq和Clone这两个特性的实现。
```

Rust中声明可以用“属性”标注,在编译阶段用于为编译提供更多描述信息，在编译的时候可以根据这些描述做出一些动态的选择和设置：

```rust
    #[test]
    fn foo() {}

    //或像这样：

    mod foo {
    #![test]
    }

    //这两者的区别是`!`，它改变了属性作用的对象：

    #[foo]
    struct Foo;

    mod bar {
        #![bar]
    }
 ```

`#[foo]`作用于下一个项，在这就是`struct`声明。`#![bar]`作用于包含它的项，在这是`mod`声明。否则，它们是一样的。它们都以某种方式改变它们附加到的项的意义。

```rust
    #[test]
    fn check() {
        assert_eq!(2, 1 + 1);
    }
```

它被标记为`#[test]`。这意味着它是特殊的：当你运行[测试](Testing 测试.md)，这个函数将会执行。当你正常编译时，它甚至不会被包含进来。这个函数现在是一个测试函数。

属性也可以有附加数据：

```rust
    #[inline(always)]
    fn super_fast_fn() {
     }

    //或者甚至是键值：

    #[cfg(target_os = "macos")]
    mod macos_only {
     }
```

### 属性的语法

- 简单的attribute属性名，这些属性名是由Rust定义的，例如： #[test]
- key＝value的形式，key是是Rust定义的属性名，例如： #![crate_type = "lib"]
- 属性名,跟着一个逗号隔开的子属性的列表(subAttribute1,subAttribute2,key=value), 如`#[cfg(and(unix, not(windows)))], #[allow(non_camel_case_types, unused)],#[cfg(target_os="linux")]

Rust属性被用在一系列不同的地方。在[参考手册](https://doc.rust-lang.org/nightly/reference/attributes.html)中有一个属性的全表。目前，你不能创建你自己的属性，Rust编译器定义了它们。


Rust中，Item是Crate（库）的一个组成部分。它包括

* `extern crate`声明
* `use`声明
* 模块（模块是一个Item的容器）
* 函数
* `type`定义
* 结构体定义
* 枚举类型定义
* 常量定义
* 静态变量定义
* Trait定义
* 实现（Impl）

这些Item是可以互相嵌套的，比如在一个函数中定义一个静态变量、在一个模块中使用`use`声明或定义一个结构体。这些定义在某个作用域里面的Item跟你把
它写到最外层作用域所实现的功能是一样的，只不过你要访问这些嵌套的Item就必须使用路径（Path），如`a::b::c`。但一些外层的Item不允许你使用路径去
访问它的子Item，比如函数，在函数中定义的静态变量、结构体等，是不可以通过路径来访问的。

在`#`后面还可以紧跟一个`!`，比如`#![feature(box_syntax)]`，这表示这个属性是应用于它所在的这个Item。而如果没有`!`则表示这个属性仅应用于紧接着的那个Item。

例如：

```rust
// 为这个crate开启box_syntax这个新特性
#![feature(box_syntax)]

// 这是一个单元测试函数
#[test]
fn test_foo() {
    /* ... */
}

// 条件编译，只会在编译目标为Linux时才会生效
#[cfg(target_os="linux")]
mod bar {
    /* ... */
}

// 为以下的这个type定义关掉non_camel_case_types的编译警告
#[allow(non_camel_case_types)]
type int8_t = i8;
```

### 应用于Crate的属性

* `crate_name` - 指定Crate的名字。如`#[crate_name = "my_crate"]`则可以让编译出的库名字为`libmy_crate.rlib`。
* `crate_type` - 指定Crate的类型，有以下几种选择
    - `"bin"` - 编译为可执行文件；
    - `"lib"` - 编译为库；
    - `"dylib"` - 编译为动态链接库；
    - `"staticlib"` - 编译为静态链接库；
    - `"rlib"` - 编译为Rust特有的库文件，它是一种特殊的静态链接库格式，它里面会含有一些元数据供编译器使用，最终会静态链接到目标文件之中。

  例`#![crate_type = "dylib"]`。
* `feature` - 可以开启一些不稳定特性，只可在nightly版的编译器中使用。
* `no_builtins` - 去掉内建函数。
* `no_main`- 不生成`main`这个符号，当你需要链接的库中已经定义了`main`函数时会用到。
* `no_start` - 不链接自带的`native`库。
* `no_std` - 不链接自带的`std`库。
* `plugin` - 加载编译器插件，一般用于加载自定义的编译器插件库。用法是

  ```rust
  // 加载foo, bar两个插件
  #![plugin(foo, bar)]
  // 或者给插件传入必要的初始化参数
  #![plugin(foo(arg1, arg2))]
  ```

* `recursive_limit` - 设置在编译期最大的递归层级。比如自动解引用、递归定义的宏等。默认设置是`#![recursive_limit = "64"]`

### 应用于模块的属性

* `no_implicit_prelude` - 取消自动插入`use std::prelude::*`。
* `path` - 设置此`mod`的文件路径。

  如声明`mod a;`，则寻找
    - 本文件夹下的`a.rs`文件
    - 本文件夹下的`a/mod.rs`文件
    
```rust
    #[cfg(unix)]
    #[path = "sys/unix.rs"]
    mod sys;

    #[cfg(windows)]
    #[path = "sys/windows.rs"]
    mod sys;
```

### 应用于函数的属性

* `main` - 把这个函数作为入口函数，替代`fn main`，会被入口函数（Entry Point）调用。
* `plugin_registrar` - 编写编译器插件时用，用于定义编译器插件的入口函数。
* `start` - 把这个函数作为入口函数（Entry Point），改写 `start` language item。
* `test` - 指明这个函数为单元测试函数，在非测试环境下不会被编译。
* `should_panic` - 指明这个单元测试函数必然会panic。
* `cold` - 指明这个函数很可能是不会被执行的，因此优化的时候特别对待它。

```rust
// 把`my_main`作为主函数
#[main]
fn my_main() {

}

// 把`plugin_registrar`作为此编译器插件的入口函数
#[plugin_registrar]
pub fn plugin_registrar(reg: &mut Registry) {
    reg.register_macro("rn", expand_rn);
}

// 把`entry_point`作为入口函数，不再执行标准库中的初始化流程
#[start]
fn entry_point(argc: isize, argv: *const *const u8) -> isize {

}

// 定义一个单元测试
// 这个单元测试一定会panic
#[test]
#[should_panic]
fn my_test() {
    panic!("I expected to be panicked");
}

// 这个函数很可能是不会执行的，
// 所以优化的时候就换种方式
#[cold]
fn unlikely_to_be_executed() {

}
```

### 应用于全局静态变量的属性

* `thread_local` - 只可用于`static mut`，表示这个变量是thread local的。

### 应用于FFI的属性

### 应用于FFI的属性

`extern`块可以应用以下属性

* `link_args` - 指定链接时给链接器的参数，平台和实现相关。
* `link` - 说明这个块需要链接一个native库，它有以下参数：
    - `name` - 库的名字，比如`libname.a`的名字是`name`；
    - `kind` - 库的类型，它包括
        * `dylib` - 动态链接库
        * `static` - 静态库
        * `framework` - OS X里的Framework

```rust
  #[link(name = "readline")]
  extern {

  }
  
  #[link(name = "CoreFoundation", kind = "framework")]
  extern {

  }
```

在`extern`块里面，可以使用

* `link_name` - 指定这个链接的外部函数的名字或全局变量的名字；
* `linkage` - 对于全局变量，可以指定一些LLVM的链接类型（ http://llvm.org/docs/LangRef.html#linkage-types ）。

对于`enum`类型，可以使用
* `repr` - 目前接受`C`，`C`表示兼容C ABI。

```rust
#[repr(C)]
enum eType {
    Operator,
    Indicator,
}
```

对于`struct`类型，可以使用

* `repr` - 目前只接受`C`和`packed`，`C`表示结构体兼容C ABI，`packed`表示移除字段间的padding。



### 用于宏的属性

* `macro_use` - 把模块或库中定义的宏导出来
    - 应用于`mod`上，则把此模块内定义的宏导出到它的父模块中
    - 应用于`extern crate`上，则可以接受一个列表，如

```rust
      #[macro_use(debug, trace)]
      extern crate log;
```

则可以只导入列表中指定的宏，若不指定则导入所有的宏。

* `macro_reexport` - 应用于`extern crate`上，可以再把这些导入的宏再输出出去给别的库使用。

* `macro_export` - 应于在宏上，可以使这个宏可以被导出给别的库使用。

* `no_link` - 应用于`extern crate`上，表示即使我们把它里面的库导入进来了，但是不要把这个库链接到目标文件中。

### 其它属性

* `export_function` - 用于静态变量或函数，指定它们在目标文件中的符号名。

* `link_section` - 用于静态变量或函数，表示应该把它们放到哪个段中去。

* `no_mangle` - 可以应用于任意的Item，表示取消对它们进行命名混淆，直接把它们的名字作为符号写到目标文件中。

* `simd` - 可以用于元组结构体上，并自动实现了数值运算符，这些操作会生成相应的SIMD指令。

* `doc` - 为这个Item绑定文档，跟`///`的功能一样，用法是

```rust
  #[doc = "This is a doc"]
  struct Foo {}
```

### 条件编译

有时候，我们想针对不同的编译目标来生成不同的代码，比如在编写跨平台模块时，针对Linux和Windows分别使用不同的代码逻辑。

条件编译基本上就是使用`cfg`这个属性，直接看例子

```rust
#[cfg(target_os = "macos")]
fn cross_platform() {
    // Will only be compiled on Mac OS, including Mac OS X
}

#[cfg(target_os = "windows")]
fn cross_platform() {
    // Will only be compiled on Windows
}

// 若条件`foo`或`bar`任意一个成立，则编译以下的Item
#[cfg(any(foo, bar))]
fn need_foo_or_bar() {

}

// 针对32位的Unix系统
#[cfg(all(unix, target_pointer_width = "32"))]
fn on_32bit_unix() {

}

// 若`foo`不成立时编译
#[cfg(not(foo))]
fn needs_not_foo() {

}
```

其中，`cfg`可接受的条件有

* `debug_assertions` - 若没有开启编译优化时就会成立。

* `target_arch = "..."` - 目标平台的CPU架构，包括但不限于`x86`, `x86_64`, `mips`, `powerpc`, `arm`或`aarch64`。

* `target_endian = "..."` - 目标平台的大小端，包括`big`和`little`。

* `target_env = "..."` - 表示使用的运行库，比如`musl`表示使用的是MUSL的libc实现, `msvc`表示使用微软的MSVC，`gnu`表示使用GNU的实现。
  但在部分平台这个数据是空的。

* `target_family = "..."` - 表示目标操作系统的类别，比如`windows`和`unix`。这个属性可以直接作为条件使用，如`#[unix]`，`#[cfg(unix)]`。

* `target_os = "..."` - 目标操作系统，包括但不限于`windows`, `macos`, `ios`, `linux`, `android`, `freebsd`, `dragonfly`, `bitrig`, `openbsd`, `netbsd`。

* `target_pointer_width = "..."` - 目标平台的指针宽度，一般就是`32`或`64`。

* `target_vendor = "..."` - 生产商，例如`apple`, `pc`或大多数Linux系统的`unknown`。

* `test` - 当启动了单元测试时（即编译时加了`--test`参数，或使用`cargo test`）。

还可以根据一个条件去设置另一个条件，使用`cfg_attr`，如

```rust
#[cfg_attr(a, b)]
```

这表示若`a`成立，则这个就相当于`#[cfg(b)]`。

条件编译属性只可以应用于Item，如果想应用在非Item中怎么办呢？可以使用`cfg!`宏，如

```rust
if cfg!(target_arch = "x86") {

} else if cfg!(target_arch = "x86_64") {

} else if cfg!(target_arch = "mips") {

} else {

}
```

这种方式不会产生任何运行时开销，因为不成立的条件相当于里面的代码根本不可能被执行，编译时会直接被优化掉。

### Linter参数

目前的Rust编译器已自带的Linter，它可以在编译时静态帮你检测不用的代码、死循环、编码风格等等。Rust提供了一系列的属性用于控制Linter的行为

* `allow(C)` - 编译器将不会警告对于`C`条件的检查错误。
* `deny(C)` - 编译器遇到违反`C`条件的错误将直接当作编译错误。
* `forbit(C)` - 行为与`deny(C)`一样，但这个将不允许别人使用`allow(C)`去修改。
* `warn(C)` - 编译器将对于`C`条件的检查错误输出警告。

编译器支持的Lint检查可以通过执行`rustc -W help`来查看。

### 内联参数

内联函数即建议编译器可以考虑把整个函数拷贝到调用者的函数体中，而不是生成一个`call`指令调用过去。这种优化对于短函数非常有用，有利于提高性能。

编译器自己会根据一些默认的条件来判断一个函数是不是应该内联，若一个不应该被内联的函数被内联了，实际上会导致整个程序更慢。

可选的属性有：

* `#[inline]` - 建议编译器内联这个函数
* `#[inline(always)]` - 要求编译器必须内联这个函数
* `#[inline(never)]` - 要求编译器不要内联这个函数

内联会导致在一个库里面的代码被插入到另一个库中去。

### 自动实现Trait

编译器提供一个编译器插件叫作`derive`，它可以帮你去生成一些代码去实现（impl）一些特定的Trait，如

```rust
#[derive(PartialEq, Clone)]
struct Foo<T> {
    a: i32,
    b: T,
}
```

编译器会自动为你生成以下的代码

```rust
impl<T: PartialEq> PartialEq for Foo<T> {
    fn eq(&self, other: &Foo<T>) -> bool {
        self.a == other.a && self.b == other.b
    }

    fn ne(&self, other: &Foo<T>) -> bool {
        self.a != other.a || self.b != other.b
    }
}

impl<T: Clone> Clone for Foo<T> {
    fn clone(&self) -> Foo<T> {
        Foo {
            a: self.a.clone(),
            b: self.b.clone(),
        }
    }
}
```

目前`derive`仅支持标准库中部分的Trait。

### 编译器特性

在非稳定版的Rust编译器中，可以使用一些不稳定的功能，比如一些还在讨论中的新功能、正在实现中的功能等。Rust编译器提供一个应用于Crate的属性`feature`来启用这些不稳定的功能，如

```rust
#![feature(advanced_slice_patterns, box_syntax, asm)]
```

具体可使用的编译器特性会因编译器版本的发布而不同，具体请阅读官方文档。


## 编译器参数

Rust编译器程序的名字是`rustc`，使用它的方法很简单：

```bash
$ rustc [OPTIONS] INPUT
```

其中，`[OPTIONS]`表示编译参数，而`INPUT`则表示输入文件。而编译参数有以下可选：

* `-h, --help` - 输出帮助信息到标准输出；

* `--cfg SPEC` - 传入自定义的条件编译参数，使用方法如

```rust
  fn main() {
      if cfg!(hello) {
          println!("world!");
      }
  }
```

  如上例所示，若`cfg!(hello)`成立，则运行程序就会输出`"world"`到标准输出。我们把这个文件保存为`hello.rs`然后编译它

```bash
  $ rustc --cfg hello hello.rs
```

运行它就会看到屏幕中输出了`world!`。

* `-L [KIND=]PATH` - 往链接路径中加入一个文件夹，并且可以指定这个路径的类型（Kind），这些类型包括
  - `dependency` - 在这个路径下找依赖的文件，比如说`mod`；
  - `crate` - 只在这个路径下找`extern crate`中定义的库；
  - `native` - 只在这个路径下找Native库；
  - `framework` - 只在OS X下有用，只在这个路径下找Framework；
  - `all` - 默认选项。

* `-l [KIND=]NAME` - 链接一个库，这个库可以指定类型（Kind）
  - `static` - 静态库；
  - `dylib` - 动态库；
  - `framework` - OS X的Framework。

  如果不传，默认为`dylib`。

  此处举一个例子如何手动链接一个库，我们先创建一个文件叫`myhello.rs`，在里面写一个函数

```rust
  // myhello.rs

  /// 这个函数仅仅向标签输出打印 Hello World!
  /// 不要忘记要把它标记为 pub 哦。
  pub fn print_hello() {
      println!("Hello World!");
  }
```

  然后把这个文件编译成一个静态库，`libmyhello.a`

```bash
  $ rustc --crate-type staticlib myhello.rs
```

  然后再创建一个`main.rs`，链接这个库并打印出"Hello World!"

```rust
  // main.rs

  // 指定链接库 myhello
  extern crate myhello;

  fn main() {
      // 调用库函数
      myhello::print_hello();
  }
```

  编译`main.rs`

```bash
  $ rustc -L. -lmyhello main.rs
```

  运行`main`，就会看到屏幕输出"Hello World!"啦。

* `--crate-type` - 指定编译输出类型，它的参数包括
  - `bin` - 二进行可执行文件
  - `lib` - 编译为库
  - `rlib` - Rust库
  - `dylib` - 动态链接库
  - `staticlib` - 静态链接库

* `--crate-name` - 指定这个Crate的名字，默认是文件名，如`main.rs`编译成可执行文件时默认是`main`，但你可以指定它为`foo`

  ```bash
  $ rustc --crate-name foo main.rs
  ```

  则会输出`foo`可执行文件。

* `--emit` - 指定编译器的输出。编译器默认是输出一个可执行文件或库文件，但你可以选择输出一些其它的东西用于Debug

  - `asm` - 输出汇编
  - `llvm-bc` - [LLVM Bitcode](http://llvm.org/docs/BitCodeFormat.html)；
  - `llvm-ir` - [LLVM IR](http://llvm.org/docs/LangRef.html)，即LLVM中间码（LLVM Intermediate Representation）；
  - `obj` - Object File（就是`*.o`文件）；
  - `link` - 这个是要结合其它`--emit`参数使用，会执行Linker再输出结果；
  - `dep-info` - 文件依赖关系（Debug用，类似于Makefile一样的依赖）。

  以上参数可以同时使用，使用逗号分割，如

```bash
  $ rustc --emit asm,llvm-ir,obj main.rs
```

  同时，在最后可以加一个`=PATH`来指定输出到一个特定文件，如

```bash
  $ rustc --emit asm=output.S,llvm-ir=output.ir main.rs
```

  这样会把汇编生成到`output.S`文件中，把LLVM中间码输出到`output.ir`中。

* `--print` - 打印一些信息，参数有
  - `crate-name` - 编译目标名；
  - `file-names` - 编译的文件名；
  - `sysroot` - 打印Rust工具链的根目录地址。

* `-g` - 在目标文件中保存符号，这个参数等同于`-C debuginfo=2`。

* `-O` - 开启优化，这个参数等同于`-C opt-level=2`。

* `-o FILENAME` - 指定输出文件名，同样适用于`--emit`的输出。

* `--out-dir DIR` - 指定输出的文件夹，默认是当前文件夹，且会忽略`-o`配置。

* `--explain OPT` - 解释某一个编译错误，比如

  若你写了一个`main.rs`，使用了一个未定义变量`f`

```rust
  fn main() {
      f
  }
  ```

  编译它时编译器会报错：

```
  main.rs:2:5: 2:6 error: unresolved name `f` [E0425]
  main.rs:2     f
                ^
  main.rs:2:5: 2:6 help: run `rustc --explain E0425` to see a detailed explanation
  error: aborting due to previous error
```

  虽然错误已经很明显，但是你也可以让编译器解释一下，什么是`E0425`错误：

```bash
  $ rustc --explain E0425
  // 编译器打印的说明
```

* `--test` - 编译成一个单元测试可执行文件

* `--target TRIPLE` - 指定目标平台，基本格式是`cpu-manufacturer-kernel[-os]`，例如

```bash
  ## 64位OS X
  $ rustc --target x86_64-apple-darwin
```

* `-W help` - 打印Linter的所有可配置选项和默认值。

* `-W OPT, --warn OPT` - 设置某一个Linter选项为Warning。
* `-A OPT, --allow OPT` - 设置某一个Linter选项为Allow。
* `-D OPT, --deny OPT` - 设置某一个Linter选项为Deny。
* `-F OPT, --forbit OPT` - 设置某一个Linter选项为Forbit。

* `-C FLAG[=VAL], --codegen FLAG[=VAL]` - 目标代码生成的的相关参数，可以用`-C help`来查看配置，值得关注的几个是
  - `linker=val` - 指定链接器；
  - `linker-args=val` - 指定链接器的参数；
  - `prefer-dynamic` - 默认Rust编译是静态链接，选择这个配置将改为动态链接；
  - `debug-info=level` - Debug信息级数，`0` = 不生成，`1` = 只生成文件行号表，`2` = 全部生成；
  - `opt-level=val` - 优化级数，可选`0-3`；
  - `debug_assertion` - 显式开启`cfg(debug_assertion)`条件。

* `-V, --version` - 打印编译器版本号。

* `-v, --verbose` - 开启啰嗦模式（打印编译器执行的日志）。

* `--extern NAME=PATH` - 用来指定外部的Rust库（`*.rlib`）名字和路径，名字应该与`extern crate`中指定的一样。

* `--sysroot PATH` - 指定工具链根目录。

* `-Z flag` - 编译器Debug用的参数，可以用`-Z help`来查看可用参数。

* `--color auto|always|never` - 输出时对日志加颜色
  - `auto` - 自动选择加还是不加，如果输出目标是虚拟终端（TTY）的话就加，否则就不加；
  - `always` - 给我加！
  - `never` - 你敢加？




