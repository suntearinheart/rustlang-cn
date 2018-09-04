# 开始

对于本指南，我们将逐步介绍CRUD的每个部分的简单示例，它代表“创建读取更新删除”。 本指南中的每个步骤都将基于之前的步骤，并且意味着要遵循。

`本指南假设您使用的是PostgreSQL`。 在开始之前，请确保已安装并运行PostgreSQL。

> Diesel需要Rust 1.24或更高版本。 如果您按照本指南进行操作，请确保通过运行rustup update stable来至少使用该版本的Rust。

我们需要做的第一件事是生成我们的项目。

```rust
cargo new --lib diesel_demo
cd diesel_demo
```

首先，让我们将Diesel添加到我们的依赖项中。 我们还将使用一个名为.env的工具来管理我们的环境变量。 我们也将它添加到我们的依赖项中。

```toml
[dependencies]
diesel = { version = "1.0.0", features = ["postgres"] }
dotenv = "0.9.0"
```

Diesel提供了一个单独的CLI工具来帮助管理您的项目。 由于它是独立的二进制文件，并且不会直接影响项目的代码，因此我们不会将其添加到`Cargo.toml`中。 相反，我们只是将它安装在我们的系统上。

```rust
cargo install diesel_cli
```
如果您遇到如下错误：
```bash
note: ld: library not found for -lmysqlclient
clang: error: linker command failed with exit code 1 (use -v to see invocation)
```

这意味着您缺少数据库后端所需的客户端库 - 在本例中为`mysqlclient`。 您可以通过安装库（使用通常的方法执行此操作，具体取决于您的操作系统）或指定要安装CLI工具的后端来解决此问题。

例如，如果您只安装了PostgreSQL，则可以使用它来安装只有PostgreSQL的`diesel_cli`：

```rust
cargo install diesel_cli --no-default-features --features postgres
```

我们需要告诉Diesel在哪里找到我们的数据库。 我们通过设置 `DATABASE_URL`环境变量来完成此操作。 在我们的开发机器上，我们可能会有多个项目，我们不想污染我们的环境。 我们可以将url放在`.env`文件中。

```bash
echo DATABASE_URL=postgres://username:password@localhost/diesel_demo > .env
```

现在，Diesel CLI可以为我们设置一切。

```rust
diesel setup
```

这将创建我们的数据库（如果它尚不存在），并创建一个空的迁移目录，我们可以使用它来管理我们的模式（稍后将详细介绍）。

现在我们将编写一个允许我们管理博客的小型CLI（忽略我们只能通过此CLI访问数据库的事实......）。 我们需要的第一件事是存储帖子的表格。 让我们为此创建一个迁移：

```rust
diesel migration generate create_posts
```

Diesel CLI将在所需结构中为我们创建两个空文件。 你会看到看起来像这样的输出：

```bash
Creating migrations/20160815133237_create_posts/up.sql
Creating migrations/20160815133237_create_posts/down.sql
```

迁移允许我们随着时间的推移发展数据库模式。 可以应用每个迁移（up.sql）或还原（down.sql）。 应用并立即恢复迁移应保持数据库模式不变。

接下来，我们将编写用于迁移的SQL：

up.sql
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  body TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT 'f'
)
```

down.sql
```sql
DROP TABLE posts
```

我们可以应用新的迁移：
```rust
diesel migration run
```

确保`down.sql`是正确的，这是一个好主意。 您可以通过重做迁移来快速确认您的`down.sql`正确回滚迁移：

```rust
diesel migration redo
```

> 由于迁移是使用原始SQL编写的，因此它们可以包含您使用的数据库系统的特定功能。 例如，上面的CREATE TABLE语句使用PostgreSQL的SERIAL类型。 如果您想使用SQLite，则需要使用INTEGER。

好的，让我们写一些Rust。 我们首先编写一些代码来显示最近发布的五篇帖子。 我们需要做的第一件事是建立数据库连接。

`src/lib.rs`
```rust
#[macro_use]
extern crate diesel;
extern crate dotenv;

use diesel::prelude::*;
use diesel::pg::PgConnection;
use dotenv::dotenv;
use std::env;

