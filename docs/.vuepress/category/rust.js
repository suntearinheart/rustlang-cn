exports.book = (title) => {
    return [
        '',
        'start',
        {
            title: '工具链',
            collapsable: false,
            children: [
            'toolchain/rustup',
            'toolchain/cargo-base',
            'toolchain/cargo-set',
            'toolchain/attribute'
            ]
        },
        {
            title: '类型',
            collapsable: false,
            children: [
            'type/const-and-variable',
            'type/types',
            'type/operators-and-overloads',
            'type/array-vec-slice',
            'type/string',
            'type/struct',
            'type/enum',
            'type/fn',
            'type/method',
            'type/trait',
            'type/closure',
            'type/destructors'
            ]
        },
        {
            title: '表达式',
            collapsable: false,
            children: [
            'express/express',
            'express/patterns',
            'express/iterator'
            ]
        },
        {
            title: '所有权',
            collapsable: false,
            children: [
            'ownership/heap-stack',
            'ownership/ownership',
            'ownership/reference',
            'ownership/lifetime'
            ]
        },
        {
            title: '模块',
            collapsable: false,
            children: [
            'module/module'
            ]
        },
        {
            title: '宏',
            collapsable: false,
            children: [
            'macro/macro'
            ]
        },
        {
            title: '错误处理',
            collapsable: false,
            children: [
            'error-handle/',
            'error-handle/unrecoverable-errors-with-panic',
            'error-handle/recoverable-errors-with-result',
            'error-handle/panic-or-not-to-panic'
            ]
        },
        {
            title: '测试',
            collapsable: false,
            children: [
            'test/',
            'test/writing-tests',
            'test/running-tests',
            'test/test-organization'
            ]
        },
        {
            title: '并发',
            collapsable: false,
            children: [
            'concurrent/',
            'concurrent/threads',
            'concurrent/message-passing',
            'concurrent/shared-state',
            'concurrent/concurrency-sync-and-send'
            ]
        },
        {
            title: 'FFI',
            collapsable: false,
            children: [
            'ffi/',
            'ffi/ffi',
            'ffi/compiling-rust-to-lib',
            'ffi/calling-ffi-function',
            'ffi/linkage'
            ]
        },
        {
            title: 'Unsafe',
            collapsable: false,
            children: [
            'unsafe/unsafe'
            ]
        },
        {
            title: '编程风格',
            collapsable: false,
            children: [
            'style/',
            'style/doc',
            'style/style',
            'style/code-style',
            'style/oop',
            'style/generics',
            'style/code-reuse'
            ]
        },
        {
            title: '基础API',
            collapsable: false,
            children: [
            'important/',
            'important/fmt',
            'important/box',
            'important/deref',
            'important/drop',
            'important/cow',
            'important/borrow',
            'important/copy-clone',
            'important/asRef-asMut',
            'important/into-from',
            'important/phantomData',
            'important/sized',
            'important/send-sync',
            'important/rc-arc',
            'important/cell-refcell',
            'important/mutex'
            ]
        }
    ]
}
