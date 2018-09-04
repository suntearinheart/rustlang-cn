# 错误

Actix使用自己的[*actix_web::error::Error*](https://actix.rs/actix-web/actix_web/error/struct.Error.html)类型和 [*actix_web::error::ResponseError*](https://actix.rs/actix-web/actix_web/error/trait.ResponseError.html)特征来处理Web处理程序的错误。

如果处理程序返回一个`Error`（指一般的Rust特征 `std::error::Error`）Result也实现了 `ResponseError`特征，actix会将该错误呈现为HTTP响应。 `ResponseError`有一个名为return的函数`error_response()`返回` HttpResponse`：

```rust
pub trait ResponseError: Fail {
    fn error_response(&self) -> HttpResponse {
        HttpResponse::new(StatusCode::INTERNAL_SERVER_ERROR)
    }
}
```
一个`Responder`强制将兼容`Result`转换的HTTP响应：

```rust
impl<T: Responder, E: Into<Error>> Responder for Result<T, E>
```

`Error`在上面的代码中是actix的错误定义，并且实现的任何错误`ResponseError`都可以自动转换为一个。

Actix-web提供`ResponseError`一些常见的非actix错误的实现。例如，如果处理程序以a响应`io::Error`，则该错误将转换为`HttpInternalServerError`：

```rust
use std::io;

fn index(req: &HttpRequest) -> io::Result<fs::NamedFile> {
    Ok(fs::NamedFile::open("static/index.html")?)
}
```

有关外部实现的完整列表，请参阅actix-web API文档`ResponseError`。

## 自定义错误响应的示例

以下是一个示例实现 `ResponseError`:

```rust
use actix_web::*;

#[derive(Fail, Debug)]
#[fail(display="my error")]
struct MyError {
   name: &'static str
}

// Use default implementation for `error_response()` method
impl error::ResponseError for MyError {}

fn index(req: &HttpRequest) -> Result<&'static str, MyError> {
    Err(MyError{name: "test"})
}
```

`ResponseError` 有一个默认的实现`error_response()`，它将呈现500（内部服务器错误），这就是`index`上面执行处理程序时会发生的事情 。

覆盖`error_response()`以产生更有用的结果：

```rust
#[macro_use] extern crate failure;
use actix_web::{App, HttpRequest, HttpResponse, http, error};

#[derive(Fail, Debug)]
enum MyError {
   #[fail(display="internal error")]
   InternalError,
   #[fail(display="bad request")]
   BadClientData,
   #[fail(display="timeout")]
   Timeout,
}

impl error::ResponseError for MyError {
    fn error_response(&self) -> HttpResponse {
       match *self {
          MyError::InternalError => HttpResponse::new(
              http::StatusCode::INTERNAL_SERVER_ERROR),
          MyError::BadClientData => HttpResponse::new(
              http::StatusCode::BAD_REQUEST),
          MyError::Timeout => HttpResponse::new(
              http::StatusCode::GATEWAY_TIMEOUT),
       }
    }
}

fn index(req: &HttpRequest) -> Result<&'static str, MyError> {
    Err(MyError::BadClientData)
}
```

## Error helpers
Actix提供了一组错误辅助函数，可用于从其他错误生成特定的HTTP错误代码。在这里，我们使用以下方法将`MyError`未实现`ResponseError`特征的转换为400（错误请求） `map_err`：

```rust
# extern crate actix_web;
use actix_web::*;

#[derive(Debug)]
struct MyError {
   name: &'static str
}

fn index(req: &HttpRequest) -> Result<&'static str> {
    let result: Result<&'static str, MyError> = Err(MyError{name: "test"});

    Ok(result.map_err(|e| error::ErrorBadRequest(e.name))?)
}
```

有关可用错误帮助程序的完整列表，请参阅[actix-web error](https://actix.rs/actix-web/actix_web/error/index.html#functions)模块的API文档。

# 与failure的兼容性

Actix-web提供与[failure](https://github.com/rust-lang-nursery/failure)库的自动兼容性，以便将错误派生`fail`自动转换为actix错误。请记住，这些错误将使用默认的500状态代码呈现，除非您还`error_response()`为它们提供自己的实现。

# Error logging

Actix在`WARN`日志级别记录所有错误。如果应用程序的日志级别设置为`DEBUG并RUST_BACKTRACE`启用，则还会记录回溯。这些可以配置环境变量：

```
>> RUST_BACKTRACE=1 RUST_LOG=actix_web=debug cargo run
```

该`Error`类型使用cause的错误回溯（如果可用）。如果基础故障不提供回溯，则构造新的回溯指向转换发生的点（而不是错误的起源）。

# 错误处理的推荐做法

考虑将应用程序产生的错误划分为两大类可能是有用的：那些旨在面向用户的错误和那些不是面向用户的错误。

前者的一个例子是我可能会使用failure来指定一个`UserError` 枚举`ValidationError`以便在用户发送错误输入时返回：

```rust
#[macro_use] extern crate failure;
use actix_web::{HttpResponse, http, error};

#[derive(Fail, Debug)]
enum UserError {
   #[fail(display="Validation error on field: {}", field)]
   ValidationError {
       field: String,
   }
}

impl error::ResponseError for UserError {
    fn error_response(&self) -> HttpResponse {
       match *self {
          UserError::ValidationError { .. } => HttpResponse::new(
              http::StatusCode::BAD_REQUEST),
       }
    }
}
```

这将完全按预期运行，因为定义的错误消息 `display`是用明确的意图写入的，用户可以读取。

但是，发送错误消息对于所有错误都是不可取的 - 在服务器环境中发生许多故障，我们可能希望从用户隐藏这些特定信息。例如，如果数据库出现故障并且客户端库开始产生连接超时错误，或者HTML模板格式不正确以及呈现时出错。在这些情况下，可能最好将错误映射到适合用户使用的一般错误。

这是一个`InternalError` 使用自定义消息将内部错误映射到面向用户的示例：

```rust
#[macro_use] extern crate failure;
use actix_web::{App, HttpRequest, HttpResponse, http, error, fs};

#[derive(Fail, Debug)]
enum UserError {
   #[fail(display="An internal error occurred. Please try again later.")]
   InternalError,
}

impl error::ResponseError for UserError {
    fn error_response(&self) -> HttpResponse {
       match *self {
          UserError::InternalError => HttpResponse::new(
              http::StatusCode::INTERNAL_SERVER_ERROR),
       }
    }
}

fn index(_: &HttpRequest) -> Result<&'static str, UserError> {
    fs::NamedFile::open("static/index.html").map_err(|_e| UserError::InternalError)?;
    Ok("success!")
}
```

通过将错误划分为面向用户和非面向错误的错误，我们可以确保我们不会意外地将用户暴露给他们不应该看到的应用程序内部错误。
