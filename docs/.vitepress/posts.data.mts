import { createContentLoader } from 'vitepress';

export default createContentLoader('posts/*/*.md', {
    includeSrc: false,
    transform(rawData) {
        return rawData
            .filter(page => page.url != "/posts/")
            .sort((a, b) => { return +new Date(b.frontmatter.date) - +new Date(a.frontmatter.date) })
    }
});
