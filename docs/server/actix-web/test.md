# 测试
每个应用程序都应该经过充分测 Actix提供了执行单元和集成测试的工具.

## 单元测试

对于单元测试，actix提供了一个请求构建器类型和一个简单的处理程序运行器。 [TestRequest](https://actix.rs/actix-web/actix_web/test/struct.TestRequest.html) 实现类似构建器的模式。您可以`HttpRequest`使用`finish()`或生成实例，也可以使用`run()`或运行处理程序`run_async()`。

```rust
use actix_web::{http, test, HttpRequest, HttpResponse, HttpMessage};

fn index(req: &HttpRequest) -> HttpResponse {
     if let Some(hdr) = req.headers().get(http::header::CONTENT_TYPE) {
        if let Ok(s) = hdr.to_str() {
            return HttpResponse::Ok().into()
        }
     }
     HttpResponse::BadRequest().into()
}

fn main() {
    let resp = test::TestRequest::with_header("content-type", "text/plain")
        .run(index)
        .unwrap();
    assert_eq!(resp.status(), http::StatusCode::OK);

    let resp = test::TestRequest::default()
        .run(index)
        .unwrap();
    assert_eq!(resp.status(), http::StatusCode::BAD_REQUEST);
}
```

# 集成测试

有几种方法可用于测试您的应用程序。Actix提供 `TestServer`，可用于在真实的http服务器中使用特定处理程序运行应用程序。

`TestServer::get()`，`TestServer::post()`和`TestServer::client()` 方法可用于向测试服务器发送请求。

`TestServer`可以将简单表单配置为使用处理程序。 `TestServer::new`方法接受配置函数，此函数的唯一参数是测试应用程序实例。

有关更多信息，请查看[api文档](https://actix.rs/actix-web/actix_web/test/struct.TestApp.html)。

```rust
use actix_web::{HttpRequest, HttpMessage};
use actix_web::test::TestServer;
use std::str;

fn index(req: HttpRequest) -> &'static str {
     "Hello world!"
}

fn main() {
    // start new test server
    let mut srv = TestServer::new(|app| app.handler(index));

    let request = srv.get().finish().unwrap();
    let response = srv.execute(request.send()).unwrap();
    assert!(response.status().is_success());

    let bytes = srv.execute(response.body()).unwrap();
    let body = str::from_utf8(&bytes).unwrap();
    assert_eq!(body, "Hello world!");
}
```

另一种选择是使用应用程序工厂。在这种情况下，您需要以与实际http服务器配置相同的方式传递工厂函数。

```rust
use actix_web::{http, test, App, HttpRequest, HttpResponse};

fn index(req: &HttpRequest) -> HttpResponse {
     HttpResponse::Ok().into()
}

/// This function get called by http server.
fn create_app() -> App {
    App::new()
        .resource("/test", |r| r.h(index))
}

fn main() {
    let mut srv = test::TestServer::with_factory(create_app);

    let request = srv.client(
         http::Method::GET, "/test").finish().unwrap();
    let response = srv.execute(request.send()).unwrap();

    assert!(response.status().is_success());
}
```

如果需要更复杂的应用程序配置，请使用该`TestServer::build_with_state()` 方法。例如，您可能需要初始化应用程序状态或启动`SyncActor` `diesel`进程。此方法接受构造应用程序状态的闭包，并在配置actix系统时运行。因此，您可以初始化任何其他actor。

```rust
#[test]
fn test() {
    let srv = TestServer::build_with_state(|| {
        // we can start diesel actors
        let addr = SyncArbiter::start(3, || {
            DbExecutor(SqliteConnection::establish("test.db").unwrap())
        });
        // then we can construct custom state, or it could be `()`
        MyState{addr: addr}
   })

   // register server handlers and start test server
   .start(|app| {
        app.resource(
            "/{username}/index.html", |r| r.with(
                |p: Path<PParam>| format!("Welcome {}!", p.username)));
    });
    
    // now we can run our test code
);
```


# 流响应测试

如果您需要测试流，将[ClientResponse](https://actix.rs/actix-web/actix_web/client/struct.ClientResponse.html)转换为future并执行它就足够了。例如，测试[Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)。

```rust
extern crate bytes;
extern crate futures;
extern crate actix_web;

use bytes::Bytes;
use futures::stream::poll_fn;
use futures::{Async, Poll, Stream};

use actix_web::{HttpRequest, HttpResponse, Error};
use actix_web::http::{ContentEncoding, StatusCode};
use actix_web::test::TestServer;


fn sse(_req: HttpRequest) -> HttpResponse {
    let mut counter = 5usize;
    // yields `data: N` where N in [5; 1]
    let server_events = poll_fn(move || -> Poll<Option<Bytes>, Error> {
        if counter == 0 {
            return Ok(Async::NotReady);
        }
        let payload = format!("data: {}\n\n", counter);
        counter -= 1;
        Ok(Async::Ready(Some(Bytes::from(payload))))
    });

    HttpResponse::build(StatusCode::OK)
        .content_encoding(ContentEncoding::Identity)
        .content_type("text/event-stream")
        .streaming(server_events)
}


fn main() {
    // start new test server
    let mut srv = TestServer::new(|app| app.handler(sse));

    // request stream
    let request = srv.get().finish().unwrap();
    let response = srv.execute(request.send()).unwrap();
    assert!(response.status().is_success());

    // convert ClientResponse to future, start read body and wait first chunk
    let (bytes, response) = srv.execute(response.into_future()).unwrap();
    assert_eq!(bytes.unwrap(), Bytes::from("data: 5\n\n"));

    // next chunk
    let (bytes, _) = srv.execute(response.into_future()).unwrap();
    assert_eq!(bytes.unwrap(), Bytes::from("data: 4\n\n"));
}
```

# WebSocket服务器测试

它可以注册一个处理程序与`TestApp::handler()`，从而启动一个网络套接字连接。TestServer提供了`ws()`连接到websocket服务器并返回ws `reader`和`writer`对象的方法。TestServer还提供了一种`execute()`方法，该方法将未来的对象运行完成并返回未来计算的结果。

以下示例演示如何测试websocket处理程序：

```rust
use actix_web::*;
use futures::Stream;

struct Ws;   // <- WebSocket actor

impl Actor for Ws {
    type Context = ws::WebsocketContext<Self>;
}

impl StreamHandler<ws::Message, ws::ProtocolError> for Ws {
    fn handle(&mut self, msg: ws::Message, ctx: &mut Self::Context) {
        match msg {
            ws::Message::Text(text) => ctx.text(text),
            _ => (),
        }
    }
}

fn main() {
    let mut srv = test::TestServer::new(
        |app| app.handler(|req| ws::start(req, Ws)));

    let (reader, mut writer) = srv.ws().unwrap();
    writer.text("text");

    let (item, reader) = srv.execute(reader.into_future()).unwrap();
    assert_eq!(item, Some(ws::Message::Text("text".to_owned())));
}
```
