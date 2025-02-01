---
title: Home | blog.bqc0n.com
layout: doc
next: false
prev: false
---

<script setup>
import { data as posts } from '.vitepress/posts.data.mts';
import moment from 'moment';
</script>


# blog.bqc0n.com

備忘録



<article v-for="post of posts" class="home-posts-article">
  <a :href="post.url" class="block no-underline">
    <p class="font-bold underline">{{ post.frontmatter.title }}</p>
    <p class="text-sm text-gray-500 dark:text-gray-400 no-underline">{{ moment(post.frontmatter.date).format('YYYY-MM-DD') }}</p>
    <p class="text-black">{{ post.frontmatter.description }}</p>
  </a>   
</article>
