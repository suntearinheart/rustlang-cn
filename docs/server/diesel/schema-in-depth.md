# 深入Schema

在本指南中，我们将看看究竟`diesel print-schema`和[table! ](http://docs.diesel.rs/diesel/macro.table.html)。对于`table！`，我们将展示生成的实际代码的简化版本，并解释每个部分与您的相关性。如果您曾经对生成的内容或者`use schema :: posts :: dsl :: *`的含义感到困惑，那么这是正确的选择。

`diesel print-schema`是Diesel CLI提供的命令。此命令将建立数据库连接，查询所有表及其列的列表，并生`table！`每个的调用。 `diesel print-schema`将跳过任何以`__`（双下划线）开头的表名。可以将Diesel配置为在运行迁移时自动重新运行`diesel print-schema`。有关详细信息，请参阅配置`Configuring Diesel CLI`

`table！`是生成大量代码的地方。如果你愿意，你可以看到通过运行`cargo rustc -- -Z unstable-options --pretty=expanded`生成的实际确切代码.但是，输出会非常嘈杂，并且有很多代码实际上与您无关。相反，我们将逐步完成此输出的简化版本，该版本仅包含您将直接使用的代码。

对于此示例，我们将查看此`table!`生成的代码调用：

```bash
table! {
    users {
        id -> Integer,
        name -> Text,
        hair_color -> Nullable<Text>,
    }
}
```

如果您只想查看完整的简化代码并亲自查看，您可以在本指南的最后找到它。

`table！`的输出 始终是具有相同名称的Rust模块。 该模块的第一个也是最重要的部分是表格本身的定义：

```rust
pub struct table;
```

这是用于构造SQL查询的表示用户表的结构。 它通常在代码中被引用为`users :: table`（或者有时只是`users`，稍微多一点）。 接下来，我们将看到一个名为`columns`的模块，每列的一个结构。

```rust
pub struct id;
pub struct name;
pub struct hair_color;
```

为了构造SQL查询，这些结构中的每一个都唯一地表示表的每一列。 这些结构中的每一个都将实现一个名为[Expression](https://docs.diesel.rs/diesel/expression/trait.Expression.html)的特征，该特征指示列的SQL类型。

```rust
impl Expression for id {
    type SqlType = Integer;
}

impl Expression for name {
    type SqlType = Text;
}

impl Expression for hair_color {
    type SqlType = Nullable<Text>;
}

```

`SqlType`类型是Diesel如何确保您的查询正确的核心。 [ExpressionMethods](https://docs.diesel.rs/diesel/expression_methods/trait.ExpressionMethods.html)将使用此类型来确定哪些内容可以和不可以传递给方法，如`eq`。 [Queryable](http://docs.diesel.rs/diesel/deserialize/trait.Queryable.html)还将使用它来确定当该列出现在select子句中时可以反序列化的类型。

在列模块中，您还会看到一个名为`star`的特殊列。 它的定义如下：

```rust
pub struct star;

impl Expression for star {
    type SqlType = ();
}
```

`star`结构表示查询构建器中的`users.*`。 此结构仅用于生成计数查询。 它永远不应该直接使用。 Diesel通过索引而不是按名称从查询加载数据。 为了确保我们实际获得我们认为的列的数据，当我们真正想要从中获取数据时，Diesel从不使用`*`。 我们将生成一个显式的select子句，例如`SELECT users.id，users.name，users.hair_color`。

列模块中的所有内容都将从父模块重新导出。 这就是为什么我们可以将列引用为`users :: id`，而不是`users :: columns :: id`。

```rust
pub use self::columns::*;

pub struct table;

pub mod columns {
    /* ... */
}
```

当所有内容都必须以`users ::`为前缀时，查询通常会变得非常冗长。 出于这个原因，Diesel还提供了一个名为`dsl`的便利模块。

```rust
pub mod dsl {
    pub use super::columns::{id, name, hair_color};
    pub use super::table as users;
}
```

此模块重新导出`columns`中的所有内容（`star`除外），并重新导出表但重命名为表的实际名称。 这意味着不是写作

```rust
users::table
  .filter(users::name.eq("Sean"))
  .filter(users::hair_color.eq("black"))
```

我们可以改写

```rust
users.filter(name.eq("Sean")).filter(hair_color.eq("black"))
```

只应为单个函数导入`dsl`模块。 你永远不应该使用`schema :: users :: dsl :: *`; 在模块的顶部。 像`＃[derive（Insertable）]`这样的代码将假定`users`指向模块，而不是表结构。

如果您使用`schema :: users :: dsl :: *`;则由于`star`无法访问，因此它也会在表格上公开为实例方法。

```rust
impl table {
    pub fn star(&self) -> star {
        star
    }
}
```

接下来，为`table`实现了几个特性。 您通常永远不会直接与这些进行交互，但它们可以启用[query_dsl](https://docs.diesel.rs/diesel/query_dsl/index.html)中的大多数查询构建器函数，以及与`insert`,` update`和`delete`一起使用。

```rust
impl AsQuery for table {
    /* body omitted */
}

impl Table for table {
    /* body omitted */
}

impl IntoUpdateTarget for table {
    /* body omitted */
}

```

最后，定义了一些小类型定义和常量，以使您的生活更轻松。

```rust
pub const all_columns: (id, name, hair_color) = (id, name, hair_color);

pub type SqlType = (Integer, Text, Nullable<Text>);

pub type BoxedQuery<'a, DB, ST = SqlType> = BoxedSelectStatement<'a, ST, table, DB>;
```

`all_columns`只是表中所有列的元组。 当您未明确指定查询时，它用于为此表上的查询生成`select`语句。 如果你想引用`users :: star`来查找不是count查询的东西，你可能需要`users::all_columns` 。

`SqlType`将是`all_columns`的SQL类型。 很少需要直接引用它，但是当需要时，它比`<< users :: table as Table> :: AllColumns as Expression> :: SqlType`更简洁.

最后，有一个帮助器类型用于引用从该表构建的盒装查询。 这意味着代替编写`BoxedSelectStatement <'static，users :: SqlType，users :: table，Pg>`而不是编写`users :: BoxedQuery <'static，Pg>`。 如果查询具有自定义select子句，您也可以选择指定SQL类型。

这就是一切！ 以下是为此表生成的完整代码：

```rust
pub mod users {
    pub use self::columns::*;

    pub mod dsl {
        pub use super::columns::{id, name, hair_color};
        pub use super::table as users;
    }

    pub const all_columns: (id, name, hair_color) = (id, name, hair_color);

    pub struct table;

    impl table {
        pub fn star(&self) -> star {
            star
        }
    }

    pub type SqlType = (Integer, Text, Nullable<Text>);

    pub type BoxedQuery<'a, DB, ST = SqlType> = BoxedSelectStatement<'a, ST, table, DB>;

    impl AsQuery for table {
        /* body omitted */
    }

    impl Table for table {
        /* body omitted */
    }

    impl IntoUpdateTarget for table {
        /* body omitted */
    }

    pub mod columns {
        pub struct star;

        impl Expression for star {
            type SqlType = ();
        }

        pub struct id;

        impl Expression for id {
            type SqlType = Integer;
        }

        pub struct name;

        impl Expression for name {
            type SqlType = Text;
        }

        pub struct hair_color;

        impl Expression for hair_color {
            type SqlType = Nullable<Text>;
        }
    }
}
```