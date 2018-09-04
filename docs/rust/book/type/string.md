# 字符串

一个字符串是一串UTF-8字节编码的Unicode值的集合。Rust字符串内部存储的是一个u8数组,另外，字符串并不以null结尾并且可以包含null字节。Rust有两种主要的字符串类型：`&str`和`String`.

```rust
let greeting = "Hello there."; // greeting: &'static str
```

`"Hello there."`是一个字符串常量而它的类型是`&'static str`。字符串常量是静态分配的字符串切片，也就是说它储存在我们编译好的程序中，并且整个程序的运行过程中一直存在。这个`greeting`绑定了一个静态分配的字符串的引用。任何接受一个字符串切片的函数也接受一个字符串常量。

字符串常量可以跨多行。第一种会换行且保留空格：

```rust
let s = "foo
    bar";

assert_eq!("foo\n        bar", s);
```

第二种，带有`\`，不换行会去掉空格：

```rust
let s = "foo\
    bar";

assert_eq!("foobar", s);
```

第三种，带有`\n\`，会换行且去掉空格：

```rust
let s = "foo\n\
    bar";

assert_eq!("foo\nbar", s);
```

## String

`String`是在堆上分配的字符串,是一个`Vec<u8>`包装器,这个字符串可以增长，并且也保证是UTF-8编码的。`String`通常通过一个字符串片段调用`to_string`方法转换而来。

```rust
//创建
let mut s1 = String::new();                 //方式一
let s2 = String::from("initial contents");  //方式二
let mut s = "Hello".to_string();            //方式三

println!("{}", s);
//更新
s.push_str(", world.");
println!("{}", s);
```

`String`可以通过一个`&`强制转换为`&str`：

```rust
fn takes_slice(slice: &str) {
    println!("Got: {}", slice);
}

fn main() {
    let s = "Hello".to_string();
    takes_slice(&s);
}
```

## 索引

因为字符串是有效UTF-8编码的，它不支持索引：

```rust
let s = String::from("hello");

println!("The first letter of s is {}", s[0]); // ERROR!!!
```

通常，用`[]`访问一个数组是非常快的。不过，字符串中每个UTF-8编码的字符可以是多个字节，你必须遍历字符串来找到字符串的第N个字符。这个操作的代价相当高，我们可以选择把字符串看作一个串独立的字节，或者代码点（codepoints）：

```rust
let hachiko = "忠犬ハチ公";

for b in hachiko.as_bytes() {
    print!("{}, ", b);
}

println!("");

for c in hachiko.chars() {
    print!("{}, ", c);
}

