# 构建应用使用Diesel

使用查询构建器而不是原始SQL的一个主要好处是，您可以将查询的一些内容提取到函数中并重用它们。 在本指南中，我们将介绍将代码提取为可重用片段的常用模式。 我们还将介绍如何构建代码的最佳实践。

我们所有的代码示例都基于crates.io的代码，crates.io是一个广泛使用Diesel的真实应用程序。 我们所有的例子都将集中在返回查询或查询片段的函数上。 这些示例都不包含采用数据库连接的函数。 我们将在指南的最后介绍这种结构的好处。

crates.io有一个`canon_crate_name` SQL函数，在比较crate名称时总是使用它。 我们不是连续编写`canon_crate_name（crates :: name）.eq（“some name”）`，而是将其拉入函数中。

src/krate/mod.rs

```rust
use diesel::dsl::Eq;
use diesel::types::Text;

sql_function!(canon_crate_name, CanonCrateName, (x: Text) -> Text);

type WithName<'a> = Eq<canon_crate_name<crates::name>, canon_crate_name<&'a str>>;

fn with_name(name: &str) -> WithName {
    canon_crate_name(crates::name).eq(canon_crate_name(name))
}
```

现在，当我们想要按名称查找包时，我们可以编写`crates :: table.filter（with_name（“foo”））`。 如果我们想接受字符串以外的类型，我们可以使该方法通用。

src/krate/mod.rs

```rust
use diesel::dsl::Eq;
use diesel::types::Text;

sql_function!(canon_crate_name, CanonCrateName, (x: Text) -> Text);

type WithName<T> = Eq<canon_crate_name<crates::name>, canon_crate_name<T>>;

fn with_name<T>(name: T) -> WithName<T>
where
    T: AsExpression<Text>,
{
    canon_crate_name(crates::name).eq(canon_crate_name(name))
}
```

无论您是将功能设为通用还是仅采用单一类型，都取决于您。 我们建议只在实际需要时使这些函数成为通用函数，因为它需要在`where`子句中使用其他边界。 除非您熟悉diesel机的较低级别，否则您需要的界限可能并不明确。

在这些示例中，我们使用`diesel :: dsl`中的helper类型来显式地写入返回类型。 Diesel中的几乎所有方法都有这样的辅助类型。 第一个类型参数是方法接收器（前面的东西）。 其余的类型参数是方法的参数。 如果我们想避免编写这个返回类型，或者动态返回不同的表达式，我们可以改为使用该值。

src/krate/mod.rs

```rust
use diesel::pg::Pg;
use diesel::types::Text;

sql_function!(canon_crate_name, CanonCrateName, (x: Text) -> Text);

fn with_name<'a, T>(name: T) -> Box<BoxableExpression<crates::table, Pg, SqlType = Bool> + 'a>
where
    T: AsExpression<Text>,
    T::Expression: BoxableExpression<crates::table, Pg>,
{
    canon_crate_name(crates::name).eq(canon_crate_name(name))
}
```

为了box an expression，Diesel需要知道三件事：

* 您打算使用它的表
* 您打算执行它的后端
* 它表示的SQL类型
  
这是Diesel用于键入检查查询的所有信息。通常我们可以从类型中获取此信息，但由于我们已经通过装箱擦除了类型，我们必须提供它。

该表用于确保您不会尝试在对`posts :: table`的查询中使用`users :: name`。我们需要知道你将执行它的后端，所以我们不小心在SQLite上使用PostgreSQL函数。需要SQL类型，因此我们知道可以传递给哪些函数。

装箱表达式也意味着它没有聚合函数。您无法在Diesel中装入聚合表达式。从Diesel 1.0开始，盒装表达式只能与给定的from子句一起使用。您不能将带有内部联接的`crates :: table`的盒装表达式用于另一个表。

除了提取表达式之外，您还可以将整个查询提取到函数中。回到crates.io，`Crate`结构不会使用`crates`表中的每一列。因为我们几乎总是选择这些列的子集，所以我们有一个`all`函数来选择我们需要的列。

src/krate/mod.rs

```rust
use diesel::dsl::Select;

type AllColumns = (
    crates::id,
    crates::name,
    crates::updated_at,
    crates::created_at,
);

const ALL_COLUMNS = (
    crates::id,
    crates::name,
    crates::updated_at,
    crates::created_at,
);

type All = Select<crates::table, AllColumns>;

impl Crate {
    pub fn all() -> All {
        crates::table.select(ALL_COLUMNS)
    }
}
```

我们还经常发现自己编写`Crate :: all（）。filter（with_name（crate_name））`。 我们也可以把它拉成一个函数。

src/krate/mod.rs

```rust
use diesel::dsl::Filter;

type ByName<T> = Filter<All, WithName<T>>;

impl Crate {
    fn by_name<T>(name: T) -> ByName<T> {
        Self::all().filter(with_name(name))
    }
}
```

就像表达式一样，如果我们不想编写返回类型，或者我们想要以不同的方式动态构造查询，我们可以打包整个查询。

src/krate/mod.rs

```rust
use diesel::expression::{Expression, AsExpression};
use diesel::pg::Pg;
use diesel::types::Text;

type SqlType = <AllColumns as Expression>::SqlType;
type BoxedQuery<'a> = crates::BoxedQuery<'a, Pg, SqlType>;

impl Crate {
    fn all() -> BoxedQuery<'static> {
        crates::table().select(ALL_COLUMNS).into_boxed()
    }

    fn by_name<'a, T>(name: T) -> BoxedQuery<'a>
    where
        T: AsExpression<Text>,
        T::Expression: BoxableExpression<crates::table, Pg>,
    {
        Self::all().filter(by_name(name))
    }
}
```

再一次，我们必须向Diesel提供一些信息来装箱查询：

* `SELECT`子句的SQL类型
* `FROM`子句
* 你将要执行它的后端
  
需要SQL类型，以便我们可以确定可以从此查询反序列化哪些结构。 需要`FROM`子句，以便我们可以验证未来对`filter`和其他查询构建器方法的调用的参数。 需要后端以确保您不会在SQLite上意外使用PostgreSQL函数。

请注意，在我们的所有示例中，我们都在编写返回查询或表达式的函数。 这些函数都不执行查询。 通常，您应该始终首选返回查询的函数，并避免将连接作为参数的函数。 这允许您重复使用和撰写查询。

例如，如果我们编写了这样的`by_name`函数：

src/krate/mod.rs

```rust
impl Crate {
    fn by_name(name: &str, conn: &PgConnection) -> QueryResult<Self> {
        Self::all()
            .filter(with_name(name))
            .first(conn)
    }
}
```

然后我们将永远无法在另一个上下文中使用此查询，或进一步修改它。 通过将函数编写为返回查询而不是执行查询的函数，我们可以将其用作子选择。

```rust
let version_id = versions
    .select(id)
    .filter(crate_id.eq_any(Crate::by_name(crate_name).select(crates::id)))
    .filter(num.eq(version))
    .first(&*conn)?;
```

或者使用它来做一些事情，比如获取所有下载内容：

```rust
let recent_downloads = Crate::by_name(crate_name)
    .inner_join(crate_downloads::table)
    .filter(CrateDownload::is_recent())
    .select(sum(crate_downloads::downloads))
    .get_result(&*conn)?;
```
