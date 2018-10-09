# Handler

请求处理程序可以是实现[*Handler*](https://docs.rs/actix-web/o.7/actix_web/dev/trait.Handler.html)trait的任何对象 。

请求处理分两个阶段进行。首先调用handler对象，返回实现[*Responder*](https://docs.rs/actix-web/o.7/actix_web/trait.Responder.html)特征的任何对象 。然后，`respond_to()`在返回的对象上调用，将自身转换为`AsyncResult`或`Error`.

默认情况下Actix提供对于一些标准类型的`Responder`实现，诸如&`&'static str`，`String`等

有关实现的完整列表，请查看 [*Responder*](https://actix.rs/actix-web/actix_web/trait.Responder.html#foreign-impls)文档。

有效Handler程序的示例：

```rust
fn index(req: HttpRequest) -> &'static str {
    "Hello world!"
}
```

```rust
fn index(req: HttpRequest) -> String {
    "Hello world!".to_owned()
}
```

如果涉及更复杂的类型，您还可以更改签名返回`impl Responder`。

```rust
fn index(req: HttpRequest) -> impl Responder {
    Bytes::from_static("Hello world!")
}
```

```rust,ignore
fn index(req: HttpRequest) -> Box<Future<Item=HttpResponse, Error=Error>> {
    ...
}
```
*Handler*特征是通用的通过S，它定义了应用程序状态的类型。可以使用该HttpRequest::state()方法从Handler访问应用程序状态; 但是，可以将状态作为只读引用进行访问。如果您需要对状态进行可变访问，则必须实现它。

注意：或者，Handler可以可变地访问其自己的状态，因为该handle方法对self进行了可变引用。请注意，actix会创建应用程序状态和处理程序的多个副本，这些副本对于每个线程都是唯一的。如果在多个线程中运行应用程序，actix将创建与应用程序状态对象和处理程序对象的线程数相同的数量。

以下是存储已处理请求数的处理程序示例：

```rust
use actix_web::{App, HttpRequest, HttpResponse, dev::Handler};

struct MyHandler(usize);

impl<S> Handler<S> for MyHandler {
    type Result = HttpResponse;

    /// Handle request
    fn handle(&mut self, req: HttpRequest<S>) -> Self::Result {
        self.0 += 1;
        HttpResponse::Ok().into()
    }
}
```

尽管此处理程序将起作用，但self.0根据线程数和每个线程处理的请求数将有所不同。一个适当的实现将使用`Arc`和`AtomicUsize`。
```rust
use actix_web::{server, App, HttpRequest, HttpResponse, dev::Handler};
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering};

struct MyHandler(Arc<AtomicUsize>);

impl<S> Handler<S> for MyHandler {
    type Result = HttpResponse;

    /// Handle request
    fn handle(&mut self, req: HttpRequest<S>) -> Self::Result {
        self.0.fetch_add(1, Ordering::Relaxed);
        HttpResponse::Ok().into()
    }
}

fn main() {
    let sys = actix::System::new("example");

    let inc = Arc::new(AtomicUsize::new(0));

    server::new(
        move || {
            let cloned = inc.clone();
            App::new()
                .resource("/", move |r| r.h(MyHandler(cloned)))
        })
        .bind("127.0.0.1:8088").unwrap()
        .start();

    println!("Started http server: 127.0.0.1:8088");
    let _ = sys.run();
}
```

小心使用`Mutex`或等同步原语`RwLock`。该`actix-web`框架异步处理请求。通过阻止线程执行，所有并发请求处理进程都将阻塞。如果需要从多个线程共享或更新某些状态，请考虑使用actix actor系统。

## 自定义响应类型
要直接从处理函数返回自定义类型，该类型需要实现`Responder`特征。

让我们为序列化为响应的自定义类型创建`application/json`响应：


```rust
# extern crate actix;
# extern crate actix_web;
extern crate serde;
extern crate serde_json;
#[macro_use] extern crate serde_derive;
use actix_web::{server, App, HttpRequest, HttpResponse, Error, Responder, http};

#[derive(Serialize)]
struct MyObj {
    name: &'static str,
}

/// Responder
impl Responder for MyObj {
    type Item = HttpResponse;
    type Error = Error;

    fn respond_to<S>(self, req: &HttpRequest<S>) -> Result<HttpResponse, Error> {
        let body = serde_json::to_string(&self)?;

        // Create response and set content type
        Ok(HttpResponse::Ok()
            .content_type("application/json")
            .body(body))
    }
}

fn index(req: HttpRequest) -> impl Responder {
    MyObj { name: "user" }
}

fn main() {
    let sys = actix::System::new("example");

    server::new(
        || App::new()
            .resource("/", |r| r.method(http::Method::GET).f(index)))
        .bind("127.0.0.1:8088").unwrap()
        .start();

    println!("Started http server: 127.0.0.1:8088");
    let _ = sys.run();
}
```

## Async handlers
## 异步handlers
有两种不同类型的异步处理程序。响应对象可以异步生成，也可以更精确地生成任何实现[*Responder*](https://actix.rs/actix-web/actix_web/trait.Responder.html)trait的类型。

在这种情况下，handler程序必须返回一个Future解析为Responder类型的对象，即：

```rust
use actix_web::*;
use bytes::Bytes;
use futures::stream::once;
use futures::future::{Future, result};

fn index(req: &HttpRequest) -> Box<Future<Item=HttpResponse, Error=Error>> {

    result(Ok(HttpResponse::Ok()
              .content_type("text/html")
              .body(format!("Hello!"))))
           .responder()
}

fn index2(req: &HttpRequest) -> Box<Future<Item=&'static str, Error=Error>> {
    result(Ok("Welcome!"))
        .responder()
}

fn main() {
    App::new()
        .resource("/async", |r| r.route().a(index))
        .resource("/", |r| r.route().a(index2))
        .finish();
}
```

或者可以异步生成响应主体。在这种情况下，body必须实现流特征`Stream<Item=Bytes, Error=Error>`，即：

```rust
use actix_web::*;
use bytes::Bytes;
use futures::stream::once;

fn index(req: &HttpRequest) -> HttpResponse {
    let body = once(Ok(Bytes::from_static(b"test")));

    HttpResponse::Ok()
       .content_type("application/json")
       .body(Body::Streaming(Box::new(body)))
}

fn main() {
    App::new()
        .resource("/async", |r| r.f(index))
        .finish();
}
```

两种方法都可以组合使用。（即与流体的异步响应）

这是可能的返回`Result`，其中`Result::Item`类型可以是`Future`。在此示例中，`index`处理程序可以立即返回错误或返回解析为a的future `HttpResponse`。

```rust
use actix_web::*;
use bytes::Bytes;
use futures::stream::once;
use futures::future::{Future, result};

fn index(req: &HttpRequest) -> Result<Box<Future<Item=HttpResponse, Error=Error>>, Error> {
    if is_error() {
       Err(error::ErrorBadRequest("bad request"))
    } else {
       Ok(Box::new(
           result(Ok(HttpResponse::Ok()
                  .content_type("text/html")
                  .body(format!("Hello!"))))))
    }
}
```

## 不同的返回类型(Either)

有时，您需要返回不同类型的响应。例如，您可以进行错误检查并返回错误，返回异步响应或任何需要两种不同类型的结果。

对于这种情况，可以使用[*Either*](https://actix.rs/actix-web/actix_web/enum.Either.html)类型。 `Either`允许将两种不同的响应者类型组合成一种类型。

```rust
use futures::future::{Future, result};
use actix_web::{Either, Error, HttpResponse};

type RegisterResult = Either<HttpResponse, Box<Future<Item=HttpResponse, Error=Error>>>;

fn index(req: &HttpRequest) -> impl Responder {
    if is_a_variant() { // <- choose variant A
        Either::A(
            HttpResponse::BadRequest().body("Bad data"))
    } else {
        Either::B(      // <- variant B
            result(Ok(HttpResponse::Ok()
                   .content_type("text/html")
                   .body(format!("Hello!")))).responder())
    }
}
```
