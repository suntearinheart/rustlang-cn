# HashSet

集合 (set) 是一個數學上的概念，表示一群不重覆的無序物件,Rust 的 HashSet 內部的確是以 HashMap 來做為儲存資料的容器。雖然 HashSet 內部使用 HashMap，但簡化了介面，使用者不需要直接操作 HashMap。

```rust
use std::collections::HashSet;
 
fn main() {
    // Create an empty set
    let mut set = HashSet::new();
 
    // Insert item into the set
    set.insert("C++");
    set.insert("Java");
    set.insert("Python");
    set.insert("Rust");
    set.insert("Go");
 
    // Check the property of the set
    assert_eq!(set.len(), 5);
    assert_eq!(set.contains("Rust"), true);
    assert_eq!(set.contains("Lisp"), false);
 
    // Remove item from the set
    set.remove("Python");
 
    // Check the property of the set
    assert_eq!(set.len(), 4);
    assert_eq!(set.contains("Rust"), true);
    assert_eq!(set.contains("Python"), false);
}

```

集合可以實現一些集合論的二元操作，像是聯集 (unino)、交集 (intersection)、差集 (difference) 等。以下用實例展示這些操作：

```rust
use std::collections::HashSet;
 
fn main() {
    // Get two sets from two arrays
    let a: HashSet<_> = [1, 2, 3].iter().cloned().collect();
    let b: HashSet<_> = [4, 2, 3, 4].iter().cloned().collect();
 
    // Get the union of the two sets
    let union: HashSet<_> = a.union(&b).cloned().collect();
    assert_eq!(union, [1, 2, 3, 4].iter().cloned().collect());
 
    // Get the intersection of the two sets
    let intersection: HashSet<_> = a.intersection(&b).cloned().collect();
    assert_eq!(intersection, [2, 3].iter().cloned().collect());
 
    // Get the difference of a from b
    let diff: HashSet<_> = a.difference(&b).cloned().collect();
    assert_eq!(diff, [1].iter().cloned().collect());
}
```

(案例選讀) 位數不重覆的數字
在本節中，我們處理以下的問題：選出位數不重覆的數字。例如：435 的三個數字都不重覆，就是一個符合條件的數字；而 919 則因為有重覆的 9 不符合本題目的條件。我們將某個數字拆開，每個位數各個放入集合中，若集合的長度大於等於數字的位數，則代表該數字的位數沒有重覆，符合我們的條件。

```rust
use std::io;
use std::io::Write;
use std::process;
use std::collections::HashSet;
 
fn main() {
    // Prompt for user input
    print!("Input a number: ");
    let _ = io::stdout().flush();
 
    // Receive user input
    let mut input = String::new();
    io::stdin()
        .read_line(&mut input)
        .expect("failed to read from stdin");
 
    // Parse the number
    let n = match input.trim().parse::<u32>() {
        Ok(i) => i,
        Err(_) => {
            println!("Invalid integer");
 
            // Exit the program with abnormal status code
            process::exit(1);
        }
    };
 
    let x: i32 = 10;
    for i in 1..(x.pow(n)) {
        /* Convert number to an iterator of char.
           Then, insert char to set. */
        let num_string = i.to_string();
        let mut chars = num_string.chars();
        let mut set = HashSet::new();
        let mut c = chars.next();
        while c != None {
            set.insert(c);
            c = chars.next();
        }
 
        // Get the digit number of i
        let mut digit = 0;
        let mut j = i;
        while j > 0 {
            j = j / 10;
            digit += 1;
        }
 
        // Check whether i fits our criteria
        if set.len() as i32 >= digit {
            // Show i in console
            print!("{} ", i);
        }
    }
 
    // Print tailing newline
    println!("");
}
```