# 快速入门
在开始编写`actix`应用程序之前，您需要安装Rust版本。我们建议您使用`rustup`来安装或配置此类版本。

## 安装Rust
在开始之前，我们需要使用[rustup](https://www.rustup.rs/)安装Rust ：

```bash
curl https://sh.rustup.rs -sSf | sh
```

如果已经安装了`rustup`，请运行此命令以确保您拥有最新版本的Rust：

```bash
rustup update
```

actix框架需要Rust版本1.21及更高版本。

## 运行示例
开始试验actix的最快方法是克隆actix仓库并运行examples 目录中包含的示例。以下命令集运行`ping`示例：

```bash
git clone https://github.com/actix/actix
cargo run --example ping
```

查看[examples/](https://github.com/actix/actix/tree/master/examples)目录以获取更多示例.
