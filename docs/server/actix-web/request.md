# 请求

Actix自动解压缩有效负载。支持以下编解码器：

* Brotli
* Gzip
* Deflate
* Identity

如果请求标头包含`Content-Encoding`标头，则根据标头值解压缩请求有效负载。不支持多个编解码器，即：`Content-Encoding: br, gzip`。

# JSON请求
json正文反序列化有几种选择。

第一种选择是使用`Json`提取器。首先，定义一个`Json<T>`作为参数接受的处理函数，然后使用该`.with()`方法注册此处理程序。通过使用`serde_json::Value`作为类型，也可以接受任意有效的`json`对象`T`。

```rust
#[macro_use] extern crate serde_derive;
use actix_web::{App, Json, Result, http};

#[derive(Deserialize)]
struct Info {
    username: String,
}

/// extract `Info` using serde
fn index(info: Json<Info>) -> Result<String> {
    Ok(format!("Welcome {}!", info.username))
}

fn main() {
    let app = App::new().resource(
       "/index.html",
       |r| r.method(http::Method::POST).with(index));  // <- use `with` extractor
}
```

另一种选择是使用 *HttpRequest::json()*。此方法返回一个[*JsonBody*](https://actix.rs/actix-web/actix_web/dev/struct.JsonBody.html)对象，该对象解析为反序列化的值。

```rust
#[derive(Debug, Serialize, Deserialize)]
struct MyObj {
    name: String,
    number: i32,
}

fn index(req: &HttpRequest) -> Box<Future<Item=HttpResponse, Error=Error>> {
    req.json().from_err()
        .and_then(|val: MyObj| {
            println!("model: {:?}", val);
            Ok(HttpResponse::Ok().json(val))  // <- send response
        })
        .responder()
}
```

您也可以手动将有效负载加载到内存中，然后对其进行反序列化。

在下面的示例中，我们将反序列化`MyObj`结构。我们需要先加载请求体，然后将json反序列化为一个对象。



```rust
extern crate serde_json;
use futures::{Future, Stream};

#[derive(Serialize, Deserialize)]
struct MyObj {name: String, number: i32}

fn index(req: &HttpRequest) -> Box<Future<Item=HttpResponse, Error=Error>> {
   // `concat2` will asynchronously read each chunk of the request body and
   // return a single, concatenated, chunk
   req.concat2()
      // `Future::from_err` acts like `?` in that it coerces the error type from
      // the future into the final error type
      .from_err()
      // `Future::and_then` can be used to merge an asynchronous workflow with a
      // synchronous workflow
      .and_then(|body| {
          let obj = serde_json::from_slice::<MyObj>(&body)?;
          Ok(HttpResponse::Ok().json(obj))
      })
      .responder()
}
```
[示例目录](https://github.com/actix/examples/tree/master/json/)中提供了这两个选项的完整示例 。

# 分块传输编码

Actix自动解码分块编码。`HttpRequest::payload()`已经包含解码的字节流。如果使用所支持的压缩编解码器之一（br，gzip，deflate）压缩请求有效负载，则解压缩字节流。

# Multipart 

Actix提供multipart stream支持。 [*Multipart*](https://actix.rs/actix-web/actix_web/multipart/struct.Multipart.html)实现为`multipart items`。`Each item`可以是 `Field`或嵌套的 `Multipart流`。`HttpResponse::multipart()`返回当前请求的Multipart流。

下面演示了一个简单表单的Multipart流处理：

```rust
use actix_web::*;

fn index(req: &HttpRequest) -> Box<Future<...>> {
    // get multipart and iterate over multipart items
    req.multipart()
       .and_then(|item| {
           match item {
              multipart::MultipartItem::Field(field) => {
                 println!("==== FIELD ==== {:?} {:?}",
                          field.headers(),
                          field.content_type());
                 Either::A(
                   field.map(|chunk| {
                        println!("-- CHUNK: \n{}",
                                 std::str::from_utf8(&chunk).unwrap());})
                      .fold((), |_, _| result(Ok(()))))
                },
              multipart::MultipartItem::Nested(mp) => {
                 Either::B(result(Ok(())))
              }
         }
   })
}
```
[示例目录](https://github.com/actix/examples/tree/master/multipart/)中提供了完整示例 。

# Urlencoded

Actix为`application / x-www-form-urlencoded`编码体提供支持。 `HttpResponse::urlencoded()`返回[*UrlEncoded*](https://actix.rs/actix-web/actix_web/dev/struct.UrlEncoded.html) future，它将解析为反序列化的实例。实例的类型必须实现serde的 `Deserialize`特征。

在几种情况下，`UrlEncoded`的future可以解决为错误：

* 内容类型不是 `application/x-www-form-urlencoded`
* 传输编码是 `chunked`.
* content-length大于256k
* payload以错误终止。

```rust
#[macro_use] extern crate serde_derive;
use actix_web::*;
use futures::future::{Future, ok};

#[derive(Deserialize)]
struct FormData {
    username: String,
}

fn index(req: &HttpRequest) -> Box<Future<Item=HttpResponse, Error=Error>> {
    req.urlencoded::<FormData>() // <- get UrlEncoded future
       .from_err()
       .and_then(|data| {        // <- deserialized instance
             println!("USERNAME: {:?}", data.username);
             ok(HttpResponse::Ok().into())
       })
       .responder()
}
# fn main() {}
```

# Streaming 请求

*HttpRequest* 是一个`Bytes`对象流。它可用于读取请求主体有效负载。

在下面的示例中，我们按块读取并打印请求有效负载块：

```rust
use actix_web::*;
use futures::{Future, Stream};


fn index(req: &HttpRequest) -> Box<Future<Item=HttpResponse, Error=Error>> {
    req
       .payload()
       .from_err()
       .fold((), |_, chunk| {
            println!("Chunk: {:?}", chunk);
            result::<_, error::PayloadError>(Ok(()))
        })
       .map(|_| HttpResponse::Ok().finish())
       .responder()
}
```
