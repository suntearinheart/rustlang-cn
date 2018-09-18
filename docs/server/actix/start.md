# 开始

让我们创建并运行我们的第一个actix应用程序。我们将创建一个新的`Cargo`项目，该项目依赖于`actix`然后运行应用程序。

在上一节中，我们已经安装了所需的Rust版本 现在让我们创建新的Cargo项目。

## Ping actor

让我们来写第一个`actix`应用程序吧！首先创建一个新的基于二进制的`Cargo`项目并切换到新目录：

```bash
cargo new actor-ping --bin
cd actor-ping
```

现在，通过确保您的Cargo.toml包含以下内容，将actix添加为项目的依赖项：

```toml
[dependencies]
actix = "0.7"
```

让我们创建一个接受`Ping`消息的`actor`，并使用处理的`ping`数进行响应。

actor是实现`Actor` trait的类型：

```rust
extern crate actix;
use actix::prelude::*;

struct MyActor {
    count: usize,
}

impl Actor for MyActor {
    type Context = Context<Self>;
}

fn main() {}
```

每个`actor`都有一个`Context`, 对于`MyActor`我们将使用`Context<A>`。有关actor上下文的更多信息，请参阅下一节。

现在我们需要定义actor需要接受的`Message`。消息可以是实现`Message`trait的任何类型。

```rust
extern crate actix;
use actix::prelude::*;

struct Ping(usize);

impl Message for Ping {
    type Result = usize;
}

fn main() {}
```

`Message`trait的主要目的是定义结果类型。 `Ping`消息定义`usize`，表示任何可以接受`Ping`消息的actor都需要返回`usize`值。

最后，我们需要声明我们的`actor` `MyActor`可以接受`Ping`并处理它。为此，actor需要实现`Handler <Ping>` trait。

```rust
extern crate actix;
use actix::prelude::*;

struct MyActor {
   count: usize,
}
impl Actor for MyActor {
    type Context = Context<Self>;
}

struct Ping(usize);

impl Message for Ping {
   type Result = usize;
}

impl Handler<Ping> for MyActor {
    type Result = usize;

    fn handle(&mut self, msg: Ping, ctx: &mut Context<Self>) -> Self::Result {
        self.count += msg.0;

        self.count
    }
}

fn main() {}
```

现在我们只需要启动我们的actor并向其发送消息。启动过程取决于actor的上下文实现。在我们的情况下可以使用`Context <A>`其基于tokio / future。我们可以用`Actor :: start（）`开始它或者`Actor :: create（）`。第一个是在可以立即创建actor实例时使用的。第二种方法用于我们在创建之前需要访问上下文对象的情况actor实例。对于`MyActor` actor，我们可以使用`start（）`。

与actor的所有通信都通过一个address。你可以`do_send`一条消息无需等待响应，或`send`给具有特定消息的`actor`。`start（）`和`create（）`都返回一个address对象。

在下面的示例中，我们将创建一个`MyActor` actor并发送一条消息。

```rust
extern crate actix;
extern crate futures;
use futures::Future;
use actix::prelude::*;
struct MyActor {
   count: usize,
}
impl Actor for MyActor {
    type Context = Context<Self>;
}

struct Ping(usize);

impl Message for Ping {
    type Result = usize;
}
impl Handler<Ping> for MyActor {
    type Result = usize;

    fn handle(&mut self, msg: Ping, ctx: &mut Context<Self>) -> Self::Result {
        self.count += msg.0;
        self.count
    }
}

fn main() {
    let system = System::new("test");

    // start new actor
    let addr = MyActor{count: 10}.start();

    // send message and get future for result
    let res = addr.send(Ping(10));

    Arbiter::spawn(
        res.map(|res| {
            # System::current().stop();
            println!("RESULT: {}", res == 20);
        })
        .map_err(|_| ()));

    system.run();
}
```

Ping示例位于[示例](https://github.com/actix/actix/tree/master/examples/)中。
