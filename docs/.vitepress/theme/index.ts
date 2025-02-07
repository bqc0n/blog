import DefaultTheme from 'vitepress/theme'
import './custom.css'
import 'virtual:group-icons.css'
import { NolebaseGitChangelogPlugin } from "@nolebase/vitepress-plugin-git-changelog/client"
import '@nolebase/vitepress-plugin-git-changelog/client/style.css'
import Layout from "./Layout.vue";

export default {
    ...DefaultTheme,
    Layout,
    enhanceApp({app}) {
        app.use(NolebaseGitChangelogPlugin)
    }
}
