---
title: Home
layout: doc
next: false
prev: false
comment: false
---

<script setup>
import { data as posts } from '.vitepress/posts.data.mts';
import moment from 'moment';
</script>

# blog.bqc0n.com

個人的な備忘録集です。記事の内容は、[MIT-License](https://github.com/bqc0n/blog/blob/main/LICENSE)で利用可能です。

Minecraft Modding関連の記事は[別でまとめています](./minecraft-modding/index.md)。

<article v-for="post of posts" class="home-posts-article">
  <a :href="post.url" class="block text-inherit no-underline hover:underline">
    <p class="text-2xl">{{ post.frontmatter.title }}</p>
    <p class="text-sm text-gray-500">{{ moment(post.frontmatter.date).format('YYYY-MM-DD') }}</p>
    <p>{{ post.frontmatter.description }}</p>
  </a>   
</article>
