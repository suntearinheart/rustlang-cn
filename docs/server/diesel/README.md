# Diesel

Diesel是Rust的安全，可扩展的ORM和查询生成器
Diesel是与Rust中数据库交互的最有效方式，因为它对查询的安全和可组合抽象。

## 为何创造Diesel
### 1：防止运行时错误
我们不想浪费时间追踪运行时错误。 我们通过让Diesel消除编译时不正确的数据库交互的可能性来实现这一目标。

### 2：专为性能而打造
Diesel提供了一个高级查询构建器，让您可以考虑Rust中的问题，而不是SQL。 我们专注于零成本抽象，使Diesel能够以比C更快的速度运行查询并加载数据。

### 3：富有成效和可扩展性
与Active Record和其他ORM不同，Diesel旨在被抽象化。 Diesel使您能够编写可重用的代码并根据问题域而不是SQL进行思考。

## 示例

### 简单的查询
1. 简单的查询是一件轻而易举的事。 从数据库加载所有用户：

rust代码：
```rust
users::table.load(&connection)
```
生成SQL：
```sql
SELECT * FROM users;
```
2. 加载用户的所有帖子：

rust代码：
```rust
Post::belonging_to(user).load(&connection)
```
生成SQL：
```sql
SELECT * FROM posts WHERE user_id = 1;
```

### 复杂查询
Diesel强大的查询构建器可帮助您以0的成本构建简单或复杂的查询。

rust代码：
```rust
let versions = Version::belonging_to(krate)
  .select(id)
  .order(num.desc())
  .limit(5);
let downloads = try!(version_downloads
  .filter(date.gt(now - 90.days()))
  .filter(version_id.eq(any(versions)))
  .order(date)
  .load::<Download>(&conn));
```
生成SQL：
```sql
SELECT version_downloads.*
  WHERE date > (NOW() - '90 days')
    AND version_id = ANY(
      SELECT id FROM versions
        WHERE crate_id = 1
        ORDER BY num DESC
        LIMIT 5
    )
  ORDER BY date
```

### 更少样板

Diesel codegen为您生成样板。 它使您可以专注于业务逻辑，而不是映射到SQL行和从SQL行映射。

这意味着你可以这样写：

```rust
#[derive(Queryable)]
pub struct Download {
    id: i32,
    version_id: i32,
    downloads: i32,
    counted: i32,
    date: SystemTime,
}
```
而不用这样写
```rust
pub struct Download {
    id: i32,
    version_id: i32,
    downloads: i32,
    counted: i32,
    date: SystemTime,
}

impl Download {
    fn from_row(row: &Row) -> Download {
        Download {
            id: row.get("id"),
            version_id: row.get("version_id"),
            downloads: row.get("downloads"),
            counted: row.get("counted"),
            date: row.get("date"),
        }
    }
}
```
### 插入数据
1. 这不仅仅是阅读数据。 diesel使结构易于使用新记录。

rust代码：
```rust
#[derive(Insertable)]
#[table_name="users"]
struct NewUser<'a> {
    name: &'a str,
    hair_color: Option<&'a str>,
}

let new_users = vec![
    NewUser { name: "Sean", hair_color: Some("Black") },
    NewUser { name: "Gordon", hair_color: None },
];

insert_into(users)
    .values(&new_users)
    .execute(&connection);
```
生成SQL：
```sql
INSERT INTO users (name, hair_color) VALUES
  ('Sean', 'Black'),
  ('Gordon', DEFAULT)
```
2. 如果您需要你插入行的数据，只需将`execute`更改为`get_result`或`get_results`。 diesel将负责其余的工作。

rust代码：
```rust
let new_users = vec![
    NewUser { name: "Sean", hair_color: Some("Black") },
    NewUser { name: "Gordon", hair_color: None },
];

let inserted_users = insert_into(users)
    .values(&new_users)
    .get_results::<User>(&connection);
```
生成SQL：
```sql
INSERT INTO users (name, hair_color) VALUES
  ('Sean', 'Black'),
  ('Gordon', DEFAULT)
  RETURNING *
```
### 更新数据

Diesel的codegen可以生成多种更新行的方法，让您以对应用程序有意义的方式封装逻辑。

修改结构
```rust
post.published = true;
post.save_changes(&connection);
```
一次性批量更改SQL
```sql
update(users.filter(email.like("%@spammer.com")))
    .set(banned.eq(true))
    .execute(&connection)
```
使用结构进行封装SQL
```sql
update(Settings::belonging_to(current_user))
    .set(&settings_form)
    .execute(&connection)
```
### 符合人体工程学的原始SQL
总会有某些查询更容易编写为原始SQL，或者无法使用查询构建器表示。 即使在这些情况下，Diesel也提供了一个易于使用的API来编写原始SQL。

```rust
#[derive(QueryableByName)]
#[table_name = "users"]
struct User {
    id: i32,
    name: String,
    organization_id: i32,
}

// Using `include_str!` allows us to keep the SQL in a
// separate file, where our editor can give us SQL specific
// syntax highlighting.
sql_query(include_str!("complex_users_by_organization.sql"))
    .bind::<Integer, _>(organization_id)
    .bind::<BigInt, _>(offset)
    .bind::<BigInt, _>(limit)
    .load::<User>(conn)?;
```