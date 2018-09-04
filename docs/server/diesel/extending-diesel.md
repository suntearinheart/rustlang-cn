# 扩展Diesel

Diesel提供了许多开箱即用的功能。但是，它不一定提供您的应用可能想要使用的所有内容。 Diesel最大的优势之一是它可以扩展到添加新功能。

在本指南中，我们将介绍几种挂钩Diesel查询构建器的方法，既可以添加新功能，也可以引入新的抽象。

本指南仅涉及扩展查询构建器。如何添加对新SQL类型的支持将在以后的指南中介绍。

## sql_function！

扩展Diesel查询构建器的最简单和最常用的方法是声明一个新的SQL函数。这可以用于数据库定义的函数，也可以用于Diesel不支持的内置函数。

SQL中的函数通常具有多个签名，这使得它们难以或无法在Rust中表示。因此，Diesel仅支持少量内置SQL函数。考虑`COALESCE`。此函数可以接受任意数量的参数，并且其返回类型会根据是否有任何参数`NOT NULL`而更改。虽然我们不能在Rust中轻松表示，但我们可以使用`sql_function！`用我们正在使用的确切签名声明它。

```rust
use diesel::types::{Nullable, Text};
sql_function!(coalesce, Coalesce, (x: Nullable<Text>, y: Text) -> Text);

users.select(coalesce(hair_color, "blue"))
```

如本例所示，`sql_function！` 像查询构建器的其他部分一样转换其参数。 这意味着生成的函数可以同时使用Diesel表达式和Rust值与查询一起发送。

该宏有三个参数：

* 功能名称
* 类型名称
* 类型签名

类型签名使用与普通Rust函数相同的语法。 但是，给出的类型是SQL类型，而不是具体的Rust类型。 这是允许我们传递列和Rust字符串的原因。 如果我们手动定义此函数，它将如下所示：

```rust
fn coalesce<X, Y>(x: X, y: Y) -> Coalesce<X::Expression, Y::Expression>
where
    X: AsExpression<Nullable<Text>>,
    Y: AsExpression<Text>,
```

作为第二个参数给出的类型名称几乎从不使用。 而是生成一个与函数同名的帮助程序类型。 这个助手类型处理Diesel的参数转换。 这让我们可以编写`coalesce <hair_color，＆str>`而不是`Coalsece <hair_color，Bound <Text，＆str >>`。

## 使用自定义SQL和如何扩展查询DSL

通常，封装常见的SQL模式很有用。 例如，如果您对查询进行分页，PostgreSQL能够在单个查询中加载总计数。 您想要执行的查询如下所示：

```sql
SELECT *, COUNT(*) OVER () FROM (subselect t) LIMIT $1 OFFSET $1
```

但是，从版本1.0开始，Diesel不支持窗口功能，也不支持从子选择中选择。 即使Diesel的查询构建器支持这些内容，但就我们想要生成的SQL而言，这是一个更容易推理的情况。

让我们看一下如何在Diesel的查询构建器中添加`paginate`方法来生成该查询。 我们暂时假设我们已经有了一个结构`Paginated <T>`。 我们很快就会看到这个结构的细节。

如果要创建要手动定义SQL的结构，则需要实现名为`QueryFragment`的特征。 实现将如下所示：

src/pagination.rs

```rust
impl<T> QueryFragment<Pg> for Paginated<T>
where
    T: QueryFragment<Pg>,
{
    fn walk_ast(&self, mut out: AstPass<Pg>) -> QueryResult<()> {
        out.push_sql("SELECT *, COUNT(*) OVER () FROM (");
        self.query.walk_ast(out.reborrow())?;
        out.push_sql(") LIMIT ");
        out.push_bind_param::<BigInt, _>(&self.limit())?;
        out.push_sql(" OFFSET ");
        out.push_bind_param::<BigInt, _>(&self.offset())?;
        Ok(())
    }
}
```

