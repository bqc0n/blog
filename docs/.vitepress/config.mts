import {defineConfig} from 'vitepress'
import markdownItFootnote from 'markdown-it-footnote'
import {groupIconMdPlugin, groupIconVitePlugin } from 'vitepress-plugin-group-icons'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "blog.bqc0n.com",
  description: "個人的な備忘録",

  lastUpdated: true,
  cleanUrls: true,

  markdown: {
    config: (md) => {
      md.use(markdownItFootnote)
      md.use(groupIconMdPlugin)
    }
  },

  vite: {
    plugins: [
      groupIconVitePlugin()
    ]
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {text: 'Home', link: '/'},
      {text: 'About', link: '/about/'}
    ],

    sidebar: [
      {
        items: [
          {text: 'Home', link: '/'},
          {text: 'About', link: '/about/'},
          {text: 'Posts', link: '/posts/'},
          {text: 'Tags', link: '/tags/'}
        ]
      }
    ],

    socialLinks: [
      {icon: 'github', link: 'https://github.com/bqc0n/blog'}
    ],

    footer: {
      message: "Released Under the MIT License.",
      copyright: "Copyright ©️ 2025 bqc0n"
    }
  }
})
