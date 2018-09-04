# Fmt

Rust的Fmt核心组成的宏和trait:`format!`、`format_arg!`、`print!`、`println!`、`write!`;`Debug`、`Display`。

```rust
fn main() {
    let building = format!("{1}有{0:>0width$}米宽，{height:?}米高",
                    220, "大厦", width=4, height=666);
    print!("{}", building);
}
```

* format！：将格式化文本写入String
* print！：格式相同！ 但是文本被打印到控制台（io :: stdout）。
* println !:和print一样！ 但附加换行符。
* eprint !:格式相同！ 但文本打印到标准错误（io :: stderr）。
* eprintln !:与eprint相同！但附加了换行符。

std :: fmt包含许多控制文本显示的特征。 所有标准库的类型都实现两个重要的基本`trait`:`fmt :: Debug`与`fmt :: Display`,对于任何非通用的新类型 都可以自己手动实现fmt::Display：

* fmt :: Debug：使用{：？}标记。 格式化文本以进行调试,Rust也提供“漂亮打印” {:#?}.
* fmt :: Display：使用{}标记。 以更优雅，用户友好的方式格式化文本。

```rust
use std::fmt; // Import `fmt`

// A structure holding two numbers. `Debug` will be derived so the results can
// be contrasted with `Display`.
#[derive(Debug)]
struct MinMax(i64, i64);

// Implement `Display` for `MinMax`.
impl fmt::Display for MinMax {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        // Use `self.number` to refer to each positional data point.
        write!(f, "({}, {})", self.0, self.1)
    }
}

// Define a structure where the fields are nameable for comparison.
#[derive(Debug)]
struct Point2D {
    x: f64,
    y: f64,
}

// Similarly, implement for Point2D
impl fmt::Display for Point2D {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        // Customize so only `x` and `y` are denoted.
        write!(f, "x: {}, y: {}", self.x, self.y)
    }
}

fn main() {
    let minmax = MinMax(0, 14);

    println!("Compare structures:");
    println!("Display: {}", minmax);
    println!("Debug: {:?}", minmax);

    let big_range =   MinMax(-300, 300);
    let small_range = MinMax(-3, 3);

    println!("The big range is {big} and the small is {small}",
             small = small_range,
             big = big_range);

    let point = Point2D { x: 3.3, y: 7.2 };

    println!("Compare points:");
    println!("Display: {}", point);
    println!("Debug: {:?}", point);

    // Error. Both `Debug` and `Display` were implemented but `{:b}`
    // requires `fmt::Binary` to be implemented. This will not work.
    // println!("What does Point2D look like in binary: {:b}?", point);
}
```

## 格式化

`format!`宏调用的时候参数可以是任意类型，可以position参数和key-value参数混合使用的。但是key-value的值只能出现在position值之后并且不占position。关于参数规则就是，参数类型必须要实现 `std::fmt` mod 下的某些trait。比如我们看到原生类型大部分都实现了`Display`和`Debug`这两个宏，其中整数类型还会额外实现一个`Binary`，等等。可以通过 `{:type}`的方式去调用这些参数。type这个地方为空的话默认调用的是`Display`这个trait。

```rust
format!("{:b}", 2);
// 调用 `Binary` trait
// Get : 10
format!("{:?}", "Hello");
// 调用 `Debug`
// Get : "Hello"
```

从上面的`{0:>0width$}`来分析,首先`>`是一个语义，它表示的是生成的字符串向右对齐。与之相对的还有`<`(向左对齐)和`^`(居中)。再接下来`0`是一种特殊的填充语法，他表示用0补齐数字的空位，要注意的是，当0作用于负数的时候，

在width和type之间会有一个叫精度的区域（可以省略不写），他们的表示通常是以`.`开始的，比如`.4`表示小数点后四位精度。最让人遭心的是，你仍然可以在这个位置引用参数，只需要和上面width一样，用`.N$`来表示一个position的参数，但是就是不能引用key-value类型的。这一位有一个特殊用法，那就是`.*`，它不表示一个值，而是表示两个值！第一个值表示精确的位数，第二个值表示这个值本身。这是一种很尴尬的用法，而且极度容易匹配到其他参数。因此，我建议在各位能力或者时间不欠缺的时候尽量把格式化表达式用标准的形式写的清楚明白。尤其在面对一个复杂的格式化字符串的时候。

```rust
format_string := <text> [ maybe-format <text> ] *
maybe-format := '{' '{' | '}' '}' | <format>
format := '{' [ argument ] [ ':' format_spec ] '}'
argument := integer | identifier

format_spec := [[fill]align][sign]['#']['0'][width]['.' precision][type]
fill := character
align := '<' | '^' | '>'
sign := '+' | '-'
width := count
precision := count | '*'
type := identifier | '?' | ''
count := parameter | integer
parameter := argument '$'
```