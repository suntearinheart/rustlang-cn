panic!
该panic!宏也将其输出到ITM！

将main功能更改为如下所示：


#[entry]
fn main() -> ! {
    panic!("Hello, world!");
}
我们来试试吧。但在此之前让我们更新在GDB启动期间为我们openocd.gdb运行这些monitor东西：


 target remote :3333
 set print asm-demangle on
 set print pretty on
 load
+monitor tpiu config internal itm.txt uart off 8000000
+monitor itm port 0 on
 break main
 continue
好的，现在运行它。


$ cargo run
(..)
Breakpoint 1, main () at src/06-hello-world/src/main.rs:10
10          panic!("Hello, world!");

(gdb) next
你会在itmdump终端看到一些新的输出。


$ # itmdump terminal
(..)
panicked at 'Hello, world!', src/06-hello-world/src/main.rs:10:5
你可以做的另一件事是赶上恐慌之前，它通过把一个断点上做记录rust_begin_unwind符号。


(gdb) monitor reset halt
(..)
target halted due to debug-request, current mode: Thread
xPSR: 0x01000000 pc: 0x080026ba msp: 0x10002000

(gdb) break rust_begin_unwind
Breakpoint 2 at 0x80011d2: file $REGISTRY/panic-itm-0.4.0/src/lib.rs, line 46.

(gdb) continue
Continuing.

Breakpoint 2, rust_begin_unwind (info=0x10001fac) at $REGISTRY/panic-itm-0.4.0/src/lib.rs:46
46          interrupt::disable();
您会注意到这次itmdump控制台上没有打印任何内容。如果您继续使用该程序，continue则将打印一个新行。

在后面的部分中，我们将研究其他更简单的通信协议。
