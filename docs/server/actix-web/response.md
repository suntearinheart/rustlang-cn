# 响应
类似构建器的模式用于构造实例`HttpResponse`。 `HttpResponse`提供了几个返回`HttpResponseBuilder`实例的方法，它实现了构建响应的各种便捷方法。

检查[文档](https://actix.rs/actix-web/actix_web/dev/struct.HttpResponseBuilder.html)中的类型说明。

方法`.body`，`.finish`和`.json`最终确定响应创建并返回构造的`HttpResponse`实例。如果多次在同一构建器实例上调用此方法，则构建器将发生混乱。

```rust
use actix_web::{HttpRequest, HttpResponse, http::ContentEncoding};

fn index(req: &HttpRequest) -> HttpResponse {
    HttpResponse::Ok()
        .content_encoding(ContentEncoding::Br)
        .content_type("plain/text")
        .header("X-Hdr", "sample")
        .body("data")
}
```

# 内容编码

Actix自动压缩有效负载。支持以下编解码器：

* Brotli
* Gzip
* Deflate
* Identity

响应有效负载基于content_encoding参数进行压缩。默认情况下，`ContentEncoding::Auto`使用。如果`ContentEncoding::Auto`选择，则压缩取决于请求的`Accept-Encoding`标头。

`ContentEncoding::Identity`可用于禁用压缩。如果选择了其他内容编码，则对该编解码器强制执行压缩。

例如，要启用 `brotli`使用 `ContentEncoding::Br`:

```rust
use actix_web::{HttpRequest, HttpResponse, http::ContentEncoding};

fn index(req: HttpRequest) -> HttpResponse {
    HttpResponse::Ok()
        .content_encoding(ContentEncoding::Br)
        .body("data")
}
```

在这种情况下，我们通过将内容编码设置为一个`Identity`值来显式禁用内容压缩：

```rust
use actix_web::{HttpRequest, HttpResponse, http::ContentEncoding};

fn index(req: HttpRequest) -> HttpResponse {
    HttpResponse::Ok()
        // v- disable compression
        .content_encoding(ContentEncoding::Identity)
        .body("data")
}
```

此外，可以在应用程序级别设置默认内容编码，默认情况下`ContentEncoding::Auto`使用，这意味着自动内容压缩协商。

```rust
use actix_web::{App, HttpRequest, HttpResponse, http::ContentEncoding};

fn index(req: HttpRequest) -> HttpResponse {
    HttpResponse::Ok()
        .body("data")
}

fn main() {
    let app = App::new()
        // v- disable compression for all routes
       .default_encoding(ContentEncoding::Identity)
       .resource("/index.html", |r| r.with(index));
}
```

# JSON响应
该Json类型允许使用格式良好的`JSON`数据进行响应：只返回Json类型的值哪个T是要序列化为JSON的结构的类型。该类型T必须实现serde的`Serialize`特征。

```rust
# extern crate actix_web;
#[macro_use] extern crate serde_derive;
use actix_web::{App, HttpRequest, Json, Result, http::Method};

#[derive(Serialize)]
struct MyObj {
    name: String,
}

fn index(req: &HttpRequest) -> Result<Json<MyObj>> {
    Ok(Json(MyObj{name: req.match_info().query("name")?}))
}

fn main() {
    App::new()
        .resource(r"/a/{name}", |r| r.method(Method::GET).f(index))
        .finish();
}
```

# 分块传输编码

可以启用响应的分块编码`HttpResponseBuilder::chunked()`。这生效仅供`Body::Streaming(BodyStream)`或`Body::StreamingContext`机构。如果启用了响应有效负载压缩并使用了流体，则会自动启用分块编码。

禁止为HTTP / 2.0响应启用分块编码。

```rust
use actix_web::*;
use bytes::Bytes;
use futures::stream::once;

fn index(req: HttpRequest) -> HttpResponse {
    HttpResponse::Ok()
        .chunked()
        .body(Body::Streaming(Box::new(once(Ok(Bytes::from_static(b"data"))))))
}
```
