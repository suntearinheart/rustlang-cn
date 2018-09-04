# 迭代器

迭代器模式允许您依次对一系列项执行某些任务,迭代器是惰性的

Production           | Syntax      | Type                       | Range
---------------------|-------------|----------------------------|----------------
RangeExpr            | start..end  | std::ops::Range            | start ≤ x < end
RangeFromExpr        | start..     | std::ops::RangeFrom        | start ≤ x
RangeToExpr          | ..end       | std::ops::RangeTo          | x < end
RangeFullExpr        | ..          | std::ops::RangeFull        | -
RangeInclusiveExpr   | start..=end | std::ops::RangeInclusive   | start ≤ x ≤ end
RangeToInclusiveExpr | ..=end      | std::ops::RangeToInclusive | x ≤ end

首先，我们知道Rust有一个`for`循环能够依次对迭代器的任意元素进行访问，即：

```rust
for i in 1..10 {
    println!("{}", i);
}
```

这里我们知道， (1..10) 其本身是一个迭代器，我们能对这个迭代器调用 `.next()` 方法，因此，`for`循环就能完整的遍历一个循环。
而对于`Vec`来说：

```rust
let values = vec![1,2,3];
for x in values {
    println!("{}", x);
}
```

在上面的代码中，我们并没有显式地将一个`Vec`转换成一个迭代器，那么它是如何工作的呢？现在就打开标准库翻api的同学可能发现了,`Vec`本身并没有实现 `Iterator` ，也就是说，你无法对`Vec`本身调用 `.next()` 方法。但是，我们在搜索的时候，发现了`Vec`实现了 `IntoIterator` 的 trait。

其实，`for`循环真正循环的，并不是一个迭代器(Iterator)，真正在这个语法糖里起作用的，是 `IntoIterator` 这个 trait。

因此，上面的代码可以被展开成如下的等效代码(只是示意，不保证编译成功):

```rust
let values = vec![1, 2, 3];

{
    let result = match IntoIterator::into_iter(values) {
        mut iter => loop {
            match iter.next() {
                Some(x) => { println!("{}", x); },
                None => break,
            }
        },
    };
    result
}
```

在这个代码里，我们首先对`Vec`调用 `into_iter` 来判断其是否能被转换成一个迭代器，如果能，则进行迭代。

那么，迭代器自己怎么办？

为此，Rust在标准库里提供了一个实现：

```rust
impl<I: Iterator> IntoIterator for I {
    // ...
}
```

也就是说，Rust为所有的迭代器默认的实现了 `IntoIterator`，这个实现很简单，就是每次返回自己就好了。

也就是说：

任意一个 `Iterator` 都可以被用在 `for` 循环上！

### 迭代器trait和`next`方法

```rust
trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;

    // methods with default implementations elided
}
```

```rust
    let v1 = vec![1, 2, 3];

    let mut v1_iter = v1.iter();

    assert_eq!(v1_iter.next(), Some(&1));
    assert_eq!(v1_iter.next(), Some(&2));
    assert_eq!(v1_iter.next(), Some(&3));
    assert_eq!(v1_iter.next(), None);
```

### 无限迭代器

Rust支持通过省略高位的形式生成一个无限长度的自增序列，即：

```rust
let inf_seq = (1..).into_iter();
```

不过不用担心这个无限增长的序列撑爆你的内存，占用你的CPU，因为适配器的惰性的特性，它本身是安全的，除非你对这个序列进行`collect`或者`fold`！

相关的3类事物：迭代器，*迭代适配器*（*iterator adapters*）和*消费者*（*consumers*）。下面是一些定义：

* 迭代器给你一个值的序列
* 迭代适配器操作迭代器，产生一个不同输出序列的新迭代器
* 消费者操作迭代器，产生最终值的集合

## 消费者与适配器

我们大致弄清楚了 `Iterator` 和 `IntoIterator` 之间的关系。下面我们来说一说消费者和适配器。

