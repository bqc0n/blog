---
title: Posts | blog.bqc0n.com
layout: doc
next: false
prev: false
comment: false
---
<script lang="ts" setup>
import { data as posts } from "../.vitepress/posts.data"
import moment from 'moment';
</script>

# 記事一覧

<ul>
    <li v-for="post of posts">
        <a :href="post.url" class="font-semibold text-lg">{{ post.frontmatter.title }}</a>
        <span class="text-sm"> - {{ moment(post.frontmatter.date).format('YYYY-MM-DD') }}</span>
    </li>
</ul>