pub fn establish_connection() -> PgConnection {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    PgConnection::establish(&database_url)
        .expect(&format!("Error connecting to {}", database_url))
}
```

我们还想创建一个`Post`结构，我们可以在其中读取我们的数据，并使diesel生成我们将用于在查询中引用表和列的名称。

我们将以下行添加到src / lib.rs的顶部：

`src/lib.rs`

```rust
pub mod schema;
pub mod models;
```

接下来我们需要创建我们刚刚声明的两个模块。

`src/models.rs`

```rust
#[derive(Queryable)]
pub struct Post {
    pub id: i32,
    pub title: String,
    pub body: String,
    pub published: bool,
}
```

`＃[derive（Queryable）]`将生成从SQL查询加载Post结构所需的所有代码。

通常，模式模块不是手动创建的，而是由Diesel生成的。 当我们运行diesel设置时，创建了一个名为`diesel.toml`的文件，它告诉`Diesel`为我们维护`src / schema.rs`文件。 该文件应如下所示：

`src/schema.rs`

```
table! {
    posts (id) {
        id -> Integer,
        title -> Text,
        body -> Text,
        published -> Bool,
    }
}
```

确切的输出可能会略有不同，具体取决于您的数据库，但它应该是等效的。

`The table! macro` 根据数据库模式创建一堆代码来表示所有表和列。 我们将在下一个示例中看到如何使用它。

每当我们运行或恢复迁移时，此文件都将自动更新。

让我们编写代码来实际向我们展示我们的帖子。

`src/bin/show_posts.rs`

```rust
extern crate diesel_demo;
extern crate diesel;

use self::diesel_demo::*;
use self::models::*;
use self::diesel::prelude::*;

fn main() {
    use diesel_demo::schema::posts::dsl::*;

    let connection = establish_connection();
    let results = posts.filter(published.eq(true))
        .limit(5)
        .load::<Post>(&connection)
        .expect("Error loading posts");

    println!("Displaying {} posts", results.len());
    for post in results {
        println!("{}", post.title);
        println!("----------\n");
        println!("{}", post.body);
    }
}
```

`use posts :: dsl :: *` 导入一堆别名，以便我们可以说post而不是`posts :: table`，并且`published`而不是`posts :: published`。 当我们只处理单个表时它很有用，但这并不总是我们想要的。

我们可以用`货运--bin show_posts`运行我们的脚本。 不幸的是，结果不会非常有趣，因为我们实际上在数据库中没有任何帖子。 尽管如此，我们已经编写了相当数量的代码，所以让我们提交。

此处可以找到演示的[完整代码](https://github.com/diesel-rs/diesel/tree/v1.3.0/examples/postgres/getting_started_step_1/)。

接下来，让我们编写一些代码来创建一个新帖子。 我们需要一个结构来用于插入新记录。

`src/models.rs`

```rust
use super::schema::posts;

#[derive(Insertable)]
#[table_name="posts"]
pub struct NewPost<'a> {
    pub title: &'a str,
    pub body: &'a str,
}
```

现在让我们添加一个保存新帖子的功能。

`src/lib.rs`

```rust
use self::models::{Post, NewPost};

pub fn create_post<'a>(conn: &PgConnection, title: &'a str, body: &'a str) -> Post {
    use schema::posts;

    let new_post = NewPost {
        title: title,
        body: body,
    };

    diesel::insert_into(posts::table)
        .values(&new_post)
        .get_result(conn)
        .expect("Error saving new post")
}
```


当我们在插入或更新语句上调用`.get_result`时，它会自动将`RETURNING *`添加到查询的末尾，并允许我们将其加载到为正确类型实现`Queryable`的任何结构中。 整齐！

Diesel可以在单个查询中插入多个记录。 只需传递一个`Vec`或切片进行插入，然后调用`get_results`而不是`get_result`。 如果您实际上不想对刚刚插入的行执行任何操作，请调用`.execute`。 编译器不会以这种方式向你抱怨。:)

现在我们已经完成了所有设置，我们可以创建一个小脚本来编写新帖子。

`src/bin/write_post.rs`

```rust
extern crate diesel_demo;
extern crate diesel;

use self::diesel_demo::*;
use std::io::{stdin, Read};

fn main() {
    let connection = establish_connection();

    println!("What would you like your title to be?");
    let mut title = String::new();
    stdin().read_line(&mut title).unwrap();
    let title = &title[..(title.len() - 1)]; // Drop the newline character
    println!("\nOk! Let's write {} (Press {} when finished)\n", title, EOF);
    let mut body = String::new();
    stdin().read_to_string(&mut body).unwrap();

    let post = create_post(&connection, title, &body);
    println!("\nSaved draft {} with id {}", title, post.id);
}

#[cfg(not(windows))]
const EOF: &'static str = "CTRL+D";

