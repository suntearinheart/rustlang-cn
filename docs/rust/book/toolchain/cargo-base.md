# Cargo基础

* 通过发布配置文件自定义您的构建
* 在crates.io上发布库
* 使用工作区组织大型项目
* 从crates.io安装二进制文件
* 使用自定义命令扩展货物

## 使用版本配置文件自定义构建

发布配置文件是具有不同配置的预定义和可自定义的配置文件，允许程序员更好地控制编译代码的各种选项. 每个配置文件都是独立配置的.

Cargo有两个主要配置文件：Cargo在您运行货物构建时使用的dev配置文件以及Cargo在您运行货物构建时使用的释放配置文件--release. dev配置文件定义为具有良好的开发默认值，并且发布配置文件具有良好的发布版本默认值.

```bash
$ cargo build
    Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
$ cargo build --release
    Finished release [optimized] target(s) in 0.0 secs
```

当项目的`Cargo.toml`文件中没有任何`[profile.*]`部分时，Cargo具有适用于每个配置文件的默认设置. 通过为要自定义的任何配置文件添加`[profile.*]`部分，您可以覆盖默认设置的任何子集. 例如，以下是开发和发布配置文件的选择级别设置的默认值：

```toml
[profile.dev]
opt-level = 0

[profile.release]
opt-level = 3
```

opt-level设置控制Rust将应用于您的代码的优化次数，范围为0到3.应用更多优化会延长编译时间，因此如果您正在开发并经常编译代码，那么您需要更快 即使生成的代码运行得慢，也要进行编译。 这就是`dev`的默认选择`opt-level`为`0`的原因。当您准备发布代码时，最好花更多时间编译。 您只能在发布模式下编译一次，但是您将多次运行已编译的程序，因此对于运行速度更快的代码，发布模式的编译时间会更长。 这就是r`elease`配置文件的默认选择`opt-level`为`3`的原因。

```toml
[profile.dev]
opt-level = 1
```

此代码会覆盖默认设置0.现在，当我们运行货物构建时，Cargo将使用dev配置文件的默认值以及我们的自定义选项来进行选择级别。 因为我们将opt-level设置为1，所以Cargo将应用比默认值更多的优化，但不会像发布版本那样多。

