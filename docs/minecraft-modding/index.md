---
title: Minecraft Modding | blog.bqc0n.com
layout: doc
next: false
prev: false
comment: false
---
<script lang="ts" setup>
import { data as posts_1122 } from "../.vitepress/mcmodding-1122.data"
import moment from 'moment';
</script>

# Minecraft Modding こぼれ話

## Minecraft 1.12.2

[CleanroomMC](https://github.com/CleanroomMC/Cleanroom)や[GTCEu](https://github.com/GregTechCEu/GregTech)のあるバージョン。

<ul>
    <li v-for="post of posts_1122">
        <a :href="post.url" class="font-semibold text-lg">{{ post.frontmatter.title }}</a>
    </li>
</ul>
