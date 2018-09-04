# 插入

大多数应用程序属于称为“CRUD”应用程序的类别。 CRUD代表“创建，读取，更新，删除”。 Diesel为所有四个部分提供支持，但在本指南中，我们将介绍创建`INSERT`语句的不同方法。

本指南的示例将针对PostgreSQL显示，但您可以跟随任何后端。 所有后端的完整代码示例链接在本指南的底部。

insert语句始终以[insert_into](http://docs.diesel.rs/diesel/fn.insert_into.html)开头。 此函数的第一个参数是您要插入的表。

对于本指南，我们的架构将如下所示：

src/lib.rs

```rust
table! {
    users {
        id -> Integer,
        name -> Text,
        hair_color -> Nullable<Text>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}
```

由于我们的函数只能在`users`表上运行，我们可以使用`schema :: users :: dsl :: *; `在我们函数的顶部，这将让我们写`insert_into（users）`而不是`insert_into（users :: table）`。 如果要导入`table :: dsl :: *`，请确保它始终位于函数内部，而不是模块的顶部。

如果表上的所有列都有默认值，我们可以做的最简单的事情就是调用[.default_values](http://docs.diesel.rs/diesel/query_builder/struct.IncompleteInsertStatement.html#method.default_values)。 我们可以编写一个运行该查询的函数，如下所示：

src/lib.rs

```rust
use schema::users::dsl::*;

insert_into(users).default_values().execute(conn)
```

值得注意的是，即使您的所有列上都没有默认值，此代码仍会编译。 Diesel将确保您分配的值具有正确的类型，但它无法验证列是否具有默认值，任何可能失败的约束或任何可能触发的触发器。

我们可以使用[debug_query](http://docs.diesel.rs/diesel/fn.debug_query.html)来检查生成的SQL。 生成的确切SQL可能会有所不同，具体取决于您使用的后端。 如果我们运行`println！（“{}”，debug_query :: <Pg，_>（＆our_query））;`,我们将看到以下内容：

src/lib.rs

```rust
INSERT INTO "users" DEFAULT VALUES -- binds: []
```

如果我们想要实际提供值，我们可以调用[.values](http://docs.diesel.rs/diesel/query_builder/struct.IncompleteInsertStatement.html#method.values)。 我们可以在这里提供很多不同的论点。 最简单的是使用[.eq](http://docs.diesel.rs/diesel/expression_methods/trait.ExpressionMethods.html#method.eq)的单列/值对。

src/lib.rs

```rust
use schema::users::dsl::*;

insert_into(users).values(name.eq("Sean")).execute(conn)
```

这将生成以下SQL：

src/lib.rs

```rust
INSERT INTO "users" ("name") VALUES ($1)
-- binds ["Sean"]
```

如果我们想为多个列提供值，我们可以传递一个元组。

src/lib.rs

```rust
insert_into(users)
    .values((name.eq("Tess"), hair_color.eq("Brown")))
    .execute(conn)
```

这将生成以下SQL：

```rust
INSERT INTO "users" ("name", "hair_color")
VALUES ($1, $2) -- binds: ["Tess", "Brown"]
```

## 插入

如果您只想在数据库中添加一些值，则使用元组是执行插入的典型方法。 但是，如果您的数据来自其他来源，例如Serde反序列化的网络表单，该怎么办？ 必须写`（name.eq（user.name），hair_color.eq（user.hair_color））`会很烦人。

Diesel为此案例提供了可[Insertable ](http://docs.diesel.rs/diesel/prelude/trait.Insertable.html) trait。 Insertable将结构映射到数据库中的列。 我们可以通过在我们的类型中添加`＃[derive（Insertable）]`来自动推导出这个。

src/lib.rs

```rust
use schema::users;

#[derive(Deserialize, Insertable)]
#[table_name = "users"]
pub struct UserForm<'a> {
    name: &'a str,
    hair_color: Option<&'a str>,
}
```

```rust
use schema::users::dsl::*;

let json = r#"{ "name": "Sean", "hair_color": "Black" }"#;
let user_form = serde_json::from_str::<UserForm>(json)?;

insert_into(users).values(&user_form).execute(conn)?;

Ok(())
```

这将生成与我们使用元组相同的SQL。

src/lib.rs

```rust
INSERT INTO "users" ("name", "hair_color")
VALUES ($1, $2) -- binds: ["Sean", "Black"]
```

如果其中一个字段为None，则将为该字段插入默认值。

src/lib.rs

```rust
use schema::users::dsl::*;

let json = r#"{ "name": "Ruby", "hair_color": null }"#;
let user_form = serde_json::from_str::<UserForm>(json)?;

insert_into(users).values(&user_form).execute(conn)?;

Ok(())
```

这将生成以下SQL：

src/lib.rs

```rust
INSERT INTO "users" ("name", "hair_color")
VALUES ($1, DEFAULT) -- binds: ["Ruby"]
```

## 批量插入

如果我们想一次插入多行，我们可以通过传递上面使用的任何表单的`＆Vec`或切片来实现。 请记住，您总是在这里传递引用。 从Diesel 1.0开始，如果您尝试传递`Vec`而不是`＆Vec`，Rust将生成一个关于溢出的非常不透明的错误消息。

在支持`DEFAULT`关键字的后端（除SQLite之外的所有后端）上，数据将插入到单个查询中。 在SQLite上，每行将执行一个查询。

例如，如果我们想要插入具有单个值的两行，我们可以使用`Vec`。

src/lib.rs

```rust
use schema::users::dsl::*;

insert_into(users)
    .values(&vec![name.eq("Sean"), name.eq("Tess")])
    .execute(conn)
```

生成以下SQL：

```rust
INSERT INTO "users" ("name") VALUES ($1), ($2)
-- binds ["Sean", "Tess"]
```

请注意，在SQLite上，您将无法使用`debug_query`，因为它不会映射到单个查询。 您可以像这样检查每一行：

src/lib.rs

```rust
for row in &values {
    let query = insert_into(users).values(row);
    println!("{}", debug_query::<Sqlite, _>(&query));
}
```

如果我们想对某些行使用`DEFAULT`，我们可以在这里使用一个选项。

src/lib.rs

```rust
use schema::users::dsl::*;

insert_into(users)
    .values(&vec![Some(name.eq("Sean")), None])
    .execute(conn)
```

请注意，此处的类型是`Option <Eq <Column，Value >> `not `Eq <Column，Option <Value >>`。 执行`column.eq（None）`会插入`NULL`而不是`DEFAULT`。 这会生成以下SQL：

src/lib.rs

```rust
INSERT INTO "users" ("name") VALUES ($1), (DEFAULT)
-- binds ["Sean"]
```

我们可以用元组做同样的事情。

src/lib.rs

```rust
use schema::users::dsl::*;

insert_into(users)
    .values(&vec![
        (name.eq("Sean"), hair_color.eq("Black")),
        (name.eq("Tess"), hair_color.eq("Brown")),
    ])
    .execute(conn)
```

生成以下SQL：

src/lib.rs

```rust
INSERT INTO "users" ("name", "hair_color")
VALUES ($1, $2), ($3, $4)
-- binds: ["Sean", "Black", "Tess", "Brown"]
```

再次，我们可以使用`Option`为任何字段插入`DEFAULT`。

src/lib.rs

```rust
use schema::users::dsl::*;

insert_into(users)
    .values(&vec![
        (name.eq("Sean"), Some(hair_color.eq("Black"))),
        (name.eq("Ruby"), None),
    ])
    .execute(conn)
```

生成以下SQL：

```rust
INSERT INTO "users" ("name", "hair_color")
VALUES ($1, $2), ($3, DEFAULT)
-- binds: ["Sean", "Black", "Ruby"]
```

最后，`Insertable`结构也可用于批量插入。

src/lib.rs

```rust
use schema::users::dsl::*;

let json = r#"[
    { "name": "Sean", "hair_color": "Black" },
    { "name": "Tess", "hair_color": "Brown" }
]"#;
let user_form = serde_json::from_str::<Vec<UserForm>>(json)?;

insert_into(users).values(&user_form).execute(conn)?;

Ok(())
```

这会生成与我们使用元组相同的SQL：

src/lib.rs

```rust
INSERT INTO "users" ("name", "hair_color")
VALUES ($1, $2), ($3, $4)
-- binds: ["Sean", "Black", "Tess", "Brown"]
```

The `RETURNING`Clause

在支持`RETURNING`子句的后端（例如PostgreSQL）上，我们也可以从插入中获取数据。 MySQL和SQLite不支持`RETURNING`子句。 要获取所有插入的行，我们可以调用[.get_results](http://docs.diesel.rs/diesel/query_dsl/trait.RunQueryDsl.html#method.get_results)而不是[.execute](http://docs.diesel.rs/diesel/query_dsl/trait.RunQueryDsl.html#method.execute)。

src/lib.rs

```rust
#[derive(Queryable, PartialEq, Debug)]
struct User {
    id: i32,
    name: String,
    hair_color: Option<String>,
    created_at: SystemTime,
    updated_at: SystemTime,
}
```

我们可以在这个测试中使用`get_results`：

src/lib.rs

```rust
use diesel::select;
use schema::users::dsl::*;

let now = select(diesel::dsl::now).get_result::<SystemTime>(&conn)?;

let inserted_users = insert_into(users)
    .values(&vec![
        (id.eq(1), name.eq("Sean")),
        (id.eq(2), name.eq("Tess")),
    ])
    .get_results(&conn)?;

let expected_users = vec![
    User {
        id: 1,
        name: "Sean".into(),
        hair_color: None,
        created_at: now,
        updated_at: now,
    },
    User {
        id: 2,
        name: "Tess".into(),
        hair_color: None,
        created_at: now,
        updated_at: now,
    },
];
assert_eq!(expected_users, inserted_users);
```

要检查`.get_results`或`.get_result`生成的SQL，我们需要在将其传递给`debug_query`之前调用`.as_query`。 上次测试中的查询生成以下SQL：

src/lib.rs

```rust
INSERT INTO "users" ("id", "name")
VALUES ($1, $2), ($3, $4)
RETURNING "users"."id", "users"."name", "users"."hair_color",
          "users"."created_at", "users"."updated_at"
-- binds: [1, "Sean", 2, "Tess"]
```

您会注意到我们在任何示例中都没有为`created_at`和`updated_at`提供明确的值。 使用Diesel时，通常不会在Rust中设置这些值。 通常，这些列使用`DEFAULT CURRENT_TIMESTAMP`进行设置，并使用触发器更新更新时的`updated_at`。 如果您正在使用PostgreSQL，则可以通过运行`SELECT diesel_manage_updated_at（'users'）`来使用内置触发器; 在迁移中。

如果我们期望一行而不是多行，我们可以调用`.get_result`而不是`.get_results`。

src/lib.rs

```rust
use diesel::select;
use schema::users::dsl::*;

let now = select(diesel::dsl::now).get_result::<SystemTime>(&conn)?;

let inserted_user = insert_into(users)
    .values((id.eq(3), name.eq("Ruby")))
    .get_result(&conn)?;

let expected_user = User {
    id: 3,
    name: "Ruby".into(),
    hair_color: None,
    created_at: now,
    updated_at: now,
};
assert_eq!(expected_user, inserted_user);
```

这会生成与get_results相同的SQL：

src/lib.rs

```rust
INSERT INTO "users" ("id", "name") VALUES ($1, $2)
RETURNING "users"."id", "users"."name", "users"."hair_color",
          "users"."created_at", "users"."updated_at"
-- binds: [3, "Ruby"]
```

最后，如果我们只想要一个列，我们可以明确地调用`.returning`。 此代码将返回插入的ID：

src/lib.rs

```rust
use schema::users::dsl::*;

insert_into(users)
    .values(name.eq("Ruby"))
    .returning(id)
    .get_result(conn)
```

生成以下SQL：

src/lib.rs

```rust
INSERT INTO "users" ("name") VALUES ($1)
RETURNING "users"."id"
-- binds: ["Ruby"]
```

## Upsert

本指南中介绍的每种插入语句也可用于“插入或更新”查询，也称为“upsert”。 API文档中详细介绍了upsert的细节。

对于PostgreSQL，请参阅[pg :: upsert](http://docs.diesel.rs/diesel/pg/upsert/index.html)模块。 对于MySQL和SQLite，upsert通过`REPLACE`完成。 有关详细信息，请参阅[replace_into](http://docs.diesel.rs/diesel/fn.replace_into.html)。

Diesel不支持MySQL的`ON DUPLICATE KEY`冲突，因为它的结果是非确定性的，并且复制时不安全。

## 结论

虽然本指南中有很多示例，但最终各种insert语句之间的唯一区别是传递给`.values`的参数。

本指南中的所有示例均作为Diesel测试套件的一部分运行。 您可以在以下链接中找到每个后端的完整代码示例：

* [PostgreSQL](https://github.com/diesel-rs/diesel/tree/v1.3.0/examples/postgres/all_about_inserts)
* [MySQL](https://github.com/diesel-rs/diesel/tree/v1.3.0/examples/mysql/all_about_inserts)
* [SQLite](https://github.com/diesel-rs/diesel/tree/v1.3.0/examples/sqlite/all_about_inserts)