有关每种方法的详细信息，请参阅[AstPass](http://docs.diesel.rs/diesel/query_builder/struct.AstPass.html)的文档。 实现`QueryFragment`时要问的一个重要问题是，是否要生成可以安全缓存的查询。 回答这个问题的方法是问“这个结构生成无限数量的潜在SQL查询”吗？ 通常只有当`walk_ast`的主体包含for循环时才会出现这种情况。 如果您的查询无法安全缓存，则必须调用`out.unsafe_to_cache_prepared`。

无论何时实现`QueryFragment`，还需要实现[QueryId](http://docs.diesel.rs/diesel/query_builder/trait.QueryId.html)。 我们可以使用[impl_query_id！](http://docs.diesel.rs/diesel/macro.impl_query_id.html) 宏为此。 由于此结构表示可以执行的完整查询，因此我们将实现[RunQueryDsl](http://docs.diesel.rs/diesel/query_dsl/trait.RunQueryDsl.html)，它添加了诸如[execute](http://docs.diesel.rs/diesel/query_dsl/trait.RunQueryDsl.html#method.execute)和[load](http://docs.diesel.rs/diesel/query_dsl/trait.RunQueryDsl.html#method.load)之类的方法。 由于此查询具有返回类型，因此我们将实现[Query](http://docs.diesel.rs/diesel/query_builder/trait.Query.html)，该Query还指出了返回类型。

src/pagination.rs

```rust
impl_query_id!(Paginated<T>);

impl<T: Query> Query for Paginated<T> {
    type SqlType = (T::SqlType, BigInt);
}

impl<T> RunQueryDsl<PgConnection> for Paginated<T> {}
```

现在我们已经实现了所有这些功能，让我们来看看我们将如何构建它。 我们要为所有Diesel查询添加一个`paginate`方法，它指定我们所在的页面，以及指定每页元素数量的`per_page`方法。

为了向现有类型添加新方法，我们可以使用trait。

src/pagination.rs

```rust
pub trait Paginate: AsQuery + Sized {
    fn paginate(self, page: i64) -> Paginated<Self::Query> {
        Paginated {
            query: self.as_query(),
            page,
            per_page: DEFAULT_PER_PAGE,
         }
    }
}

impl<T: AsQuery> Paginate for T {}

const DEFAULT_PER_PAGE: i64 = 10;

pub struct Paginated<T> {
    query: T,
    page: i64,
    per_page: i64,
}

impl Paginated<T> {
    pub fn per_page(self, per_page: i64) -> Self {
        Paginated { per_page, ..self }
    }
}
```

现在我们可以获得每页25个元素的查询的第三页，如下所示：

```bash
users::table
    .paginate(3)
    .per_page(25)
```

使用此代码，我们可以将任何查询加载到`Vec <（T，i64）>`中，但我们可以做得更好。 在进行分页时，通常需要记录和总页数。 我们可以写出那种方法。

src/pagination.rs

```rust
impl<T> Paginated<T> {
    fn load_and_count_pages<U>(self, conn: &PgConnection) -> QueryResult<(Vec<U>, i64)
    where
        Self: LoadQuery<PgConnection, (U, i64)>,
    {
        let per_page = self.per_page;
        let results = self.load::<(U, i64)>(conn)?;
        let total = results.get(0).map(|(_, total) total|).unwrap_or(0);
        let records = results.into_iter().map(|(record, _)| record).collect();
        let total_pages = (total as f64 / per_page as f64).ceil() as i64;
        Ok((records, total_pages))
    }
}
```

这是我们想要定义一个连接函数的罕见情况之一。 以这种方式定义函数的一个好处是，如果我们想要支持除PostgreSQL之外的后端，我们可以让这个函数执行两个查询。

您可以在[“高级博客”](https://github.com/diesel-rs/diesel/tree/v1.3.0/examples/postgres/advanced-blog-cli)示例中找到此示例的完整代码。

## 自定义操作

如果您要向Diesel添加对新类型的支持，或者使用支持不完全的类型，您可能希望添加对与该类型相关联的运算符的支持。 术语运算符指的是使用以下语法之一的任何内容：

* 中缀（例如`left OP right`）
* 前缀（例如`OP expr`）
* 后缀（例如`expr OP`）

Diesel提供辅助宏来定义这些类型的运算符。事实上，Diesel使用这些宏来声明几乎所有主箱支持的运营商。宏是[diesel_infix_operator！](http://docs.diesel.rs/diesel/macro.diesel_infix_operator.html)，[diesel_postfix_operator！](http://docs.diesel.rs/diesel/macro.diesel_postfix_operator.html)和[diesel_prefix_operator！](http://docs.diesel.rs/diesel/macro.diesel_prefix_operator.html)

所有这些宏都具有相同的签名。他们需要两到四个论点。

第一个是要表示此运算符的结构的名称。

第二个是此运算符的实际SQL。

第三个参数是可选的，并且是运算符的SQL类型。如果未指定SQL类型，则默认为`Bool`。您还可以传递“magic”类型`ReturnBasedOnArgs`，这将导致SQL类型与其参数的类型相同。 Diesel使用它来生成字符串连接运算符`||`如果参数可以为空，则返回`Nullable <Text>`;如果不为null，则返回`Text`。

第四个参数（如果未指定SQL类型，则为第三个参数）是此运算符用于的后端。如果未指定后端，则可以在所有后端上使用该运算符。

让我们看一下Diesel的一些示例用法：

```rust
// A simple operator. It returns `Bool` and works on all backends.
diesel_infix_operator!(Eq, " = ");

// Here we've specified the SQL type.
// Since this operator is only used for ordering, and we don't want it used
// elsewhere, we've made it `()` which is normally useless.
diesel_postfix_operator!(Asc, " ASC", ());

// Concat uses the magic `ReturnBasedOnArgs` return type
// so it can work with both `Text` and `Nullable<Text>`.
diesel_infix_operator!(Concat, " || ", ReturnBasedOnArgs);

// This operator is PG specific, so we specify the backend
diesel_infix_operator!(IsDistinctFrom, " IS DISTINCT FROM ", backend: Pg);

// This operator is PG specific, and we are also specifying the SQL type.
diesel_postfix_operator!(NullsFirst, " NULLS FIRST", (), backend: Pg);
```

Diesel提供了一个概念验证板，显示了如何添加名为`diesel_full_text_search`的新SQL类型。 这些是在该箱子中定义的运营商。 您会注意到所有运算符都指定了后端，其中许多都指定了返回类型。

```rust
diesel_infix_operator!(Matches, " @@ ", backend: Pg);
diesel_infix_operator!(Concat, " || ", TsVector, backend: Pg);
diesel_infix_operator!(And, " && ", TsQuery, backend: Pg);
diesel_infix_operator!(Or, " || ", TsQuery, backend: Pg);
diesel_infix_operator!(Contains, " @> ", backend: Pg);
diesel_infix_operator!(ContainedBy, " <@ ", backend: Pg);
```

但是，仅仅声明运算符本身并不是很有用。 这将创建Diesel查询构建器所需的类型，但不提供任何帮助在实际代码中使用运算符的内容。 这些宏创建的结构将有一个`new`方法，但这通常不是你如何使用Diesel的查询构建器。

* 中缀运算符通常是左侧的方法。
* 后缀运算符通常是表达式上的方法。
* 前缀运算符通常是裸函数。

对于使用方法创建的运算符，通常会为此创建特征。 例如，以下是Diesel定义`.eq`方法的方法。

```rust
pub trait ExpressionMethods: Expression + Sized {
    fn eq<T: AsExpression<Self::SqlType>>(self, other: T) -> Eq<Self, T::Expression> {
        Eq::new(self, other.as_expression())
    }
}

impl<T: Expression> ExpressionMethods for T {}

```

重要的是要注意这些方法是应该放置任何类型约束的地方。 由`diesel_*_operator!`运算符定义的结构不知道或不关心论证的类型应该是什么。 `=`运算符要求两边都是相同的类型，所以我们用`ExpressionMethods :: eq`的类型表示。

您还会注意到我们的参数是`AsExpression <Self :: SqlType>`，而不是`Expression <SqlType = Self :: SqlType>`。 这允许传递Rust值以及Diesel表达式。 例如，我们可以执行`text_col.eq（other_text_col）或text_col.eq（“Some Rust string”）`。

如果运算符仅特定于一种SQL类型，我们可以在我们的特征中表示它。

```rust
pub trait BoolExpressionMethods
where
    Self: Expression<SqlType = Bool> + Sized,
{
    fn and<T: AsExpression<Bool>>(self, other: T) -> And<Self, T::Expression> {
        And::new(self, other.as_expression())
    }
}

impl<T: Expression<SqlType = Bool>> BoolExpressionMethods for T {}
```

前缀运算符通常定义为裸函数。 代码非常相似，但没有特性。 以下是Diesel中`not`定义的方法。

```rust
pub fn not<T: AsExpression<Bool>>(expr: T)
    -> Not<Grouped<T::Expression>>
{
    super::operators::Not::new(Grouped(expr.as_expression()))
}
```

在这种情况下，我们使用`Grouped`（目前在Diesel中未记录，仅在内部使用）在我们的参数周围添加括号。 这可确保SQL中的运算符优先级与预期的匹配。 例如，我们希望`not（true.and（false））`返回`true`。 但是`SELECT NOT TRUE AND FALSE`返回`FALSE`。 Diesel与`.o`r做同样的事情。

为方法公开“辅助类型”也是最佳做法，它与方法本身进行相同的类型转换。 没有人想把`Eq <text_col，<＆str写成AsExpression <Text >> :: Expression>`。 相反，我们提供了一种类型，允许您编写`Eq <text_col，＆str>`。

```rust
pub type Eq<Lhs, Rhs> =
    super::operators::Eq<Lhs, AsExpr<Rhs, Lhs>>;
```

要定义这些类型，通常需要使用[SqlTypeOf](http://docs.diesel.rs/diesel/helper_types/type.SqlTypeOf.html)，[AsExpr](http://docs.diesel.rs/diesel/helper_types/type.AsExpr.html)和[AsExprOf](http://docs.diesel.rs/diesel/helper_types/type.AsExprOf.html)。
