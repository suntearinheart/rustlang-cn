# 中间件

Actix的中间件系统允许我们为请求/响应处理添加其他行为。中间件可以挂接到传入的请求进程，使我们能够修改请求以及暂停请求处理以及早返回响应。

中间件也可以挂钩响应处理。

通常，中间件涉及以下操作:

* 预处理请求
* 后处理响应
* 修改应用程序状态
* 访问外部服务 (redis, logging, sessions)

中间件在每个应用程序中注册，并以与注册相同的顺序执行。通常，中间件是实现[*Middleware trait*](https://actix.rs/actix-web/actix_web/middleware/trait.Middleware.html)的类型 。此特征中的每个方法都有一个默认实现。每个方法都可以立即返回结果或未来的对象。

以下演示使用中间件添加请求和响应标头：

```rust
use http::{header, HttpTryFrom};
use actix_web::{App, HttpRequest, HttpResponse, Result};
use actix_web::middleware::{Middleware, Started, Response};

struct Headers;  // <- Our middleware

/// Middleware implementation, middlewares are generic over application state,
/// so you can access state with `HttpRequest::state()` method.
impl<S> Middleware<S> for Headers {

    /// Method is called when request is ready. It may return
    /// future, which should resolve before next middleware get called.
    fn start(&self, req: &HttpRequest<S>) -> Result<Started> {
        Ok(Started::Done)
    }

    /// Method is called when handler returns response,
    /// but before sending http message to peer.
    fn response(&self, req: &HttpRequest<S>, mut resp: HttpResponse)
        -> Result<Response>
    {
        resp.headers_mut().insert(
            header::HeaderName::try_from("X-VERSION").unwrap(),
            header::HeaderValue::from_static("0.2"));
        Ok(Response::Done(resp))
    }
}

fn main() {
    App::new()
       // Register middleware, this method can be called multiple times
       .middleware(Headers)
       .resource("/", |r| r.f(|_| HttpResponse::Ok()));
}
```

Actix提供了一些有用的中间件，例如日志记录，用户会话等。

# Logging

日志记录作为中间件实现。将日志记录中间件注册为应用程序的第一个中间件是很常见的。必须为每个应用程序注册日志记录中间件。

该`Logger`中间件使用标准箱日志记录信息。您应该为actix_web包启用`logger` 以查看访问日志（[env_logger](https://docs.rs/env_logger/*/env_logger/) 或类似内容）。

## 用法

`Logger使用指定的中间件创建`format`。Logger可以使用`default`方法创建默认值，它使用默认格式：

```rust
    %a %t "%r" %s %b "%{Referer}i" "%{User-Agent}i" %T
```

```rust
extern crate env_logger;
use actix_web::App;
use actix_web::middleware::Logger;

fn main() {
    std::env::set_var("RUST_LOG", "actix_web=info");
    env_logger::init();

    App::new()
       .middleware(Logger::default())
       .middleware(Logger::new("%a %{User-Agent}i"))
       .finish();
}
```

以下是默认日志记录格式的示例：

```
INFO:actix_web::middleware::logger: 127.0.0.1:59934 [02/Dec/2017:00:21:43 -0800] "GET / HTTP/1.1" 302 0 "-" "curl/7.54.0" 0.000397
INFO:actix_web::middleware::logger: 127.0.0.1:59947 [02/Dec/2017:00:22:40 -0800] "GET /index.html HTTP/1.1" 200 0 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:57.0) Gecko/20100101 Firefox/57.0" 0.000646
```

## 格式

 `%%`  百分号

 `%a`  远程IP地址（如果使用反向代理，则为代理的IP地址）

 `%t` 请求开始处理的时间

 `%P`  为请求提供服务的子进程ID

 `%r`  第一行请求

 `%s`  响应状态代码

 `%b`  响应大小（以字节为单位），包括HTTP头

 `%T`  服务请求的时间，以秒为单位，浮动分数为.06f格式

 `%D`  服务请求所花费的时间，以毫秒为单位

 `%{FOO}i`  request.headers['FOO']

 `%{FOO}o`  response.headers['FOO']

 `%{FOO}e`  os.environ['FOO']

## 默认headers

要设置默认响应标头，`DefaultHeaders`可以使用中间件。所述 `DefaultHeaders`中间件不设置标题如果响应头已经包含指定的报头。

```rust
use actix_web::{http, middleware, App, HttpResponse};

fn main() {
    let app = App::new()
        .middleware(
            middleware::DefaultHeaders::new()
                .header("X-Version", "0.2"))
        .resource("/test", |r| {
             r.method(http::Method::GET).f(|req| HttpResponse::Ok());
             r.method(http::Method::HEAD).f(|req| HttpResponse::MethodNotAllowed());
        })
       .finish();
}
```

## User sessions

Actix为会话管理提供通用解决方案。所述 的`sessionStorage`中间件可以与不同的后端类型被用于存储在不同的后端会话数据。

默认情况下，仅实现cookie会话后端。可以添加其他后端实现。

CookieSessionBackend 使用`cookie`作为会话存储。`CookieSessionBackend`创建仅限于存储少于4000字节数据的会话，因为有效负载必须适合单个cookie。如果会话包含超过4000个字节，则会生成内部服务器错误。

Cookie可能具有签名或私有的安全策略。每个都有一个相应的`CookieSessionBackend`构造函数。

一个签署的`cookie`可以被查看但不能由客户端修改。甲私人 `cookie`可既不由客户机观看也不修改。

构造函数将密钥作为参数。这是cookie会话的私钥 - 当此值更改时，所有会话数据都将丢失。

通常，您创建一个 `SessionStorage`中间件并使用特定的后端实现对其进行初始化，例如 `CookieSessionBackend`。要访问会话数据， 必须使用[HttpRequest :: session（）](https://actix.rs/actix-web/actix_web/middleware/session/trait.RequestSession.html#tymethod.session)。此方法返回一个 Session对象，该对象允许我们获取或设置会话数据。

```rust
use actix_web::{server, App, HttpRequest, Result};
use actix_web::middleware::session::{RequestSession, SessionStorage, CookieSessionBackend};

fn index(req: &HttpRequest) -> Result<&'static str> {
    // access session data
    if let Some(count) = req.session().get::<i32>("counter")? {
        println!("SESSION value: {}", count);
        req.session().set("counter", count+1)?;
    } else {
        req.session().set("counter", 1)?;
    }

    Ok("Welcome!")
}

