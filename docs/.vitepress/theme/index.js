/**
 * VitePress 主题入口
 * ---------------------------------------------------------------------------
 * 这里只做两件事，不改动默认主题的任何既有行为：
 *   1. 继承默认主题 (extends: DefaultTheme) —— 文档页、侧边栏、本地搜索全部照旧
 *   2. 用 Layout.vue 分发首页的定制版式 (collage.css 为配套样式，作用域限于首页容器)
 */
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import './collage.css'

export default {
  extends: DefaultTheme,
  Layout
}
