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
      { text: '真相：帷幕之下', link: '/truth' },
      {
        text: '📖 核心系统',
        collapsed: false, // 是否允许折叠
        items: [
          { text: '规则（早起测试）', link: '/core/rules' },
          { text: '影响度与破坏力', link: '/core/influence' },
          { text: '动作系统', link: '/core/actions' },
          {
            text: '绝技 (Maneuvers)',
            link: '/core/maneuvers',
            collapsed: false,
            items: [
              { text: '通用绝技', link: '/core/maneuvers/general' },
              { text: '格斗家绝技', link: '/core/maneuvers/fighter' },
              { text: '枪手绝技', link: '/core/maneuvers/gunslinger' }
            ]
          },
          { text: '类型系统', link: '/core/types' },
          { text: '检定与动作轮', link: '/core/mechanics' },
          { text: '属性系统', link: '/core/attributes' }
        ]
      },
      {
        text: '🧬 种族 (Bio 1-10)',
        collapsed: false,
        items: [
          { text: '人类', link: '/characters/human' },
          { text: '精灵 (Animism)', link: '/characters/animism' },
          { text: '半神 (Demigod)', link: '/characters/demigod' },
          { text: '人形 (Android)', link: '/characters/android' },
          { text: '第二类恶魔 (Demon)', link: '/characters/demon' },
          { text: '种族与亚种', link: '/characters/ancestries' }
        ]
      },
      {
        text: '⚔️ 职业 (Class 1-10)',
        collapsed: false,
        items: [
          { text: '英雄 (Lv 1-5)', link: '/classes/hero' },
          { text: '格斗家(Lv 1-5)', link: '/classes/fighter' },
          { text: '灵修士 (Occultist)', link: '/classes/occultist' },
          {
            text: '施法者 (Casters)',
            collapsed: false,
            items: [
              { text: '法师 (Mage)', link: '/classes/mage' },
              { text: '术士 (Sorcerer)', link: '/classes/sorcerer' },
              { text: '超能力者 (Psion)', link: '/classes/psion' },
              { text: '现实扭曲者 (Reality Warper)', link: '/classes/reality-warper' }
            ]
          },
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