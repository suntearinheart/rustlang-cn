# I/O

输入最基本的功能是读(Read)，输出最基本的功能是写(Write)实现了 `Read` 接口的叫 reader，而实现了 `Write` 的叫 writer。Rust里面的 Trait可以带默认实现，比如用户定义的 reader 只需要实现 `read` 一个方法就可以调用 `Read` trait 里面的任意其它方法，而 writer 也只需要实现 `write` 和 `flush` 两个方法。

Read 由于每调用一次 `read` 方法都会调用一次系统API与内核交互，效率比较低，如果给 reader 增加一个 buffer，这就是所谓的 `BufRead` Trait。一个普通的 reader 通过 `io::BufReader::new(reader)` 或者 `io::BufReader::with_capacity(bufSize, reader)` 就可以得到一个 BufReader 。BufReader 比较常用的两个方法是按行读： `read_line(&mut self, buf: &mut String) -> Result<usize>` 和 `lines(&mut self) -> Lines<Self>`，需要注意的是后者返回的是一个迭代器。

## 标准输入与输出

通用的标准输入与输出定义在 `std::io` 模块里，调用 `std::io::stdin()` 和 `std::io::stdout()` 两个函数分别会得到输入句柄和输出句柄,这两个句柄默认会通过互斥锁同步，也就是说不让多个进程同时读或写标准输入输出，我们还可以显式地在句柄上调用 `.lock()`。输入输出句柄实现了前面讲的读写 Trait，所以是 reader/writer，就可以调接口来读写标准输入与输出了.

```rust
use std::io;

fn read_from_stdin(buf: &mut String) -> io::Result<()> {
	io::stdin().read_line(buf)?;
	Ok(())
}
```

```rust
use std::io;

fn write_to_stdout(buf: &[u8]) -> io::Result<()> {
	io::stdout().write(&buf)?;
	Ok(())
}
```

上面的例子都是返回了 `io::Result<()>` 类型，这是 IO 操作通用的写法， IO 操作是程序与外界打交道，都是有可能失败的，用 `io::Result<T>` 把结果包起来，`io::Result<T>` 只是标准 `Result<T,E>` 中 `E` 固定为 `io::Error` 后类型的别名，而作为有副作用的操作我们一般是不用关心其返回值的，因为执行这类函数其真正的意义都体现在副作用上面了，所以返回值只是用来表示是否成功执行，而本身 `Result` 类型本身已经可以表示执行状态了，里面的 `T` 是什么则无关紧要，既然 `T` 没什么意义，那我们就选没什么意义的 `unit` 类型好了，所以 IO 操作基本上都是使用 `io::Result<()>`。

由于 IO 操作可能会失败所以一般都是和 `?` 一起使用的，但是 `?` 在遇到错误时会把错误 `return` 出去的，所以需要保证包含 `?` 语句的函数其返回类型是 `io::Result<T>`，还有 `main` 函数是没有返回值的，而 `?` 会返回 `io::Result<T>`，所以不能直接把 `?` 放 `main` 函数里。需要主要的是 Rust 里面没有办法从键盘获取一个数字类型的值。实际上像 C 这样的语言也不是直接获取了数字类型，它只不过是做了一种转换。如果想要从键盘获取一个数字类型：

```rust
fn main() {
	let mut input = String::new();
		std::io::stdin()
			.read_line(&mut input)
			.expect("Failed to read line");
    // 这里等效的写法是：
    // let num: i32 = input.trim().parse().unwrap(); 
	let num = input.trim().parse::<i32>().unwrap();
	println!("您输入的数字是：{}", num);
}
```

如果有很多地方都需要输入数字可以自行编写一个 `numin` 宏:

```rust
macro_rules! numin {
	  () =>{
	      {
            let mut input = String::new();
	          std::io::stdin()
	              .read_line(&mut input)
                .expect("Failed to read line");
	          input.trim().parse().unwrap()
        }
    };
}
```

于是上面的程序可以被改写成：

```rust
fn main() {
    let num: i32 = numin!();
	println!("您输入的数字是：{}", num);
}
```
如果用户输入的不是数字，那么就会导致错误。这一点和 C 里面是非常相似的。当然您可以把程序写得再复杂一点儿来保证用户输入的一定是数字。如何从命令行接受输入参数，在 Rust 里面被归为环境变量，可以通过 `std::env::args()` 获取，这个函数返回一个 `Args` 迭代器，其中第一个就是程序名，后面的都是输入给程序的命令行参数。

```rust
use std::env;

fn main() {
	let args = env::args();
	for arg in args {
		println!("{}", arg);
	}
}
```

将上面的程序存为 *args.rs* 然后编译执行，结果如下

```
$ rustc args.rs
$ ./args a b c
./args
a
b
c
```

# print! 宏

标准输出的行缓冲。它一个表现就是 `print!` 宏。在 `print!` 宏后面接上一个输入就会发现这种按行缓冲的机制。

```rust
fn main() {
	print!("hello!\ninput:");
	let mut input = String::new();
		std::io::stdin()
			.read_line(&mut input)
			.expect("Failed to read line");
	println!("line:{}",input);
}
```

您可以编译并运行这段程序试一试，您会发现我们并没有得到预期的（下划线代表光标的位置）：

```
hello!
input:_
```

而是得到了：

```
hello!
_
```

这就是由于标准输出中的这种行缓冲机制，在遇到换行符之前，输出的内容并不会隐式的刷新，这就导致 `print!` 宏和 `println!` 宏实际上并不完全相同。在标准库中 `print!` 宏是这样的：

```rust
macro_rules! print {
    ($($arg:tt)*) => { ... };
}
```

由此，我们可以对它进行改进，使它和 `println!` 宏被自动刷新，不过这种刷新是一种显式的刷新。

```rust
use std::io::{self, Write};

macro_rules! printf {
	($($arg:tt)*) =>{
		print!($($arg)*);
		io::stdout().flush().unwrap();
	}
}
```

此外，当您需要刷新还没有遇到换行符的一行内容的时候您都可以使用 `io::stdout().flush().unwrap();` 进行刷新，需要注意的是要先 `use std::io::{self, Write};` 。