#[cfg(windows)]
const EOF: &'static str = "CTRL+Z";
```

我们可以使用`cargo --bin write_post`运行我们的新脚本。 来吧写一篇博文。 发挥创意！ 这是我的：

```bash
Compiling diesel_demo v0.1.0 (file:///Users/sean/Documents/Projects/open-source/diesel_demo)
     Running `target/debug/write_post`

What would you like your title to be?
Diesel demo

Ok! Let's write Diesel demo (Press CTRL+D when finished)

You know, a CLI application probably isn't the best interface for a blog demo.
But really I just wanted a semi-simple example, where I could focus on Diesel.
I didn't want to get bogged down in some web framework here.
Plus I don't really like the Rust web frameworks out there. We might make a
new one, soon.

Saved draft Diesel demo with id 1
```

不幸的是，运行`show_posts`仍然不会显示我们的新帖子，因为我们将其保存为草稿。 如果我们回顾一下`show_posts`中的代码，我们添加了`.filter（published.eq（true））`，我们在迁移中将默认值`published`为false。 我们需要发布它！ 但为了做到这一点，我们需要了解如何更新现有记录。 首先，让我们提交。 此时可以在此处找到此演示的[代码](https://github.com/diesel-rs/diesel/tree/v1.3.0/examples/postgres/getting_started_step_2/)。

现在我们已经创建并读出了更新，实际上更新相对简单。 让我们直接进入脚本：

`src/bin/publish_post.rs`

```rust
extern crate diesel_demo;
extern crate diesel;

use self::diesel::prelude::*;
use self::diesel_demo::*;
use self::models::Post;
use std::env::args;

fn main() {
    use diesel_demo::schema::posts::dsl::{posts, published};

    let id = args().nth(1).expect("publish_post requires a post id")
        .parse::<i32>().expect("Invalid ID");
    let connection = establish_connection();

    let post = diesel::update(posts.find(id))
        .set(published.eq(true))
        .get_result::<Post>(&connection)
        .expect(&format!("Unable to find post {}", id));
    println!("Published post {}", post.title);
}
```

让我们试试`cargo run --bin publish_post 1`。

```bash
Compiling diesel_demo v0.1.0 (file:///Users/sean/Documents/Projects/open-source/diesel_demo)
   Running `target/debug/publish_post 1`
Published post Diesel demo
```

现在，最后，我们可以看到我们的帖子`cargo run --bin show_posts`。

```bash
Running `target/debug/show_posts`
Displaying 1 posts
Diesel demo
----------

You know, a CLI application probably isn't the best interface for a blog demo.
But really I just wanted a semi-simple example, where I could focus on Diesel.
I didn't want to get bogged down in some web framework here.
Plus I don't really like the Rust web frameworks out there. We might make a
new one, soon.
```

我们仍然只覆盖了CRUD的四个字母中的三个。 让我们展示如何删除东西。 有时我们会写一些我们真正讨厌的东西，而且我们没有时间查找ID。 所以让我们根据标题删除，甚至只删除标题中的一些单词。

`src/bin/delete_post.rs`

```rust
extern crate diesel_demo;
extern crate diesel;

use self::diesel::prelude::*;
use self::diesel_demo::*;
use std::env::args;

fn main() {
    use diesel_demo::schema::posts::dsl::*;

    let target = args().nth(1).expect("Expected a target to match against");
    let pattern = format!("%{}%", target);

    let connection = establish_connection();
    let num_deleted = diesel::delete(posts.filter(title.like(pattern)))
        .execute(&connection)
        .expect("Error deleting posts");

    println!("Deleted {} posts", num_deleted);
}
```

我们可以使用`cargo run --bin delete_post demo`运行脚本（至少使用我选择的标题）。 您的输出应该类似于：

```bash
Compiling diesel_demo v0.1.0 (file:///Users/sean/Documents/Projects/open-source/diesel_demo)
     Running `target/debug/delete_post demo`
Deleted 1 posts
```

当我们再次尝试运行`cargo--bin show_posts`时，我们可以看到该帖实际上已被删除。 这几乎没有说明你可以用Diesel做什么，但希望这个教程给你一个良好的基础来建立。 我们建议您浏览[API文档](http://docs.diesel.rs/diesel/index.html)以了解更多信息。 可以在此处找到本教程的[最终代码](https://github.com/diesel-rs/diesel/tree/v1.3.0/examples/postgres/getting_started_step_3/)。