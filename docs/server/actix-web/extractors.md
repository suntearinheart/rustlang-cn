# 提取器

### 类型安全的信息提取

Actix提供类型安全请求信息提取功能。默认情况下，actix提供了几个提取器实现。

### 访问提取器

如何访问Extractor取决于您使用的是处理函数还是自定义Handler类型。

## 在Handler函数内  

提取器可以被传递到一个处理函数作为函数参数 或通过调用`ExtractorType::<…>::extract(req)`功能的功能范围内访问。
```rust
// Option 1:  passed as a parameter to a handler function
fn index((params, info): (Path<(String, String,)>, Json<MyInfo>)) -> HttpResponse {
   ... 
}


// Option 2:  accessed by calling extract() on the Extractor

use actix_web::FromRequest;

fn index(req: &HttpRequest) -> HttpResponse {
	let params = Path::<(String, String)>::extract(req);
	let info = Json::<MyInfo>::extract(req); 

	...
}
```

## 在自定义Handler类型中  

与Handler函数一样，自定义Handler类型可以通过调用`ExtractorType :: <...> :: extract（＆req）`函数来访问 `Extractor`。无法将Extractor 作为参数传递给自定义Handler类型，因为自定义Handler类型必须遵循handle实现的`Handler`trait指定的函数签名。

```rust

struct MyHandler(String);

impl<S> Handler<S> for MyHandler {
    type Result = HttpResponse;

    /// Handle request
    fn handle(&self, req: &HttpRequest<S>) -> Self::Result {
		let params = Path::<(String, String)>::extract(req);
		let info = Json::<MyInfo>::extract(req); 

		...
			
        HttpResponse::Ok().into()
    }
}

```

## Path

