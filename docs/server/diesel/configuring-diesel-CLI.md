# 配置Diesel CLI

Diesel CLI是Diesel提供的可选工具，用于管理数据库模式。 它的两个主要角色是运行数据库迁移，以及创建表示数据库模式的Rust文件。

可以通过toml文件配置Diesel CLI的行为。 默认情况下，Diesel会在与`Cargo.toml`文件相同的目录中查找`diesel.toml`。 您可以通过设置`DIESEL_CONFIG_FILE`环境变量或在命令行上传递`--config-file`来提供不同的配置文件。 您可以通过运行`diesel setup`获得一些默认值的基本配置文件。

从Diesel 1.3开始，该文件包含一个部分`[print_schema]`。 此文件中的所有字段都是可选的。

## The `file` field

此字段指定希望架构的Rust表示生成的文件。 当此字段存在时，修改数据库模式的命令（例如`diesel migration run`）将自动运行`diesel print-schema`，并将其结果输出到此文件。

这意味着您可以修改数据库模式，而无需担心运行单独的命令来更新Rust代码。 强烈建议您使用此字段，以确保数据库模式的Rust表示始终与数据库中的实际内容同步。 通常，这设置为`src / schema.rs`。

与其他字段不同，这实际上并不会修改`diesel print-schema`的行为。 无论此字段是否存在，`diesel print-schema`都将始终将模式输出到stdout。

## The `with_docs` field

当此字段设置为`true`时，` diesel print-schema`将表现为默认情况下传递`--with-docs`标志。 这会对所有表和列放置doc注释。

## The `filter` field

该字段指定`diesel print-schema`应输出哪些表。 它对应于命令行上的`--only-tables`和`--except-tables`。 它的值应该是具有这两个键之一的映射。 例如：

diesel.toml

```toml
[print_schema]
# This will cause only the users and posts tables to be output
filter = { only_tables = ["users", "posts"] }

# This will cause all tables *except* the comments table to be
# output
filter = { except_tables = ["comments"] }
```

## The `schema` field

指定搜索表时要使用的模式。 设置后，`diesel print-schema`将始终表现为`--schema`已通过。 该字段仅影响PostgreSQL。 如果未提供任何值，则将搜索`public` schema。

## The `import_types` field

该字段将`use`语句添加到每个`table!`的顶部声明。 设置后`diesel print-schema`的行为就像传递了`--import-types`一样。 如果没有给出值，则只导入`diesel :: sql_types`中的类型。

diesel.toml

```toml
[print_schema]
# Add types from `diesel_full_text_search` like `tsvector`
import_types = ["diesel::sql_types::*", "diesel_full_text_search::types::*"]
```

## The `patch_file` field

指定生成后应用于模式的`.patch`文件。 对应于命令行上的`--patch-file`选项。 此选项需要在您的系统上安装diffutils的补丁。

我们无法为您可能要生成的此文件的每个可能的自定义提供选项。 这可用作架构自定义的通用功能。

该文件应该是统一的差异，您可以使用`diff`或`git diff`生成。 强烈建议您提供3个以上的上下文行，尤其是在您设置了import_types的情况下。

您可以通过对`schema.rs`进行更改，然后运行`git diff -U6> src / schema.patch`来轻松生成此文件。