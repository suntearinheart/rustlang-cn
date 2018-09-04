# 更新

大多数应用程序属于称为“CRUD”应用程序的类别。 CRUD代表“创建，读取，更新，删除”。 Diesel为所有四个部分提供支持，但在本指南中，我们将介绍更新记录的所有不同方法。

通过调用`diesel :: update（target）.set（changes）`来构造更新语句。 然后通过调用`execute，get_result`或`get_results`来运行生成的语句。

如果查看[update](http://docs.diesel.rs/diesel/fn.update.html)文档，您会注意到参数的类型是实现`IntoUpdateTarget`的任何类型T. 您无需担心此特性的作用，但了解哪些类型可以实现它非常重要。 实现这种特性有三种。 第一个是表格。

如果我们有一个如下所示的表：

```rust
table! {
    posts {
        id -> BigInt,
        title -> Text,
        body -> Text,
        draft -> Bool,
        publish_at -> Timestamp,
        visit_count -> Integer,
    }
}
```

我们可以编写一个查询来发布所有帖子

```rust
use posts::dsl::*;

diesel::update(posts).set(draft.eq(false))
```

我们可以使用[debug_query](http://docs.diesel.rs/diesel/fn.debug_query.html)函数来检查生成的SQL。 您看到的输出可能与本指南略有不同，具体取决于您使用的后端。 如果我们运行`println！（“{}”，debug_query :: <Pg，_>（＆our_query））;`,我们将看到以下内容：

```sql
UPDATE "posts" SET "draft" = $1 -- binds: [false]
```

这与Rust代码几乎是一对一的（？表示SQL中的绑定参数，这里将用false替换）。 但是，想要更新整个表格的情况非常少见。 那么让我们来看看我们如何将其缩小范围。 您可以传递给更新的第二种是任何只有`.filter`调用的查询。 我们可以将更新范围仅限于触及`publish_at`过去的帖子，如下所示：

```rust
use posts::dsl::*;
use diesel::expression::dsl::now;

let target = posts.filter(publish_at.lt(now));
diesel::update(target).set(draft.eq(false))
```

这将生成以下SQL

```sql
UPDATE `posts` SET `draft` = ?
WHERE `posts`.`publish_at` < CURRENT_TIMESTAMP
```

最常见的更新查询仅限于单个记录。 因此，您可以传递给`update`的最后一种是实现可[Identifiable](http://docs.diesel.rs/diesel/associations/trait.Identifiable.html) trait的任何东西。 通过在结构上放置`＃[derive（Identifiable）]`来实现`Identifiable`。 它表示与数据库表上的行一对一的任何结构。

如果我们想要一个映射到我们的posts表的结构，它看起来像这样：

```rust
#[derive(Identifiable)]
pub struct Post {
    pub id: i32,
    pub title: String,
    pub body: String,
    pub draft: bool,
    pub publish_at: SystemTime,
}
```

在此struct,每个数据库列有一个字段，但对于`Identifiable`来说重要的是它有`id`字段，它是我们表的主键。 由于我们的结构名称只是没有`s`的表名，因此我们不必显式提供表名。 如果我们的结构被命名为不同的东西，或者如果将其复数化比将s放在最后更复杂，我们必须通过添加`＃[table_name =“posts”]`来指定表名。 我们在这里使用`SystemTime`，因为它在标准库中，但在实际应用中，我们可能想要使用更全功能的类型，例如来自`chrono`的类型，您可以通过启用Diesel上的`chrono`功能来实现。

如果我们想发布这篇文章，我们可以这样做：

```rust
diesel::update(&post).set(posts::draft.eq(false))
```

重要的是要注意我们总是传递对帖子的引用，而不是帖子本身。 当我们写 `update(post)`时，这相当于写`update(posts.find(post.id))`或`update（posts.filter（id.eq（post.id）））`。 我们可以在生成的SQL中看到这个：

```sql
UPDATE `posts` SET `draft` = ? WHERE `posts`.`id` = ?
```

现在我们已经看到了指定我们想要更新的所有方法，让我们看一下提供数据来更新它的不同方法。 我们已经看到了第一种方法，即直接传递`column.eq（value）`。 到目前为止，我们刚刚在这里传递了Rust值，但我们实际上可以使用任何Diesel表达式。 例如，我们可以增加一列：

```rust
use posts::dsl::*;

diesel::update(posts).set(visit_count.eq(visit_count + 1))
```

生成的SQL

```sql
UPDATE `posts`
SET `visit_count` = `posts`.`visit_count` + 1
```

直接分配值对于小而简单的更改非常有用。 如果我们想以这种方式更新多个列，我们可以传递一个元组。

```rust
use posts::dsl::*;

diesel::update(posts)
  .set((
      title.eq("[REDACTED]"),
      body.eq("This post has been classified"),
  ))
```

这将生成您期望的SQL

```sql
UPDATE `posts` SET `title` = ?, `body` = ?
```

### AsChangeset
虽然能够像这样直接更新列是很好的，但在处理具有多个字段的表单时，它很快就会变得很麻烦。 如果我们查看`.set`的签名，您会注意到约束是针对称为`AsChangeset`的特征。 这是diesel可以为我们提供的另一个特性。 我们可以将`＃[derive（AsChangeset）]`添加到我们的Post结构中，这将让我们传递一个`＆Post`来设`set`。

```rust
diesel::update(posts::table).set(&post)
```

SQL将设置Post结构中除主键之外的每个字段。

```sql
UPDATE `posts` SET
    `title` = ?,
    `body` = ?,
    `draft` = ?,
    `publish_at` = ?,
    `visit_count` = ?
```

更改现有行的主键几乎不是您想要执行的操作，因此 `＃[derive（AsChangeset）]`假定您要忽略它。 更改主键的唯一方法是使用`.set（id.eq（new_id））`显式地执行此操作。 但请注意，`＃[derive（AsChangeset）]`没有表定义中的信息。 如果主键不是`id`，则还需要在结构上放置`＃[primary_key（your_primary_key）]`。

如果结构上有任何可选字段，则这些字段也会有特殊行为。 默认情况下，`＃[derive（AsChangeset）]`将假定`None`表示您不希望分配该字段。 例如，如果我们有以下代码：

```rust
#[derive(AsChangeset)]
#[table_name="posts"]
struct PostForm<'a> {
    title: Option<&'a str>,
    body: Option<&'a str>,
}

diesel::update(posts::table)
    .set(&PostForm {
        title: None,
        body: Some("My new post"),
    })
```

这将生成以下SQL：

```sql
UPDATE `posts` SET `body` = ?
```

如果要分配`NULL`，可以在结构上指定`＃[changeset_options（treat_none_as_null =“true”）]`，或者可以使字段的类型为`Option <Option <T >>`。 Diesel目前没有提供一种方法来明确地将字段分配给其默认值，尽管可能在将来提供。

如果您正在使用PostgreSQL，所有这些选项也适用于`INSERT ON CONFLICT DO UPDATE`。 有关更多详细信息，请参阅[upsert文档](http://docs.diesel.rs/diesel/pg/upsert/index.html)。

## 执行您的查询
构建查询后，我们需要实际执行它。有几种不同的方法可以做到这一点，具体取决于你想要的类型。

运行查询的最简单方法是[execute](http://docs.diesel.rs/diesel/query_dsl/trait.RunQueryDsl.html#tymethod.execute)。此方法将运行您的查询，并返回受影响的行数。如果您只是想确保查询成功执行，并且不关心从数据库中获取任何内容，则应使用此方法。

对于您希望从数据库中获取数据的查询，我们需要使用[get_result](http://docs.diesel.rs/diesel/query_dsl/trait.RunQueryDsl.html#method.get_result)或[get_results](http://docs.diesel.rs/diesel/query_dsl/trait.RunQueryDsl.html#method.get_results)。如果您没有显式调用[returning](http://docs.diesel.rs/diesel/query_builder/struct.UpdateStatement.html#method.returning)，这些方法将返回表中的所有列。与select语句上的[load](http://docs.diesel.rs/diesel/query_dsl/trait.RunQueryDsl.html#method.load)类似，您需要指定要反序列化的类型（使用`＃[derive（Queryable）]`的元组或结构）。当您期望返回多个记录时，应该使用get_results。如果您只想要一条记录，则可以调用`get_result`。

应该注意，默认情况下，从`get_result`接收0行被视为错误条件。如果要返回0或1行（例如，返回类型为`QueryResult <Option <T >>）`，则需要调用`.get_result（...）.optional（）`。

最后，如果你的结构同时包含`＃[derive（AsChangeset）]`和`＃[derive（Identifiable）]`，你将能够使用[save_changes](http://docs.diesel.rs/diesel/query_dsl/trait.SaveChangesDsl.html#method.save_changes)方法。与本指南中提到的其他方法不同，使用`save_changes`时不会显式构建查询。执行`foo.save_changes（＆conn）`相当于执行`diesel :: update（＆foo）.set（＆foo）.get_result（＆conn）`。与`get_result`和`get_results`一样，您需要指定您想要返回的类型。

本指南的所有代码都可以在此[Diesel示例](https://github.com/diesel-rs/diesel/tree/v1.3.0/examples/postgres/all_about_updates/src/lib.rs)中以可执行的形式找到。