<script setup>
/**
 * 站点布局分发器：
 *   - 首页 (docs/index.md 带 `layout: collage`) → 使用定制的乳白亚克力拼贴版式
 *   - 其余全部文档页 → 原样交回 VitePress 默认主题，排版与导航完全不变
 */
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import CollageHome from './CollageHome.vue'

const { frontmatter } = useData()
</script>

<template>
  <CollageHome v-if="frontmatter.layout === 'collage'" />
  <DefaultTheme.Layout v-else />
</template>
