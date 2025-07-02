import { createContentLoader } from 'vitepress';

export default createContentLoader('posts/**/index.md', {
    includeSrc: false,
    transform(rawData) {
        const processedPosts = rawData.map(post => {
            if (post.frontmatter.thumbnail && post.frontmatter.thumbnail.startsWith('./')) {
                // 投稿記事のURLからディレクトリ部分を取得
                // 例: /posts/my-post.html -> /posts/
                const postDir = post.url.substring(0, post.url.lastIndexOf('/') + 1)
                // 元のパスと結合して、正しい絶対パスを生成
                // 例: /posts/ + thumbnail.png -> /posts/thumbnail.png
                post.frontmatter.thumbnail = postDir + post.frontmatter.thumbnail.slice(2) // './' を取り除く
            }
            return post
        })
        return processedPosts
            .filter(page => page.url != "/posts/")
            .sort((a, b) => +new Date(b.frontmatter.date) - +new Date(a.frontmatter.date) )
    }
});
