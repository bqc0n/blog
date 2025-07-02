<script setup>
import { useData } from 'vitepress'

// ステップ2で作成したローダーからデータを取得
import { data as posts } from '../posts.data.mts';
</script>

<template>
  <div class="post-list">
    <a v-for="post in posts" :key="post.url" :href="post.url" class="post-card">
      <img v-if="post.frontmatter.thumbnail" :src="post.frontmatter.thumbnail" alt="" class="post-thumbnail" />
      <img v-else src="./default-thumbnail.png" alt="Default Thumbnail" class="post-thumbnail" />
      <div class="post-content">
        <h2 class="post-title">{{ post.frontmatter.title }}</h2>
        <p class="post-description">{{ post.frontmatter.description }}</p>
      </div>
    </a>
  </div>
</template>

<style scoped>
.post-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 横に3つ並べる */
  gap: 24px; /* カード間の余白 */
}

.post-card {
  display: block;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  text-decoration: none;
  color: var(--vp-c-text-1);
  transition: border-color 0.25s;
}

.post-card:hover {
  border-color: var(--vp-c-brand-1);
}

.post-thumbnail {
  width: 100%;
  height: 150px;
  object-fit: cover; /* 画像がコンテナに合わせてトリミングされる */
}

.post-content {
  padding: 16px;
}

.post-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.post-description {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.6;
}

/* レスポンシブ対応: 画面幅が狭い場合は列数を減らす */
@media (max-width: 960px) {
  .post-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .post-list {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>
