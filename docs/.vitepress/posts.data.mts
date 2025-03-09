import { createContentLoader } from 'vitepress';

export default createContentLoader('posts/**/index.md', {
    includeSrc: false,
    transform(rawData) {
        return rawData
            .filter(page => page.url != "/posts/")
            .sort((a, b) => +new Date(b.frontmatter.date) - +new Date(a.frontmatter.date) )
    }
});
