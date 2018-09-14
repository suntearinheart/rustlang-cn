# Actor

Actix是一个Rust库，为开发并发应用程序提供了框架。

Actix建立在[Actor Model](https://en.wikipedia.org/wiki/Actor_model)上。允许将应用程序编写为一组独立执行但合作的应用程序
通过消息进行通信的"Actor"。 Actor是封装的对象状态和行为，并在actix库提供的**Actor System**中运行。

Actor在特定的执行上下文` Context `中运行,上下文对象仅在执行期间可用。每个Actor都有一个单独的执行上下文。执行上下文还控制actor的生命周期。

Actor通过交换消息进行通信。分派Actor可以可选择等待响应。Actor不是直接引用，而是通过引用地址

任何Rust类型都可以是一个actor，它只需要实现` Actor` trait。

为了能够处理特定消息`actor`必须提供的此消息的` Handler `实现。所有消息是静态类型的。消息可以以异步方式处理。Actor可以生成其他actor或将future/stream添加到执行上下文。`Actor` trait提供了几种允许控制`actor`生命周期的方法。


## Actor生命周期

### Started

`actor`总是以`Started`状态开始。在这种状态下，`actor`的`started（）`方法被调用。 `Actor` trait为此方法提供了默认实现。在此状态期间可以使用actor上下文，并且actor可以启动更多actor或注册异步流或执行任何其他所需的配置。

### Running

调用Actor的`started（）`方法后，actor转换为`Running`状态。`actor`可以一直处于`running`状态。

### Stopping

在以下情况下，Actor的执行状态将更改为`stopping`状态：

* `Context :: stop`由actor本身调用
* `actor`的所有地址都被消毁。即没有其他Actor引用它。
* 在上下文中没有注册事件对象。

一个actor可以通过创建一个新的地址或添加事件对象,并返回`Running :: Continue`，从而使`stopped`状态恢复到`running`状态，。

如果一个actor因为调用了`Context :: stop（）`状态转换为`stop`，则上下文立即停止处理传入的消息并调用`Actor::stopping()`。如果`actor`没有恢复到`running`状态，那么全部未处理的消息被删除。

默认情况下，此方法返回`Running :: Stop`，确认停止操作。

### Stopped

如果actor在停止状态期间没有修改执行上下文，则actor状态会转换到`Stopped`。这种状态被认为是最终状态，此时`actor`被消毁


## Message

Actor通过发送消息与其他actor通信。在actix中所有消息是typed。消息可以是实现[Message](https://actix/trait.Message.html) trait的任何rust类型。 `Message :: Result`定义返回类型。让我们定义一个简单的`Ping`消息 - 接受此消息的actor需要返回`io::Result<bool>`。

```rust
extern crate actix;
use std::io;
use actix::prelude::*;

struct Ping;

impl Message for Ping {
    type Result = Result<bool, io::Error>;
}

fn main() {}
```

## 生成actor

如何开始一个actor取决于它的上下文（context）。产生一个新的异步`actor`是通过实现[Actor](https://actix/Actor.html)trait 的`start`和`create`方法。它提供了几种不同的方式创造Actor;有关详细信息，请查看文档。

## 完整的例子

```rust
use std::io;
use actix::prelude::*;
use futures::Future;

/// Define message
struct Ping;

impl Message for Ping {
    type Result = Result<bool, io::Error>;
}


// Define actor
struct MyActor;

// Provide Actor implementation for our actor
impl Actor for MyActor {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Context<Self>) {
       println!("Actor is alive");
    }

    fn stopped(&mut self, ctx: &mut Context<Self>) {
       println!("Actor is stopped");
    }
}

/// Define handler for `Ping` message
impl Handler<Ping> for MyActor {
    type Result = Result<bool, io::Error>;

    fn handle(&mut self, msg: Ping, ctx: &mut Context<Self>) -> Self::Result {
        println!("Ping received");

        Ok(true)
    }
}

fn main() {
    let sys = System::new("example");

    // Start MyActor in current thread
    let addr = MyActor.start();

    // Send Ping message.
    // send() message returns Future object, that resolves to message result
    let result = addr.send(Ping);

    // spawn future to reactor
    Arbiter::spawn(
        result.map(|res| {
            match res {
                Ok(result) => println!("Got result: {}", result),
                Err(err) => println!("Got error: {}", err),
            }
        })
        .map_err(|e| {
            println!("Actor is probably died: {}", e);
        }));

    sys.run();
}
```

## 使用MessageResponse进行响应

让我们看看上面例子中为`impl Handler`定义的`Result`类型。看看我们如何返回`Result <bool，io :: Error>`？我们能够用这种类型响应我们的actor的传入消息，因为它具有为该类型实现的`MessageResponse` trait。这是该 trait的定义：

```rust
pub trait MessageResponse <A：Actor，M：Message> {
    fn handle <R：ResponseChannel <M >>（self，ctx：＆mut A :: Context，tx：Option <R>）;
}
```

有时，使用没有为其实现此 trait的类型响应传入消息是有意义的。当发生这种情况时，我们可以自己实现这一 trait。这是一个例子，我们用`GotPing`回复`Ping`消息，并用`GotPong`回复`Pong`消息。

```rust
use actix::dev::{MessageResponse, ResponseChannel};
use actix::prelude::*;
use futures::Future;

enum Messages {
    Ping,
    Pong,
}

enum Responses {
    GotPing,
    GotPong,
}

impl<A, M> MessageResponse<A, M> for Responses
where
    A: Actor,
    M: Message<Result = Responses>,
{
    fn handle<R: ResponseChannel<M>>(self, _: &mut A::Context, tx: Option<R>) {
        if let Some(tx) = tx {
            tx.send(self);
        }
    }
}

impl Message for Messages {
    type Result = Responses;
}

// Define actor
struct MyActor;

// Provide Actor implementation for our actor
impl Actor for MyActor {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Context<Self>) {
        println!("Actor is alive");
    }

    fn stopped(&mut self, ctx: &mut Context<Self>) {
        println!("Actor is stopped");
    }
}

/// Define handler for `Messages` enum
impl Handler<Messages> for MyActor {
    type Result = Responses;

    fn handle(&mut self, msg: Messages, ctx: &mut Context<Self>) -> Self::Result {
        match msg {
            Messages::Ping => Responses::GotPing,
            Messages::Pong => Responses::GotPong,
        }
    }
}

fn main() {
    let sys = System::new("example");

    // Start MyActor in current thread
    let addr = MyActor.start();

    // Send Ping message.
    // send() message returns Future object, that resolves to message result
    let ping_future = addr.send(Messages::Ping);
    let pong_future = addr.send(Messages::Pong);

    // Spawn pong_future onto event loop
    Arbiter::spawn(
        pong_future
            .map(|res| {
                match res {
                    Responses::GotPing => println!("Ping received"),
                    Responses::GotPong => println!("Pong received"),
                }
            })
            .map_err(|e| {
                println!("Actor is probably died: {}", e);
            }),
    );

    // Spawn ping_future onto event loop
    Arbiter::spawn(
        ping_future
            .map(|res| {
                match res {
                    Responses::GotPing => println!("Ping received"),
                    Responses::GotPong => println!("Pong received"),
                }
            })
            .map_err(|e| {
                println!("Actor is probably died: {}", e);
            }),
    );

    sys.run();
}
```
