let { book } = require ('./category/rust.js')
let { std } = require ('./category/std.js')
let { tokio } = require ('./category/tokio.js')

module.exports = {
    title: 'Rust中文社区',
    description: 'Rust语言为中心的中文社区',
    head: [
      ['link', { rel: 'icon', href: `/favicon.ico` }],
      ['link', { rel: 'manifest', href: '/manifest.json' }],
      ['meta', { name: 'theme-color', content: '#3eaf7c' }],
      ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
      ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
      ['link', { rel: 'apple-touch-icon', href: `/icons/apple-touch-icon-152x152.png` }],
      ['meta', { name: 'msapplication-TileImage', content: '/icons/msapplication-icon-144x144.png' }],
      ['meta', { name: 'msapplication-TileColor', content: '#000000' }]
    ],
    serviceWorker: true,
    theme: 'vue',
    themeConfig: {
        repo: 'rustlang-cn',
        docsDir: 'docs',
        displayAllHeaders: true,
        editLinks: true,
        editLinkText: '在 GitHub 上编辑此页',
        lastUpdated: '上次更新', 
        docsDir: 'docs',
        sidebarDepth: 0,
        search: true,
        searchMaxSuggestions: 11,
        nav: [
          { text: 'Rust语言', items: [ 
            { text: 'Rust编程', link: '/rust/book/' },
            { text: '深入Rust', link: '/rust/depth/' },
            { text: '标准库', link: '/rust/std/' },
            { text: '规范', link: '/rust/reference/' },
            { text: '资源', link: '/rust/resourse/' }
          ] },
          { text: 'Server', items: [ 
            { text: 'Tokio', link: '/server/tokio/' },
            { text: 'Actix', link: '/server/actix/' },
            { text: 'Actix-web', link: '/server/actix-web/' },
            { text: 'Diesel', link: '/server/diesel/' }
          ] },
          { text: 'Wasm', link: '/wasm/' },
          { text: 'IOT', items: [ 
            { text: '教程', link: '/iot/book/' },
            { text: '资源', link: '/iot/resourse/' }
          ] },
          { text: '资源', items: [ 
            { text: '官方', link: '/resourse/office/' },
            { text: '社区', link: '/resourse/community/' },
            { text: 'Crates', link: '/resourse/crates/' }
          ] },
          { text: '论坛', link: 'http://ruster.xyz' }
        ],
        sidebar: {
          '/rust/book/': book('Rust'),
          '/rust/std/': std('Std'),
          '/server/tokio/': tokio('Tokio'),
          '/server/actix/': genActix('Actix'),
          '/server/actix-web/': genActixWeb('Actix-Web'),
          '/server/diesel/': genDiesel('Diesel'),
          '/resourse/office/': genOffice('官方'),
          '/resourse/community/': genCommunity('社区')
        }
    }
  }

  function genActix (title) {
    return [
      {
        title,
        collapsable: false,
        children: [
          'overview',
          'start',
          'actor',
          'address',
          'context',
          'arbiter',
          'sync-arbiter',
          'stream',
          'IO-helpers',
          'supervisor',
          'registry',
          'helper-actors'
        ]
      }
    ]
  }

  function genActixWeb (title) {
    return [
      '',
      {
        title: '介绍',
        collapsable: false,
        children: [
          'whatisactix',
          'installation'
        ]
      },
      {
        title: '基本',
        collapsable: false,
        children: [
          'getting-started',
          'application',
          'server',
          'handler',
          'extractors'
        ]
      },
      {
        title: '高级',
        collapsable: false,
        children: [
          'error',
          'URL-Dispatch',
          'request',
          'response',
          'test',
          'middleare',
          'staticfile'
        ]
      },
      {
        title: '协议',
        collapsable: false,
        children: [
          'websocket',
          'HTTP2'
        ]
      },
      {
        title: '主题',
        collapsable: false,
        children: [
          'autoreloade',
          'database',
          'sentry'
        ]
      }
    ]
  }

  function genDiesel (title) {
    return [
      {
        title,
        collapsable: false,
        children: [
          'start',
          'all-about-updates',
          'all-about-inserts',
          'composing-applications-with-diesel',
          'schema-in-depth',
          'extending-diesel',
          'configuring-diesel-CLI'
        ]
      }
    ]
  }

  function genOffice (title) {
    return [
      {
        title,
        collapsable: false,
        children: [
          'resourse'
        ]
      }
    ]
  }

  function genCommunity (title) {
    return [
      {
        title,
        collapsable: false,
        children: [
          'actix'
        ]
      }
    ]
  }
