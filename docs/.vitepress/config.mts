import {withMermaid} from "vitepress-plugin-mermaid";
import markdownItFootnote from 'markdown-it-footnote'
import {groupIconMdPlugin, groupIconVitePlugin} from 'vitepress-plugin-group-icons'
import {GitChangelog, GitChangelogMarkdownSection} from '@nolebase/vitepress-plugin-git-changelog/vite'
import lightbox from "vitepress-plugin-lightbox"
import d2 from "vitepress-plugin-d2"
import {Layout, Theme, FileType} from 'vitepress-plugin-d2/dist/config';


// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: "blog.bqc0n.com",
  description: "個人的な備忘録",

  lastUpdated: true,
  cleanUrls: true,
  lang: "ja",

  markdown: {
    math: true,
    config: (md) => {
      md.use(markdownItFootnote)
      md.use(groupIconMdPlugin)
      md.use(lightbox)
      md.use(d2, {
        forceAppendix: false,
        layout: Layout.DAGRE,
        theme: Theme.NEUTRAL_DEFAULT,
        darkTheme: Theme.DARK_MUAVE,
        padding: 100,
        animatedInterval: 0,
        timeout: 120,
        sketch: false,
        center: false,
        scale: 0.7,
        target: "*",
        fontItalic: null,
        fontBold: null,
        fontSemiBold: null,
        fileType: FileType.SVG,
        directory: "d2-diagrams",
      });
    }
  },

  vite: {
    plugins: [
      groupIconVitePlugin(),
      GitChangelog({
        repoURL: () => "https://github.com/bqc0n/blog",
        mapAuthors: [{
          avatar: "https://avatars.githubusercontent.com/u/89625049?v=4",
          name: "bqc0n", username: "bqc0n",
          mapByNameAliases: ["bqc0n"],
        }]
      }),
      GitChangelogMarkdownSection({
        exclude: (id) => id.endsWith('index.md'),
      }),
    ]
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {text: 'Blog', link: '/'},
      {text: "Minecraft Modding", link: '/minecraft-modding/'},
      {text: 'About', link: '/about/'},
    ],

    sidebar: {
      "/": [
        {
          items: [
            {text: 'Home', link: '/'},
            {text: 'Posts', link: '/posts/'},
            {text: 'Tags', link: '/tags/'}
          ]
        }
      ],
      "/minecraft-modding/": [
        {
          items: [
            {text: 'Index', link: '/minecraft-modding/'},
          ]
        }
      ]
    },

    socialLinks: [
      {icon: 'github', link: 'https://github.com/bqc0n/blog'}
    ],

    footer: {
      message: "Released Under the MIT License",
      copyright: "Copyright (c) 2025 bqc0n"
    }
  },

  sitemap: {
    hostname: "https://blog.bqc0n.com"
  },

  mermaid: {},
  mermaidPlugin: {
    class: "mermaid my-class", // set additional css classes for parent container
  },

  head: [
    [
      'link',
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' }
    ],
    [
      'link',
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }
    ],
    [
      'link',
      { href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap', rel: 'stylesheet' }
    ]
  ]
})
