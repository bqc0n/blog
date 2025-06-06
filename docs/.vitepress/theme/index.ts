import DefaultTheme from 'vitepress/theme-without-fonts'
import './custom.css'
import "./custom-fonts.css"
import 'virtual:group-icons.css'
import { NolebaseGitChangelogPlugin } from "@nolebase/vitepress-plugin-git-changelog/client"
import '@nolebase/vitepress-plugin-git-changelog/client/style.css'
import giscusTalk from 'vitepress-plugin-comment-with-giscus';
import { useData, useRoute } from 'vitepress';
import { toRefs } from "vue";

import Layout from "./Layout.vue";

export default {
    ...DefaultTheme,
    Layout,
    enhanceApp({app}) {
        app.use(NolebaseGitChangelogPlugin)
    },
    setup() {
        const { frontmatter } = toRefs(useData());
        const route = useRoute();
        giscusTalk({
            repo: 'bqc0n/blog',
            repoId: 'R_kgDONyqpCg',
            category: 'Announcements',
            categoryId: 'DIC_kwDONyqpCs4Cmvcv',
            mapping: 'title',
            inputPosition: 'top',
            lang: 'jp',
            locales: {
                'ja': 'ja',
                'en-US': 'en'
            },
            homePageShowComment: false, // Whether to display the comment area on the homepage, the default is false
            lightTheme: 'light', // default: `light`
            darkTheme: 'transparent_dark', // default: `transparent_dark`
            }, {
                frontmatter, route
            },
            true,
        );
    }
}
