# HashMap

最常见的集合是哈希映射。该类型HashMap<K, V> 存储类型的键到类型K值的映射V。它通过散列函数完成此操作， 散列函数确定将这些键和值放入内存的方式。

```rust
//============创建：
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

//方式二
#![allow(unused_variables)]
fn main() {
use std::collections::HashMap;

let teams  = vec![String::from("Blue"), String::from("Yellow")];
let initial_scores = vec![10, 50];

let scores: HashMap<_, _> = teams.iter().zip(initial_scores.iter()).collect();
}

//==============访问： get 方法
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

let team_name = String::from("Blue");
let score = scores.get(&team_name);
//方式二
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

for (key, value) in &scores {
    println!("{}: {}", key, value);
}
//==============更新
//方式一： 覆盖值
use std::collections::HashMap;

let mut scores = HashMap::new();

scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Blue"), 25);

println!("{:?}", scores);
//方式二：仅在键没有值时插入值
//通常检查特定键是否具有值，如果不具有，则为其插入值。 散列映射为此被调用条目提供了一个特//殊的API，它将您要检查的键作为参数。 entry函数的返回值是一个名为Entry的枚举，表示可能存//在或可能不存在的值。

#![allow(unused_variables)]
fn main() {
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);

scores.entry(String::from("Yellow")).or_insert(50);
scores.entry(String::from("Blue")).or_insert(50);

println!("{:?}", scores);
}
//方式三：基于旧值更新值，常见用例是查找键的值，然后根据旧值更新它

#![allow(unused_variables)]
fn main() {
use std::collections::HashMap;

let text = "hello world wonderful world";

let mut map = HashMap::new();

for word in text.split_whitespace() {
    let count = map.entry(word).or_insert(0);
    *count += 1;
}

println!("{:?}", map);
}

//===============删除： 根据key删除元素
come_from.remove("Mike");
println!("Mike猫的家乡不是火锅！不是火锅！不是火锅！虽然好吃！");
```

## 哈希函数

默认情况下，HashMap使用加密安全散列函数，可以抵御拒绝服务（DoS）攻击。 这不是最快的哈希算法，但是随着性能下降而带来更好的安全性的权衡是值得的。 如果您对代码进行概要分析并发现默认哈希函数对于您的目的而言太慢，则可以通过指定其他哈希来切换到另一个函数。 hasher是一种实现BuildHasher特征的类型。

HashMap 不保证键的順序，依其鍵/值对来访问，

```rust
use std::collections::HashMap;

fn main() {
    let mut hash = HashMap::new();

    hash.insert("one", "eins");
    hash.insert("two", "zwei");
    hash.insert("three", "drei");

    // Iterate the hash by key
    for k in hash.keys() {
        println!("{} => {}", k, *hash.get(k).unwrap());
    }
}
```

```rust
use std::collections::HashMap;

fn main() {
    let mut hash = HashMap::new();

    hash.insert("one", "eins");
    hash.insert("two", "zwei");
    hash.insert("three", "drei");

    // Iterate the hash by (key, value) pair
    for (k, v) in hash.iter() {
        println!("{} => {}", k, *v);
    }
}
```

也可依其值来访问，要注意的是，只能由鍵推得值，无法由值推得鍵。鍵是唯一的，但值可以重复。

```rust
use std::collections::HashMap;

fn main() {
    let mut hash = HashMap::new();

    hash.insert("one", "eins");
    hash.insert("two", "zwei");
    hash.insert("three", "drei");

    // Iterate the hash by value
    for v in hash.values() {
        println!("{}", *v);
    }
}
```


