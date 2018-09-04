# 路由分发

URLDispatch提供了一种`Handler`使用简单模式匹配语言将URL映射到代码的简单方法。如果其中一个模式与请求相关联的路径信息匹配，则调用特定的处理程序对象。

处理程序是一个特定对象，它实现`Handler`在应用程序中定义的特征，该 特征接收请求并返回响应对象。Handler程序部分提供了更多信息 。

## 资源配置

资源配置是向应用程序添加新资源的行为。资源具有名称，该名称充当用于URL生成的标识符。该名称还允许开发人员向现有资源添加路由。资源也有一个模式，用于匹配URL的PATH部分。它不匹配针对QUERY部（方案和端口之后的部分，例如`/foo/bar`在URL `http://localhost:8080/foo/bar?q=value)`.

[*App::route()*](https://actix.rs/actix-web/actix_web/struct.App.html#method.route)方法提供注册路由的简单方法。此方法将单个路由添加到应用程序路由表。此方法接受`path pattern`， `http method`和`handler function`。`route()`对于相同的路径，可以多次调用该方法，在这种情况下，多个路由注册相同的资源路径。

```rust
use actix_web::{http::Method, App, HttpRequest, HttpResponse};

fn index(req: HttpRequest) -> HttpResponse {
    unimplemented!()
}

fn main() {
    App::new()
        .route("/user/{name}", Method::GET, index)
        .route("/user/{name}", Method::POST, index)
        .finish();
}
```

虽然`App :: route（）`提供了注册路由的简单方法，但是为了访问完整的资源配置，必须使用不同的方法。该应用[App::resource()](https://actix.rs/actix-web/actix_web/struct.App.html#method.resource)方法将单个资源应用路由表。此方法接受路径模式 和资源配置功能。

```rust
use actix_web::{http::Method, App, HttpRequest, HttpResponse};

fn index(req: &HttpRequest) -> HttpResponse {
    unimplemented!()
}

fn main() {
    App::new()
        .resource("/prefix", |r| r.f(index))
        .resource("/user/{name}", |r| {
            r.method(Method::GET).f(|req| HttpResponse::Ok())
        })
        .finish();
}
```

该配置函数有以下类型：

```rust
FnOnce(&mut Resource<_>) -> ()
```

该配置函数，可以设置一个名称和登记的具体路线。如果资源不包含任何路由或没有任何匹配的路由，则返回NOT FOUND http响应。

## 配置路由

资源包含一组路由。每个路由依次有一组谓词和一个处理程序。可以使用`Resource::route()`方法创建新路由，该方法返回对新Route实例的引用。默认情况下，路由不包含任何谓词，因此匹配所有请求，默认处理程序为`HttpNotFound`。

应用程序根据在资源注册和路由注册期间定义的路由标准来路由传入请求。资源按照路由注册的顺序匹配它包含的所有路由`Resource::route()`。

一个路径可以包含任意数量的断言，但只有一个处理器。

```rust
use actix_web::{pred, App, HttpResponse};

fn main() {
    App::new()
        .resource("/path", |resource| {
            resource
                .route()
                .filter(pred::Get())
                .filter(pred::Header("content-type", "text/plain"))
                .f(|req| HttpResponse::Ok())
        })
        .finish();
}
```

在此示例中，`HttpResponse::Ok()`为GET请求返回。如果请求包含`Content-Type`标头，则此标头的值为`text / plain`，并且path等于/path，第一个匹配路由的资源调用句柄。

如果资源无法匹配任何路由，则返回“NOT FOUND”响应。

`ResourceHandler :: route（）`返回一个 [Route](https://actix.rs/actix-web/actix_web/dev/struct.Route.html)对象。路径可以使用类似构建器的模式进行配置。以下配置方法可用：

* [*Route::filter()*](https://actix.rs/actix-web/actix_web/dev/struct.Route.html#method.filter)注册一个新的谓词。可以为每个路由注册任意数量的谓词。
  
* [*Route::f()*](https://actix.rs/actix-web/actix_web/dev/struct.Route.html#method.f) r注册此路由的处理函数。只能注册一个处理程序。通常，处理程序注册是最后的配置操作。处理程序函数可以是函数或闭包，具有类型 `Fn(HttpRequest<S>) -> R + 'static`

* [*Route::h()*](https://actix.rs/actix-web/actix_web/dev/struct.Route.html#method.h)注册一个实现Handler特征的处理程序对象。这与f()方法类似- 只能注册一个处理程序。处理程序注册是最后一次配置操作。

* [*Route::a()*](https://actix.rs/actix-web/actix_web/dev/struct.Route.html#method.a) 为此路由注册异步处理函数。只能注册一个处理程序。处理程序注册是最后一次配置操作。处理程序函数可以是函数或闭包，具有类型 `Fn(HttpRequest<S>) -> Future<Item = HttpResponse, Error = Error> + 'static`

## 路由匹配

The main purpose of route configuration is to match (or not match) the request's `path`
against a URL path pattern. `path` represents the path portion of the URL that was requested.

The way that *actix* does this is very simple. When a request enters the system,
for each resource configuration declaration present in the system, actix checks
the request's path against the pattern declared. This checking happens in the order that
the routes were declared via `App::resource()` method. If resource can not be found,
the *default resource* is used as the matched resource.

When a route configuration is declared, it may contain route predicate arguments. All route
predicates associated with a route declaration must be `true` for the route configuration to
be used for a given request during a check. If any predicate in the set of route predicate
arguments provided to a route configuration returns `false` during a check, that route is
skipped and route matching continues through the ordered set of routes.

If any route matches, the route matching process stops and the handler associated with
the route is invoked. If no route matches after all route patterns are exhausted, a *NOT FOUND* response get returned.

## Resource pattern syntax

The syntax of the pattern matching language used by actix in the pattern
argument is straightforward.

The pattern used in route configuration may start with a slash character. If the pattern
does not start with a slash character, an implicit slash will be prepended
to it at matching time. For example, the following patterns are equivalent:

```bash
{foo}/bar/baz
```

and:

```bash
/{foo}/bar/baz
```

A *variable part* (replacement marker) is specified in the form *{identifier}*,
where this means "accept any characters up to the next slash character and use this
as the name in the `HttpRequest.match_info()` object".

A replacement marker in a pattern matches the regular expression `[^{}/]+`.

A match_info is the `Params` object representing the dynamic parts extracted from a
*URL* based on the routing pattern. It is available as *request.match_info*. For example, the
following pattern defines one literal segment (foo) and two replacement markers (baz, and bar):

```bash
foo/{baz}/{bar}
```

The above pattern will match these URLs, generating the following match information:

```bash
foo/1/2        -> Params {'baz':'1', 'bar':'2'}
foo/abc/def    -> Params {'baz':'abc', 'bar':'def'}
```

It will not match the following patterns however:

```bash
foo/1/2/        -> No match (trailing slash)
bar/abc/def     -> First segment literal mismatch
```

The match for a segment replacement marker in a segment will be done only up to
the first non-alphanumeric character in the segment in the pattern. So, for instance,
if this route pattern was used:

```bash
foo/{name}.html
```

The literal path */foo/biz.html* will match the above route pattern, and the match result
will be `Params{'name': 'biz'}`. However, the literal path */foo/biz* will not match,
because it does not contain a literal *.html* at the end of the segment represented
by *{name}.html* (it only contains biz, not biz.html).

To capture both segments, two replacement markers can be used:

```bash
foo/{name}.{ext}
```

The literal path */foo/biz.html* will match the above route pattern, and the match
result will be *Params{'name': 'biz', 'ext': 'html'}*. This occurs because there is a
literal part of *.* (period) between the two replacement markers *{name}* and *{ext}*.

Replacement markers can optionally specify a regular expression which will be used to decide
whether a path segment should match the marker. To specify that a replacement marker should
match only a specific set of characters as defined by a regular expression, you must use a
slightly extended form of replacement marker syntax. Within braces, the replacement marker
name must be followed by a colon, then directly thereafter, the regular expression. The default
regular expression associated with a replacement marker *[^/]+* matches one or more characters
which are not a slash. For example, under the hood, the replacement marker *{foo}* can more
verbosely be spelled as *{foo:[^/]+}*. You can change this to be an arbitrary regular expression
to match an arbitrary sequence of characters, such as *{foo:\d+}* to match only digits.

Segments must contain at least one character in order to match a segment replacement marker.
For example, for the URL */abc/*:

* */abc/{foo}* will not match.
* */{foo}/* will match.

> **Note**: path will be URL-unquoted and decoded into valid unicode string before
> matching pattern and values representing matched path segments will be URL-unquoted too.

So for instance, the following pattern:

```bash
foo/{bar}
```

When matching the following URL:

```bash
http://example.com/foo/La%20Pe%C3%B1a
```

The matchdict will look like so (the value is URL-decoded):

```bash
Params{'bar': 'La Pe\xf1a'}
```

Literal strings in the path segment should represent the decoded value of the
path provided to actix. You don't want to use a URL-encoded value in the pattern.
For example, rather than this:

```bash
/Foo%20Bar/{baz}
```

You'll want to use something like this:

```bash
/Foo Bar/{baz}
```

It is possible to get "tail match". For this purpose custom regex has to be used.

```bash
foo/{bar}/{tail:.*}
```

The above pattern will match these URLs, generating the following match information:

```bash
foo/1/2/           -> Params{'bar':'1', 'tail': '2/'}
foo/abc/def/a/b/c  -> Params{'bar':u'abc', 'tail': 'def/a/b/c'}
```

## Scoping Routes

Scoping helps you organize routes sharing common root paths.  You can nest
scopes within scopes.

Suppose that you want to organize paths to endpoints used to manage a "Project",
consisting of "Tasks".  Such paths may include:

* /project
* /project/{project_id}
* /project/{project_id}/task
* /project/{project_id}/task/{task_id}

A scoped layout of these paths would appear as follows

< include-example example="url-dispatch" file="scope.rs" section="scope" >

A *scoped* path can contain variable path segments as resources. Consistent with
unscoped paths.

You can get variable path segments from `HttpRequest::match_info()`.
`Path` extractor also is able to extract scope level variable segments.

## Match information

All values representing matched path segments are available in
[`HttpRequest::match_info`](https:/actix.rs/actix-web/actix_web/struct.HttpRequest.html#method.match_info).
Specific values can be retrieved with
[`Params::get()`](https:/actix.rs/actix-web/actix_web/dev/struct.Params.html#method.get).

Any matched parameter can be deserialized into a specific type if the type
implements the `FromParam` trait. For example most standard integer types
the trait, i.e.:

< include-example example="url-dispatch" file="minfo.rs" section="minfo" >

For this example for path '/a/1/2/', values v1 and v2 will resolve to "1" and "2".

It is possible to create a `PathBuf` from a tail path parameter. The returned `PathBuf` is
percent-decoded. If a segment is equal to "..", the previous segment (if
any) is skipped.

For security purposes, if a segment meets any of the following conditions,
an `Err` is returned indicating the condition met:

* Decoded segment starts with any of: `.` (except `..`), `*`
* Decoded segment ends with any of: `:`, `>`, `<`
* Decoded segment contains any of: `/`
* On Windows, decoded segment contains any of: '\'
* Percent-encoding results in invalid UTF8.

As a result of these conditions, a `PathBuf` parsed from request path parameter is
safe to interpolate within, or use as a suffix of, a path without additional checks.

< include-example example="url-dispatch" file="pbuf.rs" section="pbuf" >

List of `FromParam` implementations can be found in
[api docs](https:/actix.rs/actix-web/actix_web/dev/trait.FromParam.html#foreign-impls)

## Path information extractor

Actix provides functionality for type safe path information extraction.
[*Path*](https:/actix.rs/actix-web/actix_web/struct.Path.html) extracts information, destination type
could be defined in several different forms. Simplest approach is to use
`tuple` type. Each element in tuple must correpond to one element from
path pattern. i.e. you can match path pattern `/{id}/{username}/` against
`Path<(u32, String)>` type, but `Path<(String, String, String)>` type will
always fail.

< include-example example="url-dispatch" file="path.rs" section="path" >

It also possible to extract path pattern information to a struct. In this case,
this struct must implement *serde's *`Deserialize` trait.

< include-example example="url-dispatch" file="path2.rs" section="path" >

[*Query*](https:/actix.rs/actix-web/actix_web/struct.Query.html) provides similar
functionality for request query parameters.

## Generating resource URLs

Use the [*HttpRequest.url_for()*](https:/actix.rs/actix-web/actix_web/struct.HttpRequest.html#method.url_for)
method to generate URLs based on resource patterns. For example, if you've configured a
resource with the name "foo" and the pattern "{a}/{b}/{c}", you might do this:

< include-example example="url-dispatch" file="urls.rs" section="url" >

This would return something like the string *http://example.com/test/1/2/3* (at least ifthe current protocol and hostname implied http://example.com) `url_for()` method returns [*Url object*](https://docs.rs/url/1.7.0/url/struct.Url.html) so youcan modify this url (add query parameters, anchor, etc).`url_for()` could be called only for *named* resources otherwise error get returned.

## External resources

Resources that are valid URLs, can be registered as external resources. They are useful
for URL generation purposes only and are never considered for matching at request time.

< include-example example="url-dispatch" file="url_ext.rs" section="ext" >

## Path normalization and redirecting to slash-appended routes

By normalizing it means:

* Add a trailing slash to the path.
* Double slashes are replaced by one.

The handler returns as soon as it finds a path that resolves
correctly. The order if all enable is 1) merge, 2) both merge and append
and 3) append. If the path resolves with
at least one of those conditions, it will redirect to the new path.

If *append* is *true*, append slash when needed. If a resource is
defined with trailing slash and the request doesn't have one, it will
be appended automatically.

If *merge* is *true*, merge multiple consecutive slashes in the path into one.

This handler designed to be used as a handler for application's *default resource*.

< include-example example="url-dispatch" file="norm.rs" section="norm" >

In this example `/resource`, `//resource///` will be redirected to `/resource/`.

In this example, the path normalization handler is registered for all methods,
but you should not rely on this mechanism to redirect *POST* requests. The redirect of the
slash-appending *Not Found* will turn a *POST* request into a GET, losing any
*POST* data in the original request.

It is possible to register path normalization only for *GET* requests only:

< include-example example="url-dispatch" file="norm2.rs" section="norm" >

## Using an Application Prefix to Compose Applications

The `App::prefix()` method allows to set a specific application prefix.
This prefix represents a resource prefix that will be prepended to all resource patterns added
by the resource configuration. This can be used to help mount a set of routes at a different
location than the included callable's author intended while still maintaining the same
resource names.

For example:

< include-example example="url-dispatch" file="prefix.rs" section="prefix" >

In the above example, the *show_users* route will have an effective route pattern of
*/users/show* instead of */show* because the application's prefix argument will be prepended
to the pattern. The route will then only match if the URL path is */users/show*,
and when the `HttpRequest.url_for()` function is called with the route name show_users,
it will generate a URL with that same path.

## Custom route predicates

You can think of a predicate as a simple function that accepts a *request* object reference
and returns *true* or *false*. Formally, a predicate is any object that implements the
[`Predicate`](https:/actix.rs/actix-web/actix_web/pred/trait.Predicate.html) trait. Actix provides
several predicates, you can check
[functions section](https://actix.rs/actix-web/actix_web/pred/index.html#functions) of api docs.

Here is a simple predicate that check that a request contains a specific *header*:

< include-example example="url-dispatch" file="pred.rs" section="pred" >

In this example, *index* handler will be called only if request contains *CONTENT-TYPE* header.

Predicates have access to the application's state via `HttpRequest::state()`.
Also predicates can store extra information in
[request extensions](https://actix.rs/actix-web/actix_web/struct.HttpRequest.html#method.extensions).

## Modifying predicate values

You can invert the meaning of any predicate value by wrapping it in a `Not` predicate.
For example, if you want to return "METHOD NOT ALLOWED" response for all methods
except "GET":

< include-example example="url-dispatch" file="pred2.rs" section="pred" >

The `Any` predicate accepts a list of predicates and matches if any of the supplied
predicates match. i.e:

```rust
pred::Any(pred::Get()).or(pred::Post())
```

The `All` predicate accepts a list of predicates and matches if all of the supplied
predicates match. i.e:

```rust
pred::All(pred::Get()).and(pred::Header("content-type", "plain/text"))
```

## Changing the default Not Found response

If the path pattern can not be found in the routing table or a resource can not find matching
route, the default resource is used. The default response is *NOT FOUND*.
It is possible to override the *NOT FOUND* response with `App::default_resource()`.
This method accepts a *configuration function* same as normal resource configuration
with `App::resource()` method.

< include-example example="url-dispatch" file="dhandler.rs" section="default" >
