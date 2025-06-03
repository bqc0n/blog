import { createContentLoader } from 'vitepress';

export default createContentLoader('mc-modding/1.12.2/**.md', {
    includeSrc: false,
    transform(rawData) {
        return rawData
            .filter(page => page.url != "/mc-modding/1.12.2/")
            .filter(page => !page.frontmatter.draft)
            .sort((a, b) => a.frontmatter.order - b.frontmatter.order)
    }
});
