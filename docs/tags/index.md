# タグ一覧
<!--タグのリストと記事数を表示-->
<script lang="ts" setup>
import { data as tags } from "../.vitepress/tags.data.mts";
import PostCounter from "../.vitepress/components/PostCounter.vue"
</script>

<ul>
    <li v-for="tagpage of tags">
        <a :href="tagpage.url" class="font-semibold text-lg">{{ tagpage.frontmatter.title.replace('Tags/', '') }}
            <span class="text-sm"> (<PostCounter :tag="tagpage.url.replace('/tags/', '').replace('.html', '')" />)</span>
        </a>
    </li>
</ul>