println!("");
```

这会打印出：

```text
229, 191, 160, 231, 138, 172, 227, 131, 143, 227, 131, 129, 229, 133, 172,
忠, 犬, ハ, チ, 公,
```

如你所见，这有比`char`更多的字节。

你可以这样来获取跟索引相似的东西：

```rust
# let hachiko = "忠犬ハチ公";
let dog = hachiko.chars().nth(1);               // kinda like hachiko[1]
let len1 = String::from("Hola").len();          //len将是4
let len2 = String::from("Здравствуйте").len();  //len将是24
```

这强调了我们不得不遍历整个`char`的列表。

如果想要得到單一的字元，需用 chars 方法，會得到走訪字元的迭代器。

```rust
fn main() {
    assert_eq!("你好，麥可".chars().nth(1).unwrap(), '好');
}
```

你可以使用切片语法来获取一个字符串的切片：

```rust
let dog = "hachiko";
let hachi = &dog[0..5];
```

注意这里是*字节*偏移，而不是*字符*偏移。所以如下代码在运行时会失败：

```rust
let dog = "忠犬ハチ公";
let hachi = &dog[0..2];
```

给出如下错误：

```text
thread '<main>' panicked at 'index 0 and/or 2 in `忠犬ハチ公` do not lie on
character boundary'
```

关于UTF-8的另一点是，从Rust的角度来看，实际上有三种相关的方法来查看字符串：字节，标量值和字形集群（最接近我们称之为字母的字符串）。

如果我们查看用梵文脚本编写的印地语单词“नमस्ते”，它将被存储为u8值的向量，如下所示：

```text
[224, 164, 168, 224, 164, 174, 224, 164, 184, 224, 165, 141, 224, 164, 164,
224, 165, 135]
```

这是18个字节，是计算机最终存储这些数据的方式。如果我们将它们视为Unicode标量值（这是Rust的char类型），那些字节看起来像这样：

```text
['न', 'म', 'स', '्', 'त', 'े']
```

这里有六个char值，但第四个和第六个不是字母：它们是变音符号，它们本身没有意义。最后，如果我们将它们视为字形簇，我们就会得到一个人称之为构成印地语单词的四个字母：

```text
["न", "म", "स्", "ते"]
```

Rust提供了不同的方法来解释计算机存储的原始字符串数据，这样每个程序都可以选择所需的解释，无论数据是什么样的人类语言。

Rust不允许我们索引到String以获取字符的最后一个原因是索引操作预计总是占用恒定时间（O（1））。 但是不能保证使用String的性能，因为Rust必须遍历从开头到索引的内容以确定有多少有效字符。

### 拼接字符串：(结果是String)

字串間可以用 + 相接，相接的方式是以 String 接 &str

这是因为`&String`可以自动转换为一个`&str`。这个功能叫做** `Deref`转换**。

```rust
let    hello      =  "Hello".to_string();        // String
let    hello_str  =  "Hello!";                 // &'static str
let    world      =  "World!".to_string();
let    world_str  =  "World!";
let    tom        =  "tom!".to_string();  
let    tom_str    =  "tom!";
let    lucy       =  "lucy!".to_string();  
let    lucy_str   =  "lucy!";
let    lilei      =  "lilei!".to_string();  
let    lilei_str  =  "lilei!";

let    hello_world  =  hello + world_str;
let    hello_world  =  hello + &world;
let    hello_world  =  hello + world_str + tom_str + lucy_str;
let    hello_world  =  hello + &world + &tom + &lucy;
let    hello_world  =  hello + hello_str + &world + world_str + tom_str + &tom + &lucy + &lilei + lucy_str + lilei_str;
```

## `format!`

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = format!("{}-{}-{}", s1, s2, s3);
```

## Slice String

索引到字符串通常是一个坏主意，因为不清楚字符串索引操作的返回类型应该是什么：字节值，字符，字形集群或字符串切片。 因此，如果您确实需要使用索引来创建字符串切片，Rust会要求您更具体。 要在索引中更具体并指示您需要字符串切片，而不是使用带有单个数字的[]进行索引，可以使用带有范围的[]来创建包含特定字节的字符串切片：

```rust
fn main() {
let hello = "Здравствуйте";

let s = &hello[0..4];
}
```

s将&str包含字符串的前4个字节: 'Зд'

如果我们使用&hello[0..1]会发生什么？答案：Rust会在运行时出现恐慌，就像在向量中访问无效索引一样,您应该谨慎使用范围来创建字符串切片，因为这样做会导致程序崩溃。

### 迭代字符串

如果需要对单个Unicode标量值执行操作，最好的方法是使用chars方法。 调用“नमस्ते”上的字符会分离并返回char类型的六个值，您可以迭代结果以访问每个元素：

```rust

#![allow(unused_variables)]
fn main() {
for c in "नमस्ते".chars() {
    println!("{}", c);
}
}
```

此代码将打印以下内容：

```text
न
म
स
्
त
े
```

bytes方法返回每个原始字节，这可能适合您：

```rust

#![allow(unused_variables)]
fn main() {
for b in "नमस्ते".bytes() {
    println!("{}", b);
}
}
```

此代码将打印组成此字符的18个字节String：

```text
224
164
// --snip--
165
135
```

但请务必记住，有效的Unicode标量值可能超过1个字节。