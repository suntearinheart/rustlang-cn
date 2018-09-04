exports.std = (title) => {
    return [
        '',
        {
            title: 'any',
            collapsable: false,
            children: [
            'any/any'
            ]
        },
        {
            title: 'Collection',
            collapsable: false,
            children: [
            'collection/',
            'collection/hashmap',
            'collection/hashset'
            ]
        },
        {
            title: 'Fs',
            collapsable: false,
            children: [
            'fs/',
            'fs/fs'
            ]
        },
        {
            title: 'IO',
            collapsable: false,
            children: [
            'io/',
            'io/io'
            ]
        },
        {
            title: 'Net',
            collapsable: false,
            children: [
            'net/',
            'net/net'
            ]
        }
    ]
}