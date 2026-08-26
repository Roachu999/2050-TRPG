import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "2050 TRPG",
  description: "Dual-Rank Framework",
  themeConfig: {
    // 1. 顶部导航栏 (Navbar)
    nav: [
      { text: '首页', link: '/' },
      { text: '开发日志', link: '/dev-log' }
    ],

    // 2. 左侧树状层级侧边栏 (Sidebar)
    sidebar: [
      { text: '引言', link: '/intro' },
      {
        text: '📖 核心系统',
        collapsed: false, // 是否允许折叠
        items: [
          { text: '标签系统', link: '/core/tags' },
          { text: '检定与动作轮', link: '/core/mechanics' },
          { text: '属性系统', link: '/core/attributes' }
        ]
      },
      {
        text: '🧬 种族 (Bio 1-10)',
        collapsed: false,
        items: [
          { text: '人类', link: '/characters/man' },
          { text: '种族与亚种', link: '/characters/ancestries' }
        ]
      },
      {
        text: '⚔️ 职业 (Class 1-10)',
        collapsed: false,
        items: [
          { text: '英雄 (Lv 1-5)', link: '/classes/hero' },
          { text: '格斗家(Lv 1-5)', link: '/classes/fighter' },
          { text: '占位符[施工中]', link: '/classes/roadmap' }
        ]
      },
      {
        text: '🌐 世界观与势力 [WIP]',
        collapsed: true,
        items: [
          { text: '组织阵营概览', link: '/lore/factions' }
        ]
      }
    ],

    // 3. 开启本地全文搜索
    search: {
      provider: 'local'
    }
  },

  vite: {
    server: {
      watch: {
        ignored: [
          /\.tmpdir[\\/]/, // 原子保存的临时目录，如 .Hero.md.<pid>.<uuid>.tmpdir
          /\.tmp$/,
          (p) => {
            const norm = String(p).replace(/\\/g, '/')
            if (!/\.[^/]+$/.test(norm)) return false // 目录仍需监视（递归遍历）
            return !/\.(md|mdx|vue|js|cjs|mjs|ts|tsx|jsx|css|scss|sass|less|html|json|ya?ml|txt|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|eot)$/i.test(norm)
          }
        ]
      }
    }
  }
})