<!--そのtagに所属する記事が何個あるか数える-->
<script lang="ts" setup>
import { data as posts } from "../posts.data.mjs";
const props = defineProps(['tag'])
let sortedPosts;
if( typeof props.tag === 'string'){
  sortedPosts = posts.filter(page => page.frontmatter.tags
      .toString()
      .replaceAll(' ', '')
      .toLowerCase()
      .includes(props.tag));
}
else{
  sortedPosts = posts;
}
</script>

<template>
  <span>{{ sortedPosts.length }}</span>
</template>