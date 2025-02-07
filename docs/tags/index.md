---
title: Tags
next: false
prev: false
comment: false
---

# タグ一覧

<script setup>
import { data as posts } from '../.vitepress/posts.data.mts'

var tags = {}
posts.forEach(post => {
    if (post.frontmatter.tags) {
        post.frontmatter.tags.forEach(tag => {
            if (tags[tag] === undefined) {
                tags[tag] = 1
            } else {
                tags[tag] += 1
            }
        })
    }
})

var tag_list = Object.keys(tags)
</script>

<ul>
  <li v-for="tag of tag_list">
    <a :href="'/tags/' + encodeURIComponent(tag.replaceAll(' ', '')) + '/'">{{ tag }} ({{ tags[tag] }})</a>
  </li>
</ul>
