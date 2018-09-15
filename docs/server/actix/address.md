# Address

Actor通过交换消息进行通信。发送者可以选择等待回应。`actor`不能直接引用，只能通过他们的`Address`引用。

有几种方法可以获得`Actor`的`Address`。 `Actor` trait提供启动`actor`的两个辅助方法。两者都返回已启动`actor`的`Address`。

这是一个`Actors::tart()`方法用法的例子。在这个例子中，`MyActor` `actor`是异步的，并且在与调用者相同的线程中启动。

```rust
extern crate actix;
use actix::prelude::*;
struct MyActor;
impl Actor for MyActor {
    type Context = Context<Self>;
}

fn main() {
System::new("test");
let addr = MyActor.start();
}
```

异步actor可以从`Context`对象获取其地址。Context需要实现`AsyncContext` trait。 `AsyncContext::address()`提供了actor的`addres`。


```rust
extern crate actix;
use actix::prelude::*;
struct MyActor;
impl Actor for MyActor {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Context<Self>) {
       let addr = ctx.address();
    }
}
fn main() {}
```

## Mailbox

所有消息首先转到actor的`mailbox`，然后是`actor`的执行上下文调用特定的消息处理。`mailbox`通常是`bounded`的。容量是特定于上下文实现。对于`Context`类型，容量设置为默认情况下有16条消息，可以增加
[Context:: set_mailbox_capacity()](https://Actix.set_mailbox_capacity)。

## Message

为了能够处理特定消息, `actor`必须提供此消息的`Handler<M>`实现。所有消息都是静态类型的。消息可以以异步方式处理。actor可以产生其他`actor`或添加`future`或 `streams`到执行上下文。 `actor `trait提供了几种方法允许控制actor的生命周期。

要向actor发送消息，需要使用`Addr`对象。 `Addr`提供了几个发送消息的方式。

* `addr::do_send(M)` - 这个方法忽略了`actor`的`mailbox`容量无条件地发送消息到邮箱。此方法不返回消息处理结果，如果`actor`不在，则无声地失败。

* `Addr :: try_send(M)` - 此方法尝试立即发送消息。如果`mailbox`已满或关闭（actor已死），此方法返回一个[SendError](https://Actix.SendError.html)。

* `Addr :: send(M)` - 此消息返回一个解析为future对象的结果,如果消息处理过程返回的`Future`对象被消毁，那么消息被取消。

## Recipient

`Recipient`是`address`的特别版本，仅支持一种类型的`message`。它可以用于需要将消息发送给不同类型的actor的情况。可以使用`Addr :: recipient（）`从`address`创建`recipient`对象。

例如，`recipient`可以用于订阅系统。在以下示例中`ProcessSignals` actor向所有订阅者发送`Signal`消息。订户可以是任何实现`Handler <Signal>` trait 的actor。

```rust
#[macro_use] extern crate actix;
use actix::prelude::*;
#[derive(Message)]
struct Signal(usize);

/// Subscribe to process signals.
#[derive(Message)]
struct Subscribe(pub Recipient<Signal>);

/// Actor that provides signal subscriptions
struct ProcessSignals {
    subscribers: Vec<Recipient<Signal>>,
}

impl Actor for ProcessSignals {
    type Context = Context<Self>;
}

impl ProcessSignals {

    /// Send signal to all subscribers
    fn send_signal(&mut self, sig: usize) {
        for subscr in &self.subscribers {
           subscr.do_send(Signal(sig));
        }
    }
}

/// Subscribe to signals
impl Handler<Subscribe> for ProcessSignals {
    type Result = ();

    fn handle(&mut self, msg: Subscribe, _: &mut Self::Context) {
        self.subscribers.push(msg.0);
    }
}
fn main() {}
```
