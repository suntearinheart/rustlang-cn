# 开始

第一步是安装 Rust。我们通过 `rustup` 下载 Rust，这是一个管理 Rust 版本和相关工具的命令行工具。下载时需要联网。

> 注意：如果出于某些理由你倾向于不使用 `rustup`，请到 [Rust 安装页面](https://www.rust-lang.org/install.html) 查看其它安装选项。

以下步骤安装Rust编译器的最新稳定版本。Rust的稳定性保证了书中编译的所有示例都将继续使用较新的Rust版本进行编译。版本之间的输出可能略有不同，因为Rust通常会改进错误消息和警告。换句话说，使用这些步骤安装的任何较新的稳定版本的Rust应该按照本书的内容正常工作。

## 在 Linux 或 macOS 上安装 `rustup`

如果你使用 Linux 或 macOS，打开终端并输入如下命令：

```rust
$ curl https://sh.rustup.rs -sSf | sh
```

此命令下载一个脚本并开始安装 `rustup` 工具，这会安装最新稳定版 Rust。过程中可能会提示你输入密码。如果安装成功，将会出现如下内容：

```rust
Rust is installed now. Great!
```

如果你愿意，可在运行前下载并检查该脚本。

此安装脚本自动将 Rust 加入系统 PATH 环境变量中，在下一次登录时生效。如果你希望立刻就开始使用 Rust 而不重启终端，在 shell 中运行如下命令，手动将 Rust 加入系统 PATH 变量中：

```rust
$ source $HOME/.cargo/env
```

或者，可以在 *~/.bash_profile* 文件中增加如下行：

```rust
$ export PATH="$HOME/.cargo/bin:$PATH"
```

另外，你需要一个某种类型的链接器（linker）。很有可能已经安装，不过当你尝试编译 Rust 程序时，却有错误指出无法执行链接器，这意味着你的系统上没有安装链接器，你需要自行安装一个。C 编译器通常带有正确的链接器。请查看你使用平台的文档，了解如何安装 C 编译器。并且，一些常用的 Rust 包依赖 C 代码，也需要安装 C 编译器。因此现在安装一个是值得的。

### 在 Windows 上安装 `rustup`

在 Windows 上，前往 [https://www.rust-lang.org/install.html][install] 并按照说明安装 Rust。在安装过程的某个步骤，你会收到一个信息说明为什么需要安装 Visual Studio 2013 或之后版本的 C++ build tools。获取这些 build tools 最方便的方法是安装 [Build Tools for Visual Studio 2017][visualstudio]。这个工具在 “Other Tools and Frameworks” 部分。

[install]: https://www.rust-lang.org/install.html
[visualstudio]: https://www.visualstudio.com/downloads/

本书的余下部分，使用能同时运行于 *cmd.exe* 和 PowerShell 的命令。如果存在特定差异，我们会解释使用哪一个。

### 关于 Rust 安装的注意事项

Rust 由 [rustup](https://github.com/rust-lang-nursery/rustup.rs) 工具来安装和管理。 Rust 有一个 6 周的 快速发布过程 并且支持 大量的平台 ，所以任何时候都有很多 Rust 构建可用。 rustup 在 Rust 支持的每一个平台上以一致的方式管理这些构建， 并可以从 beta 和 nightly 发布渠道安装 Rust，且支持额外的交叉编译目标平台。

更多信息请查看 [rustup documentation](https://github.com/rust-lang-nursery/rustup.rs/blob/master/README.md)。

配置 PATH 环境变量
在 Rust 开发环境中，所有工具都安装到 ~/.cargo/bin 目录， 并且您能够在这里找到 Rust 工具链，包括 rustc、cargo 及 rustup。

因此，Rust 开发者们通常会将此目录放入 PATH 环境变量。在安装时，rustup 会尝试配置 PATH， 但是因为不同平台、命令行之间的差异，以及 rustup 的 bug，对于 PATH 的修改将会在重启终端、用户登出之后生效，或者有可能完全不会生效。

当安装完成之后，如果在控制台运行 rustc --version 失败，这是最可能的原因。

### 其他安装方法

上述通过 rustup 的安装方法是大多数开发者的首选。 此外， Rust 也可以 通过[其他方法安装](https://www.rust-lang.org/zh-CN/other-installers.html)。

### 更新和卸载

通过 `rustup` 安装了 Rust 之后，很容易更新到最新版本。在 shell 中运行如下更新脚本：

```rust
$ rustup update
```

为了卸载 Rust 和 `rustup`，在 shell 中运行如下卸载脚本:

```rust
$ rustup self uninstall
```

### 故障排除（Troubleshooting）

要检查是否正确安装了 Rust，打开 shell 并运行如下行：

```rust
$ rustc --version
```

你应能看到已发布的最新稳定版的版本号、提交哈希和提交日期，显示为如下格式：

```rust
rustc x.y.z (abcabcabc yyyy-mm-dd)
```

如果出现这些内容，Rust 就安装成功了！如果并没有看到这些信息，并且使用的是 Windows，请检查 Rust 是否位于 `%PATH%` 系统变量中。如果一切正确但 Rust 仍不能使用，有许多地方可以求助。可以使用 [Mibbit][mibbit] 来访问它。然后就能和其他 Rustacean（Rust 用户的称号，有自嘲意味）聊天并寻求帮助。其它给力的资源包括[用户论坛][users]和 [Stack Overflow][stackoverflow]。

[mibbit]: http://chat.mibbit.com/?server=irc.mozilla.org&channel=%23rust
[users]: https://users.rust-lang.org/
[stackoverflow]: http://stackoverflow.com/questions/tagged/rust

### 本地文档

安装程序也自带一份文档的本地拷贝，可以离线阅读。运行 `rustup doc` 在浏览器中查看本地文档。

任何时候，如果你拿不准标准库中的类型或函数的用途和用法，请查看应用程序接口（application programming interface，API）文档！

## Hello, World

打开终端并输入如下命令创建 *projects* 目录，并在 *projects* 目录中为 Hello, world! 项目创建一个目录。

对于 Linux 和 macOS，输入：

```rust
$ mkdir ~/projects
$ cd ~/projects
$ mkdir hello_world
$ cd hello_world
```

对于 Windows CMD，输入：

```cmd
> mkdir "%USERPROFILE%\projects"
> cd /d "%USERPROFILE%\projects"
> mkdir hello_world
> cd hello_world
```

对于 Windows PowerShell，输入：

```powershell
> mkdir $env:USERPROFILE\projects
> cd $env:USERPROFILE\projects
> mkdir hello_world
> cd hello_world
```

### 编写并运行 Rust 程序

接下来，新建一个源文件，命名为 *main.rs*。Rust 源文件总是以 *.rs* 扩展名结尾。如果文件名包含多个单词，使用下划线分隔它们。例如命名为 *hello_world.rs*，而不是 *helloworld.rs*。

现在打开刚创建的 *main.rs* 文件，输入示例 1-1 中的代码。

main.rs

```rust
fn main() {
    println!("Hello, world!");
}
```

示例: 一个打印 `Hello, world!` 的程序

保存文件，并回到终端窗口。在 Linux 或 macOS 上，输入如下命令，编译并运行文件：

```rust
$ rustc main.rs
$ ./main
Hello, world!
```

在 Windows 上，输入命令 `.\main.exe`，而不是 `./main`：

```powershell
> rustc main.rs
> .\main.exe
Hello, world!
```

不管使用何种操作系统，终端应该打印字符串 `Hello, world!`。如果没有看到这些输出，回到 “故障排除” 部分查找寻求帮助的方法。

如果 `Hello, world!` 出现了，恭喜你！你已经正式编写了一个 Rust 程序。现在你成为一名 Rust 程序员，欢迎！

### 分析 Rust 程序

现在，让我们回过头来仔细看看 Hello, world! 程序中到底发生了什么。这是第一块拼图：

```rust
fn main() {

}
```

这几行定义了一个 Rust 函数。`main` 函数是一个特殊的函数：在可执行的 Rust 程序中，它总是最先运行的代码。第一行代码声明了一个叫做 `main` 的函数，它没有参数也没有返回值。如果有参数的话，它们的名称应该出现在小括号中，`()`。

还须注意，函数体被包裹在花括号中，`{}`。Rust 要求所有函数体都要用花括号包裹起来（译者注：有些语言，当函数体只有一行时可以省略花括号，但在 Rust 中是不行的）。一般来说，将左花括号与函数声明置于同一行并以空格分隔，是良好的代码风格。

如果你希望在 Rust 项目中保持一种标准风格，`rustfmt` 会将代码格式化为特定的风格。Rust 团队计划最终将该工具包含在标准 Rust 发行版中，就像 `rustc`。所以根据你阅读本书的时间，它可能已经安装到你的电脑中了！检查在线文档以了解更多细节。

在 `main()` 函数中是如下代码：

```rust
    println!("Hello, world!");
```

这行代码完成这个简单程序的所有工作：在屏幕上打印文本。这里有四个重要的细节需要注意。首先 Rust 的缩进风格使用 4 个空格，而不是 1 个制表符（tab）。

第二，`println!` 调用了一个 Rust 宏（macro）。如果是调用函数，则应输入 `println`（没有`!`）。我们将在附录 D 中详细讨论宏。现在你只需记住，当看到符号 `!` 的时候，就意味着调用的是宏而不是普通函数。

第三，`"Hello, world!"` 是一个字符串。我们把这个字符串作为一个参数传递给 `println!`，字符串将被打印到屏幕上。

第四，该行以分号结尾（`;`），这代表一个表达式的结束和下一个表达式的开始。大部分 Rust 代码行以分号结尾。

### 编译和运行是彼此独立的步骤

你刚刚运行了一个新创建的程序，那么让我们检查此过程中的每一个步骤。

在运行 Rust 程序之前，必须先使用 Rust 编辑器编译它，即输入 `rustc` 命令并传入源文件名称，如下：

```rust
$ rustc main.rs
```

如果你有 C 或 C++ 背景，就会发现这与 `gcc` 和 `clang` 类似。编译成功后，Rust 会输出一个二进制的可执行文件。

在 Linux、macOS 或 Windows 的 PowerShell 上，在 shell 中输入 `ls` 命令就可看见这个可执行文件，如下：

```rust
$ ls
main  main.rs
```

在 Windows 的 CMD 上，则输入如下内容：

```cmd
> dir /B %= the /B option says to only show the file names =%
main.exe
main.pdb
main.rs
```

这展示了扩展名为 *.rs* 的源文件、可执行文件（在 Windows 下是 *main.exe*，其它平台是 *main*），以及当使用 CMD 时会有一个包含调试信息、扩展名为 *.pdb* 的文件。从这里开始运行 *main* 或 *main.exe* 文件，如下：

```rust
$ ./main # or .\main.exe on Windows
```

如果 *main.rs* 是上文所述的 Hello, world! 程序，它将会在终端上打印 `Hello, world!`。

如果你更熟悉动态语言，如 Ruby、Python 或 JavaScript，则可能不习惯将编译和运行分为两个单独的步骤。Rust 是一种 **预编译静态类型**（*ahead-of-time compiled*）语言，这意味着你可以编译程序，并将可执行文件送给其他人，他们甚至不需要安装 Rust 就可以运行。如果你给他人一个 *.rb*、*.py* 或 *.js* 文件，他们需要先分别安装 Ruby，Python，JavaScript 实现（运行时环境，VM）。不过在这些语言中，只需要一句命令就可以编译和运行程序。这一切都是语言设计上的权衡取舍。

仅仅使用 `rustc` 编译简单程序是没问题的，不过随着项目的增长，你可能需要管理你项目的方方面面，并让代码易于分享。接下来，介绍一个叫做 Cargo 的工具，它会帮助你编写真实世界中的 Rust 程序。


## Hello, Cargo!

Cargo 是 Rust 的构建系统和包管理器。大多数 Rustacean 们使用 Cargo 来管理他们的 Rust 项目，因为它可以为你处理很多任务，比如构建代码、下载依赖库并编译这些库。（我们把代码所需要的库叫做 **依赖**（*dependencies*））。

最简单的 Rust 程序，没有任何依赖。所以如果使用 Cargo 来构建 Hello, world! 项目，将只会用到 Cargo 的构建代码那部分功能。随着编写的 Rust 程序更加复杂，你会添加依赖，如果你一开始就使用 Cargo 的话，添加依赖将会变得简单许多。如果使用 官方安装包的话，则自带了 Cargo。如果通过其他方式安装的话，可以在终端输入如下命令检查是否安装了 Cargo：

```rust
$ cargo --version
```

如果你看到了版本号，说明已安装！如果看到类似 `command not found` 的错误，你应该查看相应安装文档以确定如何单独安装 Cargo。

### 使用 Cargo 创建项目

我们使用 Cargo 创建一个新项目，然后看看与上面的 Hello, world! 项目有什么不同。回到 *projects* 目录（或者你存放代码的目录）。接着，可在任何操作系统下运行以下命令：

```rust
$ cargo new hello_cargo --bin
$ cd hello_cargo
```

第一行命令新建了名为 *hello_cargo* 的二进制可执行程序。为 `cargo new` 传入 `--bin` 参数会生成一个可执行程序（通常就叫做 **二进制文件**，*binary*），而不是一个库。项目被命名为 `hello_cargo`，同时 Cargo 在一个同名目录中创建项目文件。

进入 *hello_cargo* 目录并列出文件。将会看到 Cargo 生成了两个文件和一个目录：一个 *Cargo.toml* 文件，一个 *src* 目录，以及位于 *src* 目录中 *main.rs* 文件。它也在 *hello_cargo* 目录初始化了一个 git 仓库，以及一个 *.gitignore* 文件。

> 注意：Git 是一个常用的版本控制系统（version control system， VCS）。可以通过 `--vcs` 参数使 `cargo new` 切换到其它版本控制系统（VCS），或者不使用 VCS。运行 `cargo new --help` 参看可用的选项。

请选用文本编辑器打开 *Cargo.toml* 文件。它应该看起来如示例 1-2 所示：

Cargo.toml

```toml
[package]
name = "hello_cargo"
version = "0.1.0"
authors = ["Your Name <you@example.com>"]

[dependencies]
```

示例: *cargo new* 命令生成的 *Cargo.toml* 的内容

这个文件使用 [*TOML*][toml]<!-- ignore --> (*Tom's Obvious, Minimal Language*) 格式，这是 Cargo 配置文件的格式。

[toml]: https://github.com/toml-lang/toml

第一行，`[package]`，是一个片段（section）标题，表明下面的语句用来配置一个包。随着我们在这个文件增加更多的信息，还将增加其他片段（section）。

接下来的三行设置了 Cargo 编译程序所需的配置：项目的名称、版本和作者。Cargo 从环境中获取你的名字和 email 信息，所以如果这些信息不正确，请修改并保存此文件。

最后一行，`[dependencies]`，是罗列项目依赖的片段。在 Rust 中，代码包被称为 *crates*。这个项目并不需要其他的 crate，不过在第二章的第一个项目会用到依赖，那时会用得上这个片段。

现在打开 *src/main.rs* 看看：

src/main.rs

```rust
fn main() {
    println!("Hello, world!");
}
```

Cargo 为你生成了一个 Hello World! 程序，正如我们之前编写的示例 1-1！目前为止，之前项目与 Cargo 生成项目的区别是 Cargo 将代码放在 *src* 目录，同时项目根目录包含一个 *Cargo.toml* 配置文件。

Cargo 期望源文件存放在 *src* 目录中。项目根目录只存放 README、license 信息、配置文件和其他跟代码无关的文件。使用 Cargo 帮助你保持项目干净整洁，一切井井有条。

如果没有用 Cargo 开始项目，比如我们创建的 Hello,world! 项目，可以将其转化为一个 Cargo 项目。将代码放入 *src* 目录，并创建一个合适的 *Cargo.toml* 文件。

### 构建并运行 Cargo 项目

现在让我们看看通过 Cargo 构建和运行 Hello, world! 程序有什么不同！在 *hello_cargo* 目录下，输入下面的命令来构建项目：

```rust
$ cargo build
   Compiling hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 2.85 secs
```

这个命令会创建一个可执行文件 *target/debug/hello_cargo* （在 Windows 上是 *target\debug\hello_cargo.exe*），而不是放在目前目录下。可以通过这个命令运行可执行文件：

```rust
$ ./target/debug/hello_cargo # or .\target\debug\hello_cargo.exe on Windows
Hello, world!
```

如果一切顺利，终端上应该会打印出 `Hello, world!`。首次运行 `cargo build` 时，也会使 Cargo 在项目根目录创建一个新文件：*Cargo.lock*。这个文件记录项目依赖的实际版本。这个项目并没有依赖，所以其内容比较少。你自己永远也不需要碰这个文件，让 Cargo 处理它就行了。

我们刚刚使用 `cargo build` 构建了项目，并使用 `./target/debug/hello_cargo` 运行了程序，也可以使用 `cargo run` 在一个命令中同时编译并运行生成的可执行文件：

```rust
$ cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
     Running `target/debug/hello_cargo`
Hello, world!
```

注意这一次并没有出现表明 Cargo 正在编译 `hello_cargo` 的输出。Cargo 发现文件并没有被改变，就直接运行了二进制文件。如果修改了源文件的话，Cargo 会在运行之前重新构建项目，并会出现像这样的输出：

```rust
$ cargo run
   Compiling hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 0.33 secs
     Running `target/debug/hello_cargo`
Hello, world!
```
Cargo 还提供了一个叫 `cargo check` 的命令。该命令快速检查代码确保其可以编译，但并不产生可执行文件：

```rust
$ cargo check
   Compiling hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 0.32 secs
```

为什么你会不需要可执行文件呢？通常 `cargo check` 要比 `cargo build` 快得多，因为它省略了生成可执行文件的步骤。如果编写代码时持续的进行检查，`cargo check` 会加速开发！为此很多 Rustaceans 编写代码时定期运行 `cargo check` 确保它们可以编译。当准备好使用可执行文件时才运行 `cargo build`。

我们回顾下已学习的 Cargo 内容：

* 可以使用 `cargo build` 或 `cargo check` 构建项目。
* 可以使用 `cargo run` 一步构建并运行项目。
* 有别于将构建结果放在与源码相同的目录，Cargo 会将其放到 *target/debug* 目录。

使用 Cargo 的一个额外的优点是，不管你使用什么操作系统，其命令都是一样的。所以从此以后本书将不再为 Linux 和 macOS 以及 Windows 提供相应的命令。

### 发布（release）构建

当项目最终准备好发布时，可以使用 `cargo build --release` 来优化编译项目。这会在 *target/release* 而不是 *target/debug* 下生成可执行文件。这些优化可以让 Rust 代码运行的更快，不过启用这些优化也需要消耗更长的编译时间。这也就是为什么会有两种不同的配置：一种是为了开发，你需要经常快速重新构建；另一种是为用户构建最终程序，它们不会经常重新构建，并且希望程序运行得越快越好。如果你在测试代码的运行时间，请确保运行 `cargo build --release` 并使用 *target/release* 下的可执行文件进行测试。

### 把 Cargo 当作习惯

对于简单项目， Cargo 并不比 `rustc` 提供了更多的优势，不过随着开发的深入，终将证明其价值。对于拥有多个 crate 的复杂项目，交给 Cargo 来协调构建将简单的多。

即便 `hello_cargo` 项目十分简单，它现在也使用了很多在你之后的 Rust 生涯将会用到的实用工具。其实，要在任何已存在的项目上工作时，可以使用如下命令通过 Git 检出代码，移动到该项目目录并构建：

```rust
$ git clone someurl.com/someproject
$ cd someproject
$ cargo build
```

关于更多 Cargo 的信息，请查阅 [其文档][its documentation]。

[its documentation]: https://doc.rust-lang.org/cargo/

## 总结

你已经踏上了 Rust 之旅！在本章中，你学习了如何：

* 使用 `rustup` 安装最新稳定版的 Rust
* 更新到新版的 Rust
* 打开本地安装的文档
* 直接通过 `rustc` 编写并运行 Hello, world! 程序
* 使用 Cargo 创建并运行新项目

是时候通过构建更真实的程序来熟悉读写 Rust 代码了。所以在下一章，我们会构建一个猜猜看游戏程序。如果你更愿意从学习 Rust 常用的编程概念开始，请阅读第三章，接着再回到第二章。