fn main() {
    let sys = actix::System::new("basic-example");
    server::new(
        || App::new().middleware(
           SessionStorage::new(
             CookieSessionBackend::signed(&[0; 32])
                .secure(false)
            )))
        .bind("127.0.0.1:59880").unwrap()
        .start();
    let _ = sys.run();
}
```

# 错误处理

`ErrorHandlers` 中间件允许我们为响应提供自定义处理程序。

您可以使用该`ErrorHandlers::handler()`方法为特定状态代码注册自定义错误处理程序。您可以修改现有响应或创建完全新响应。错误处理程序可以立即返回响应或返回解析为响应的future。

```rust
use actix_web::{
    App, HttpRequest, HttpResponse, Result,
    http, middleware::Response, middleware::ErrorHandlers};

fn render_500<S>(_: &HttpRequest<S>, resp: HttpResponse) -> Result<Response> {
   let mut builder = resp.into_builder();
   builder.header(http::header::CONTENT_TYPE, "application/json");
   Ok(Response::Done(builder.into()))
}

fn main() {
    let app = App::new()
        .middleware(
            ErrorHandlers::new()
                .handler(http::StatusCode::INTERNAL_SERVER_ERROR, render_500))
        .resource("/test", |r| {
             r.method(http::Method::GET).f(|_| HttpResponse::Ok());
             r.method(http::Method::HEAD).f(|_| HttpResponse::MethodNotAllowed());
        })
        .finish();
}
```
