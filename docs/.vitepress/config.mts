import {defineConfig} from 'vitepress'
import markdownItFootnote from 'markdown-it-footnote'
import {groupIconMdPlugin, groupIconVitePlugin} from 'vitepress-plugin-group-icons'
import {GitChangelog, GitChangelogMarkdownSection} from '@nolebase/vitepress-plugin-git-changelog/vite'
import lightbox from "vitepress-plugin-lightbox"


// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "blog.bqc0n.com",
  description: "個人的な備忘録",

  lastUpdated: true,
  cleanUrls: true,

  markdown: {
    math: true,
    config: (md) => {
      md.use(markdownItFootnote)
      md.use(groupIconMdPlugin)
      md.use(lightbox)
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
      {text: 'Home', link: '/'},
      {text: 'About', link: '/about/'}
    ],

    sidebar: [
      {
        items: [
          {text: 'Home', link: '/'},
          {text: 'Posts', link: '/posts/'},
          {text: 'Tags', link: '/tags/'}
        ]
      }
    ],

    socialLinks: [
      {icon: 'github', link: 'https://github.com/bqc0n/blog'}
    ],

    footer: {
      message: "Released Under the MIT License",
      copyright: "Copyright ©️ 2025 bqc0n"
    }
  },

  sitemap: {
    hostname: "https://blog.bqc0n.com"
  },
})
