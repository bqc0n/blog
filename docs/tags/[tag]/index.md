---
next: false
prev: false
comment: false
---

<script setup>
import { useData } from 'vitepress'
import { data as posts } from '../../.vitepress/posts.data.mts'

const { params } = useData()
const current_tag = params.value.tag

var pages = []
posts.forEach(post => {
    if (post.frontmatter.tags){
        var tags = post.frontmatter.tags.map(tag => tag.replaceAll(" ", "") )
        if (tags.includes(current_tag)) pages.push(post) 
    }
})

</script>

<!-- @content -->

<ul>
  <li v-for="page of pages">
    <a :href="page.url">{{ page.frontmatter.title }}</a>
  </li>
</ul>