消费者是迭代器上一种特殊的操作，其主要作用就是将迭代器转换成其他类型的值，而非另一个迭代器。

而适配器，则是对迭代器进行遍历，并且其生成的结果是另一个迭代器，可以被链式调用直接调用下去。

由上面的推论我们可以得出: *迭代器其实也是一种适配器！*

### 消费者

迭代器负责生产，消费者则负责将生产出来的东西最终做一个转化。一个典型的消费者就是`collect`。前面我们写过`collect`的相关操作，它负责将迭代器里面的所有数据取出，例如下面的操作：

```rust
let v = (1..20).collect(); //编译通不过的！
```

尝试运行上面的代码，却发现编译器并不让你通过。因为你没指定类型！原来collect只知道将迭代器收集到一个实现了 `FromIterator` 的类型中去，但是，事实上实现这个 trait 的类型有很多（Vec, HashMap等），因此，collect没有一个上下文来判断应该将v按照什么样的方式收集！！

要解决这个问题，我们有两种解决办法：

1. 显式地标明`v`的类型:

    ```rust
    let v: Vec<_> = (1..20).collect();
    ```

2. 显式地指定`collect`调用时的类型：

    ```rust
    let v = (1..20).collect::<Vec<_>>();
    ```

当然，一个迭代器中还存在其他的消费者，比如取第几个值所用的 `.nth()`函数，还有用来查找值的 `.find()` 函数，调用下一个值的`next()`函数等等，下面另一个比较常用的消费者—— `fold` ,它需要两个参数：第一个参数叫做*基数*（*base*）。第二个是一个闭包，它自己也需要两个参数：第一个叫做*累计数*（*accumulator*），第二个叫*元素*（*element*）。每次迭代，这个闭包都会被调用，返回值是下一次迭代的累计数。在我们的第一次迭代，基数是累计数。

| 基数 | 累计数      | 元素    | 闭包结果       |
|------|-------------|---------|----------------|
| 0    | 0           | 1       | 1              |
| 0    | 1           | 2       | 3              |
| 0    | 3           | 3       | 6              |

`fold`函数的形式如下：

```rust
fold(base, |accumulator, element| .. )
```

我们可以写成如下例子：

```rust
let m = (1..20).fold(1u64, |mul, x| mul*x);
```

需要注意的是，`fold`的输出结果的类型，最终是和`base`的类型是一致的（如果`base`的类型没指定，那么可以根据前面`m`的类型进行反推，除非`m`的类型也未指定），也就是说，一旦我们将上面代码中的`base`从 `1u64` 改成 `1`，那么这行代码最终将会因为数据溢出而崩溃！

不过这还有其它的消费者。`find()`就是一个：

```rust
let greater_than_forty_two = (0..100)
                             .find(|x| *x > 42);

match greater_than_forty_two {
    Some(_) => println!("Found a match!"),
    None => println!("No match found :("),
}
```

`find`接收一个闭包，然后处理迭代器中每个元素的引用。如果这个元素是我们要找的，那么这个闭包返回`true`，如果不是就返回`false`。因为我们可能不能找到任何元素，所以`find`返回`Option`而不是元素本身。

### 适配器

我们所熟知的生产消费的模型里，生产者所生产的东西不一定都会被消费者买账，因此，需要对原有的产品进行再组装。这个再组装的过程，就是适配器。因为适配器返回的是一个新的迭代器，所以可以直接用链式请求一直写下去。

### map和filter

适配器获取一个迭代器然后按某种方法修改它，并产生一个新的迭代器。最简单的是一个是`map`：

```rust
(1..20).map(|x| x+1);
```

上面的代码展示了一个“迭代器所有元素的自加一”操作，但是，如果你尝试编译这段代码，编译器会给你提示：