[*Path*](https://actix.rs/actix-web/actix_web/struct.Path.html)提供可从Request的路径中提取的信息。您可以从路径反序列化任何变量段。

例如，对于为`/users/{userid}/{friend}`路径注册的资源，可以对两个段进行反序列化，userid以及friend。这些片段可以被提取到一个`tuple`，即`Path<(u32, String)>`或任何`Deserialize`从`serde` crate 实现trait的结构中。

```rust
use actix_web::{App, Path, Result, http};

/// extract path info from "/users/{userid}/{friend}" url
/// {userid} -  - deserializes to a u32
/// {friend} - deserializes to a String
fn index(info: Path<(u32, String)>) -> Result<String> {
    Ok(format!("Welcome {}! {}", info.1, info.0))
}

fn main() {
    let app = App::new().resource(
        "/users/{userid}/{friend}",                    // <- define path parameters
        |r| r.method(http::Method::GET).with(index));  // <- use `with` extractor
}
```

记得！必须使用[*Route::with()*](https://actix.rs/actix-web/actix_web/dev/struct.Route.html#method.with) 方法注册使用提取器的处理函数 。

还可以将路径信息提取到`Deserialize`从serde实现特征的特定类型。这是一个使用serde 而不是元组类型的等效示例。

```rust
#[macro_use] extern crate serde_derive;
use actix_web::{App, Path, Result, http};

#[derive(Deserialize)]
struct Info {
    userid: u32,
    friend: String,
}

/// extract path info using serde
fn index(info: Path<Info>) -> Result<String> {
     Ok(format!("Welcome {}!", info.friend))
}

fn main() {
    let app = App::new().resource(
       "/users/{userid}/{friend}",                    // <- define path parameters
       |r| r.method(http::Method::GET).with(index));  // <- use `with` extractor
}
```

## Query

可以使用请求的查询完成相同的操作。的查询 类型提供提取功能。在它下面使用`serde_urlencoded`箱子。

```rust
#[macro_use] extern crate serde_derive;
use actix_web::{App, Query, http};

#[derive(Deserialize)]
struct Info {
    username: String,
}

// this handler get called only if the request's query contains `username` field
fn index(info: Query<Info>) -> String {
    format!("Welcome {}!", info.username)
}

fn main() {
    let app = App::new().resource(
       "/index.html",
       |r| r.method(http::Method::GET).with(index)); // <- use `with` extractor
}
```

## Json

[*Json*](https://actix.rs/actix-web/actix_web/struct.Json.html) Json允许将请求主体反序列化为结构。要从请求的正文中提取类型信息，该类型`T`必须实现 serde的`Deserialize`trait。

```rust
#[macro_use] extern crate serde_derive;
use actix_web::{App, Json, Result, http};

#[derive(Deserialize)]
struct Info {
    username: String,
}

/// deserialize `Info` from request's body
fn index(info: Json<Info>) -> Result<String> {
    Ok(format!("Welcome {}!", info.username))
}

fn main() {
    let app = App::new().resource(
       "/index.html",
       |r| r.method(http::Method::POST).with(index));  // <- use `with` extractor
}
```

一些提取器提供了一种配置提取过程的方法。Json提取器 [*JsonConfig*](https://actix.rs/actix-web/actix_web/dev/struct.JsonConfig.html)类型用于配置。使用时注册处理程序时`Route::with()`，它将返回配置实例。在Json提取器的情况下，它返回一个`JsonConfig`。您可以配置json有效内容的最大大小以及自定义错误处理函数。

以下示例将有效负载的大小限制为4kb，并使用自定义错误处理程序。

```rust
#[macro_use] extern crate serde_derive;
use actix_web::{App, Json, HttpResponse, Result, http, error};

#[derive(Deserialize)]
struct Info {
    username: String,
}

/// deserialize `Info` from request's body, max payload size is 4kb
fn index(info: Json<Info>) -> Result<String> {
    Ok(format!("Welcome {}!", info.username))
}

fn main() {
    let app = App::new().resource(
       "/index.html", |r| {
           r.method(http::Method::POST)
              .with_config(index, |cfg| {
                  cfg.limit(4096)   // <- change json extractor configuration
                  cfg.error_handler(|err, req| {  // <- create custom error response
                      error::InternalError::from_response(
                         err, HttpResponse::Conflict().finish()).into()
              })
           });
       });
}
```

## Form

目前只支持url编码的表单。可以将URL编码的主体提取为特定类型。此类型必须实现`serde` crate中的`Deserialize`特征。

[*FormConfig*](https://actix.rs/actix-web/actix_web/dev/struct.FormConfig.html)允许配置提取过程。

```rust
#[macro_use] extern crate serde_derive;
use actix_web::{App, Form, Result};

#[derive(Deserialize)]
struct FormData {
    username: String,
}

/// extract form data using serde
/// this handler gets called only if the content type is *x-www-form-urlencoded*
/// and the content of the request could be deserialized to a `FormData` struct
fn index(form: Form<FormData>) -> Result<String> {
     Ok(format!("Welcome {}!", form.username))
}
# fn main() {}
```

## 多提取器

Actix为元素实现的tuples（最多10个元素）提供了提取器实现`FromRequest`。

例如，我们可以同时使用路径提取器和查询提取器。

```rust
#[macro_use] extern crate serde_derive;
use actix_web::{App, Query, Path, http};

#[derive(Deserialize)]
struct Info {
    username: String,
}

fn index((path, query): (Path<(u32, String)>, Query<Info>)) -> String {
    format!("Welcome {}!", query.username)
}

fn main() {
    let app = App::new().resource(
       "/users/{userid}/{friend}",                    // <- define path parameters
       |r| r.method(http::Method::GET).with(index)); // <- use `with` extractor
}
```

## 其他

Actix还提供了其他几种提取器：

* [*State*](https://actix.rs/actix-web/actix_web/struct.State.html) - 如果需要访问应用程序状态。类似 `HttpRequest::state()`.

* *HttpRequest* - *HttpRequest* 本身是一个提取器，它返回self，以防您需要访问请求。

* *String* - 您可以将请求的有效负载转换为*String*.[*Example*](https://actix.rs/actix-web/actix_web/trait.FromRequest.html#example-1)在doc字符串中可用。

* *bytes::Bytes* - 您可以将请求的有效负载转换为字节: *Bytes*.[*Example*](https://actix.rs/actix-web/actix_web/trait.FromRequest.html#example)
