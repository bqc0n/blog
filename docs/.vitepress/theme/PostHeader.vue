<script setup>
import { useData } from 'vitepress'
import moment from 'moment';

const { frontmatter } = useData()
const lastUpdated = moment(useData().page.value.lastUpdated).format('YYYY-MM-DD');
const date = moment(frontmatter.value.date).format('YYYY-MM-DD');
</script>

<template>
  <div class="vp-doc">
    <p>
      <span>📅 {{ date }}</span> | <span>🔄 {{ lastUpdated }}</span>
    </p>
    <h1>{{ frontmatter.title }}</h1>
    <p>
      <a v-for="tag in frontmatter.tags" :href="'/tags/' + encodeURIComponent(tag.replaceAll(' ', '')) + '/'"> #{{ tag }} </a>
    </p>
  </div>
</template>