```rust
warning: unused result which must be used: iterator adaptors are lazy and
         do nothing unless consumed, #[warn(unused_must_use)] on by default
(1..20).map(|x| x + 1);
 ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

所有的适配器，都是惰性求值的！**也就是说，除非你调用一个消费者，不然，你的操作，永远也不会被调用到！**

`filter()`接受一个闭包函数，返回一个布尔值，返回`true`的时候表示保留，`false`丢弃。

```rust
let v: Vec<_> = (1..20)
                .filter(|&x| x%2 == 0)
                .filter(|&x| x % 3 == 0)
                .take(1)
                .collect();
```

### skip和take

`take(n)`的作用是取前`n`个元素，而`skip(n)`正好相反，跳过前`n`个元素。

```rust
let v = vec![1, 2, 3, 4, 5, 6];
let v_take = v.iter()
    .cloned()
    .take(2)
    .collect::<Vec<_>>();
assert_eq!(v_take, vec![1, 2]);

let v_skip: Vec<_> = v.iter()
    .cloned()
    .skip(2)
    .collect();
assert_eq!(v_skip, vec![3, 4, 5, 6]);
```

### zip 和 enumerate

`zip`是一个适配器，他的作用就是将两个迭代器的内容压缩到一起，形成 `Iterator<Item=(ValueFromA, ValueFromB)>` 这样的新的迭代器；

```rust
let names = vec!["WaySLOG", "Mike", "Elton"];
let scores = vec![60, 80, 100];
let score_map: HashMap<_, _> = names.iter()
    .zip(scores.iter())
    .collect();
println!("{:?}", score_map);
```

而`enumerate`就是把迭代器的下标显示出来：

```rust
let v = vec![1u64, 2, 3, 4, 5, 6];
let val = v.iter()
    .enumerate()
    // 迭代生成标，并且每两个元素剔除一个
    .filter(|&(idx, _)| idx % 2 == 0)
    // 将下标去除,如果调用unzip获得最后结果的话，可以调用下面这句，终止链式调用
    // .unzip::<_,_, vec<_>, vec<_>>().1
    .map(|(idx, val)| val)
    // 累加 1+3+5 = 9
    .fold(0u64, |sum, acm| sum + acm);

println!("{}", val);
```

### 一系列查找函数

Rust的迭代器有一系列的查找函数，比如：

* `find()`: 传入一个闭包函数，从开头到结尾依次查找能令这个闭包返回`true`的第一个元素，返回`Option<Item>`
* `position()`: 类似`find`函数，不过这次输出的是`Option<usize>`，第几个元素。
* `all()`: 传入一个函数，如果对于任意一个元素，调用这个函数返回`false`,则整个表达式返回`false`，否则返回`true`
* `any()`: 类似`all()`，不过这次是任何一个返回`true`，则整个表达式返回`true`，否则`false`
* `max()`和`min()`: 查找整个迭代器里所有元素，返回最大或最小值的元素。`max`和`min`作用在浮点数上会有不符合预期的结果。

## 用`Iterator` trait创建自己的迭代器

可以通过在`Vec`上调用`iter`，`into_iter`或`iter_mut`来创建迭代器。 您可以从标准库中的其他集合类型创建迭代器，例如哈希映射。 您还可以通过在自己的类型上实现`Iterator`特征来创建可以执行任何操作的迭代器。 如前所述，您需要提供定义的唯一方法是下一个方法。 完成后，您可以使用具有`Iterator`特性提供的默认实现的所有其他方法！

```rust
struct Counter {
    count: u32,
}

impl Counter {
    fn new() -> Counter {
        Counter { count: 0 }
    }
}

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        self.count += 1;

        if self.count < 6 {
            Some(self.count)
        } else {
            None
        }
    }
}

fn main() {
    let mut counter = Counter::new();

    assert_eq!(counter.next(), Some(1));
    assert_eq!(counter.next(), Some(2));
    assert_eq!(counter.next(), Some(3));
    assert_eq!(counter.next(), Some(4));
    assert_eq!(counter.next(), Some(5));
    assert_eq!(counter.next(), None);
}
```

要确定是使用`for`循环还是迭代器，您需要知道哪个版本的search函数更快,你可以毫无畏惧地使用迭代器和闭包！不会对运行时性能造成损失。