有关每个配置文件的配置选项和默认值的完整列表，请参阅[Cargo的文档](https://doc.rust-lang.org/cargo/)

## 基于cargo的rust项目组织结构

对上述cargo默认的项目结构解释如下：

 `cargo.toml`和`cargo.lock`文件总是位于项目根目录下.
 源代码位于`src`目录下.
 默认的库入口文件是`src/lib.rs`.
 默认的可执行程序入口文件是`src/main.rs`.
 其他可选的可执行文件位于`src/bin/*.rs`(这里每一个rs文件均对应一个可执行文件).
 外部测试源代码文件位于`tests`目录下.
 示例程序源代码文件位于`examples`.
 基准测试源代码文件位于`benches`目录下.

好了，大家一定谨记这些默认规则，最好按照这种模式来组织自己的rust项目.

## cargo.toml和cargo.lock

`cargo.toml`和`cargo.lock`是cargo项目代码管理的核心两个文件，cargo工具的所有活动均基于这两个文件.

`cargo.toml`是cargo特有的项目数据描述文件，对于猿们而言，`cargo.toml`文件存储了项目的所有信息，它直接面向rust猿，猿们如果想让自己的rust项目能够按照期望的方式进行构建、测试和运行，那么，必须按照合理的方式构建'cargo.toml'.

而`cargo.lock`文件则不直接面向猿，猿们也不需要直接去修改这个文件.lock文件是cargo工具根据同一项目的toml文件生成的项目依赖详细清单文件，所以我们一般不用不管他，只需要对着`cargo.toml`文件撸就行了.

```toml
[package]
name = "hello_world"
version = "0.1.0"
authors = ["fuying"]

[dependencies]
```

toml文件是由诸如[package]或[dependencies]这样的段落组成，每一个段落又由多个字段组成，这些段落和字段就描述了项目组织的基本信息，例如上述toml文件中的[package]段落描述了`hello_world`项目本身的一些信息，包括项目名称（对应于name字段）、项目版本（对应于version字段）、作者列表（对应于authors字段）等；[dependencies]段落描述了`hello_world`项目的依赖项目有哪些.

下面我们来看看toml描述文件中常用段落和字段的意义.

## package段落

[package]段落描述了软件开发者对本项目的各种元数据描述信息，例如[name]字段定义了项目的名称，[version]字段定义了项目的当前版本，[authors]定义了该项目的所有作者，当然，[package]段落不仅仅包含这些字段，[package]段落的其他可选字段详见cargo参数配置章节.

## 定义项目依赖

使用cargo工具的最大优势就在于，能够对该项目的各种依赖项进行方便、统一和灵活的管理.这也是使用cargo对rust 的项目进行管理的重要目标之一.在cargo的toml文件描述中，主要通过各种依赖段落来描述该项目的各种依赖项.toml中常用的依赖段落包括一下几种：

* 基于rust官方仓库crates.io，通过版本说明来描述：
* 基于项目源代码的git仓库地址，通过URL来描述：
* 基于本地项目的绝对路径或者相对路径，通过类Unix模式的路径来描述：
  
这三种形式具体写法如下：

```toml
[dependencies]
typemap = "0.3"
plugin = "0.2*"
hammer = { version = "0.5.0"}
color = { git = "https://github.com/bjz/color-rs" }
geometry = { path = "crates/geometry" }
```

上述例子中，2-4行为方法一的写法，第5行为方法二的写法，第6行为方法三的写法.
这三种写法各有用处，如果项目需要使用crates.io官方仓库来管理项目依赖项，推荐使用第一种方法.如果项目开发者更倾向于使用git仓库中最新的源码，可以使用方法二.方法二也经常用于当官方仓库的依赖项编译不通过时的备选方案.方法三主要用于源代码位于本地的依赖项.

## 定义集成测试用例

cargo另一个重要的功能，即将软件开发过程中必要且非常重要的测试环节进行集成，并通过代码属性声明或者toml文件描述来对测试进行管理.其中，单元测试主要通过在项目代码的测试代码部分前用`#[test]`属性来描述，而集成测试，则一般都会通过toml文件中的[[test]]段落进行描述.
例如，假设集成测试文件均位于tests文件夹下，则toml可以这样来写：

```toml
[[test]]
name = "testinit"
path = "tests/testinit.rs"

[[test]]
name = "testtime"
path = "tests/testtime.rs"
```

上述例子中，name字段定义了集成测试的名称，path字段定义了集成测试文件相对于本toml文件的路径.
看看，定义集成测试就是如此简单.
需要注意的是:

* 如果没有在Cargo.toml里定义集成测试的入口，那么tests目录(不包括子目录)下的每个rs文件被当作集成测试入口.
* 如果在Cargo.toml里定义了集成测试入口，那么定义的那些rs就是入口，不再默认指定任何集成测试入口.

## 定义项目示例和可执行程序

介绍了cargo项目管理中常用的三个功能，还有两个经常使用的功能：example用例的描述以及bin用例的描述.其描述方法和test用例描述方法类似.不过，这时候段落名称'[[test]]'分别替换为：'[[example]]'或者'[[bin]]'.例如：

```toml
[[example]]
name = "timeout"
path = "examples/timeout.rs"

[[bin]]
name = "bin1"
path = "bin/bin1.rs"

```

对于'[[example]]'和'[[bin]]'段落中声明的examples和bins，需要通过'cargo run --example NAME'或者'cargo run --bin NAME'来运行，其中NAME对应于你在name字段中定义的名称.

## 构建、清理、更新以及安装

领会了toml描述文件的写法，是一个重要的方面.另一个重要的方面，就是cargo工具本身为我们程序猿提供的各种好用的工具.如果大家感兴趣，自己在终端中输入'cargo --help'查看即可.其中开发时最常用的命令就是'cargo build'，用于构建项目.此外，'cargo clean'命令可以清理target文件夹中的所有内容；'cargo update'根据toml描述文件重新检索并更新各种依赖项的信息，并写入lock文件，例如依赖项版本的更新变化等等；'cargo install'可用于实际的生产部署.这些命令在实际的开发部署中均是非常有用的.
