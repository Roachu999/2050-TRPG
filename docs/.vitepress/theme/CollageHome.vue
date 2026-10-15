<script setup>
/**
 * 2050-TRPG 首页 / 乳白亚克力自由拼贴版式
 * ---------------------------------------------------------------------------
 * 视觉与交互沿用设计稿：
 *   - 底层固定层：64px 战术网格 + 高对比等高线 + 极坐标雷达环 + 3 组通信数据流
 *   - 顶部：仿 VitePress 导航栏 + 左右滑动胶囊开关 (GRID / COLLAGE) + 一键复位
 *   - 左侧：同材质的折叠目录侧边栏（结构对齐 .vitepress/config.mjs 的 sidebar）
 *   - 舞台：6 张乳白亚克力卡片，默认规整网格排列；切到拼贴模式可自由拖拽
 * 工程适配（非视觉改动）：
 *   1. 卡片位移/旋转/层级由 Vue 响应式状态驱动（含 SSR 首屏，无跳动）
 *   2. 链接统一走 withBase()，适配 GitHub Pages 的 base: '/2050-TRPG/'
 *   3. 定时器在 onBeforeUnmount 中清理，避免路由切换后泄漏
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { withBase } from 'vitepress'

/* ===========================================================================
   一、折叠侧边栏目录树（与站点 config.mjs 的 sidebar 结构保持一致）
   =========================================================================== */
const NAV_TREE = [
  { text: '引言', link: '/intro' },
  { text: '真相：帷幕之下', link: '/truth' },
  {
    text: '📖 核心系统',
    key: 'core',
    open: true,
    items: [
      { text: '规则 (早期测试)', link: '/core/rules' },
      { text: '影响度与破坏力', link: '/core/influence' },
      { text: '动作系统', link: '/core/actions' },
      {
        text: '绝技 (Maneuvers)',
        link: '/core/maneuvers',
        key: 'maneuvers',
        open: true,
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
    key: 'race',
    open: true,
    items: [
      { text: '人类', link: '/characters/human' },
      { text: '精灵 (Animism)', link: '/characters/animism' },
      { text: '半神 (Demigod)', link: '/characters/demigod' },
      { text: '人形 (Android)', link: '/characters/android' },
      { text: '第二类恶魔 (Type-II Demon)', link: '/characters/demon' },
      { text: '种族与亚种', link: '/characters/ancestries' }
    ]
  },
  {
    text: '⚔️ 职业 (Class 1-10)',
    key: 'classes',
    open: true,
    items: [
      { text: '英雄 (Lv 1-5)', link: '/classes/hero' },
      { text: '格斗家 (Lv 1-5)', link: '/classes/fighter' },
      { text: '灵修士 (Occultist)', link: '/classes/occultist' },
      {
        text: '施法者 (Casters)',
        key: 'casters',
        open: true,
        items: [
          { text: '法师 (Mage)', link: '/classes/mage' },
          { text: '术士 (Sorcerer)', link: '/classes/sorcerer' },
          { text: '超能力者 (Psion)', link: '/classes/psion' },
          { text: '现实扭曲者 (Reality Warper)', link: '/classes/reality-warper' }
        ]
      },
      { text: '特殊职业规划 [WIP]', link: '/classes/roadmap' }
    ]
  },
  {
    text: '🌐 世界观与势力 [WIP]',
    key: 'lore',
    open: false,
    items: [{ text: '组织阵营概览', link: '/lore/factions' }]
  },
  { text: '开发日志', link: '/dev-log' }
]

/* 收集所有可折叠分组的展开状态（嵌套分组一并收集） */
function collectGroups(nodes, acc = {}) {
  nodes.forEach((node) => {
    if (node.items) {
      acc[node.key] = node.open !== false
      collectGroups(node.items, acc)
    }
  })
  return acc
}

const groupOpen = reactive(collectGroups(NAV_TREE))
const anyGroupOpen = computed(() => Object.values(groupOpen).some(Boolean))

function toggleGroup(key) {
  groupOpen[key] = !groupOpen[key]
}

function toggleAllGroups(open) {
  Object.keys(groupOpen).forEach((key) => {
    groupOpen[key] = open
  })
}

/* ===========================================================================
   二、卡片拼贴状态与模式
   =========================================================================== */
/* 拼贴模式下的错位预设（规整网格模式不生效，仅供自由拼贴使用） */
const INITIAL = {
  'MOD-01': { x: 8, y: 6, rot: -0.8, z: 12 },
  'MOD-02': { x: -26, y: 28, rot: 1.2, z: 14 },
  'MOD-03': { x: 14, y: -18, rot: 0.9, z: 13 },
  'MOD-04': { x: -8, y: 16, rot: -1.1, z: 15 },
  'MOD-05': { x: -18, y: -12, rot: 0.7, z: 11 },
  'MOD-06': { x: 6, y: 22, rot: 0, z: 10 }
}

const cardState = reactive(
  Object.fromEntries(Object.entries(INITIAL).map(([id, v]) => [id, { ...v }]))
)

const isCollageMode = ref(false)
const draggingId = ref('')
const activeCard = ref('NONE')
const acrylicOpacity = ref(84)
const hexLine = ref('PKT_HEX: 0x7F 0xA4 0x19 0xE0 // ACK_OK')

let highestZ = 20
let dragCtx = null
let hexTimer = null

const modeLabel = computed(() => (isCollageMode.value ? 'COLLAGE MODE' : 'GRID MODE'))
const modeSub = computed(() => (isCollageMode.value ? '自由拼贴・可拖拽' : '规整网格・已锁定'))
const statusHint = computed(() =>
  isCollageMode.value
    ? '拖拽任意卡片可自由摆放，观察边缘对底层等高线的折射效果'
    : '当前为规整网格排列；切换左上开关可进入自由拼贴模式'
)
const rootStyle = computed(() => ({
  '--acrylic-opacity': (acrylicOpacity.value / 100).toFixed(2)
}))

/* 坐标回显格式：+008 / -026 */
function formatCoord(num) {
  const rounded = Math.round(num)
  const sign = rounded >= 0 ? '+' : '-'
  return `${sign}${String(Math.abs(rounded)).padStart(3, '0')}`
}

/* 坐标读数跟随实际生效位置：规整网格模式下恒为 0 */
function displayCoord(id, axis) {
  const s = cardState[id]
  return formatCoord(isCollageMode.value ? s[axis] : 0)
}

/* 卡片变换：GRID 模式下归零对齐，COLLAGE 模式下回到各自错位姿态 */
function cardStyle(id) {
  const s = cardState[id]
  if (!isCollageMode.value) {
    return { zIndex: s.z, transform: 'translate3d(0px, 0px, 0px) rotate(0deg)' }
  }
  return {
    zIndex: s.z,
    transform: `translate3d(${s.x}px, ${s.y}px, 0px) rotate(${s.rot}deg)`
  }
}

function toggleMode() {
  isCollageMode.value = !isCollageMode.value
}

/* 复位：回到规整网格，并重置拼贴预设 */
function resetDesk() {
  isCollageMode.value = false
  Object.entries(INITIAL).forEach(([id, v]) => Object.assign(cardState[id], v))
  highestZ = 20
  activeCard.value = 'DESK_RESET_TO_GRID_OK'
}

/* ===========================================================================
   三、指针拖拽（事件委托 + 指针捕获，仅拼贴模式生效）
   =========================================================================== */
function onPointerDown(e) {
  if (!isCollageMode.value) return
  const target = e.target
  if (!target || !target.closest) return
  // 点到按钮、链接或滑块时不触发拖拽，保证正常交互
  if (target.closest('a, button, input')) return
  const card = target.closest('.acrylic-card')
  if (!card) return
  const id = card.dataset.cardId
  const s = cardState[id]
  if (!s) return

  highestZ += 1
  s.z = highestZ
  draggingId.value = id
  dragCtx = {
    id,
    card,
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    baseX: s.x,
    baseY: s.y
  }
  if (card.setPointerCapture) {
    try {
      card.setPointerCapture(e.pointerId)
    } catch (err) {
      /* 忽略捕获失败，退化为普通拖拽 */
    }
  }
  activeCard.value = `${id} [DRAGGING]`
}

function onPointerMove(e) {
  if (!dragCtx || e.pointerId !== dragCtx.pointerId) return
  const s = cardState[dragCtx.id]
  s.x = dragCtx.baseX + (e.clientX - dragCtx.startX)
  s.y = dragCtx.baseY + (e.clientY - dragCtx.startY)
}

function endDrag() {
  if (!dragCtx) return
  const { card, id, pointerId } = dragCtx
  if (card.hasPointerCapture && card.hasPointerCapture(pointerId)) {
    try {
      card.releasePointerCapture(pointerId)
    } catch (err) {
      /* 忽略释放失败 */
    }
  }
  activeCard.value = `${id} [LOCKED]`
  draggingId.value = ''
  dragCtx = null
}

/* ===========================================================================
   四、背景通信编码轻微跳动（保持极简生命感）
   =========================================================================== */
onMounted(() => {
  const randHex = () =>
    '0x' + Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, '0')
  hexTimer = setInterval(() => {
    hexLine.value = `PKT_HEX: ${randHex()} ${randHex()} ${randHex()} ${randHex()} // ACK_OK`
  }, 2800)
})

onBeforeUnmount(() => {
  if (hexTimer) clearInterval(hexTimer)
})
</script>

<template>
  <div class="collage-root" :style="rootStyle">
    <!-- ====================================================================
         底层固定背景：高对比等高线 + 单座极简雷达 + 3组通信数据流
         ==================================================================== -->
    <div class="bg-layer" aria-hidden="true">
      <div class="bg-grid"></div>

      <svg
        class="bg-svg"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- 1. 高对比度等高线组 (左侧与中下部：碳黑实线 + 信号橙主高程线) -->
        <g fill="none" stroke-linecap="round">
          <path d="M-120,180 C140,120 340,260 480,440 C620,620 520,820 320,940" stroke="#121211" stroke-width="1.2" opacity="0.26"/>
          <path d="M-100,250 C110,190 290,310 410,470 C530,630 440,800 260,920" stroke="#121211" stroke-width="1.2" opacity="0.34"/>
          <path d="M-80,320 C90,260 240,360 340,500 C440,640 360,790 190,900" stroke="#FF4400" stroke-width="2" opacity="0.78"/>
          <path d="M-60,390 C70,340 190,420 270,530 C350,640 280,770 120,870" stroke="#121211" stroke-width="1.5" opacity="0.48"/>
          <path d="M-40,460 C50,420 140,480 190,560 C240,640 190,740 60,820" stroke="#121211" stroke-width="1.2" stroke-dasharray="6 6" opacity="0.45"/>

          <path d="M1050,-60 C1120,120 1320,210 1650,180" stroke="#121211" stroke-width="1.2" opacity="0.28"/>
          <path d="M1140,-60 C1190,90 1360,160 1650,130" stroke="#FF4400" stroke-width="1.8" opacity="0.72"/>
          <path d="M1230,-60 C1270,50 1400,100 1650,80" stroke="#121211" stroke-width="1.2" opacity="0.40"/>
        </g>

        <!-- 等高线高程微标 -->
        <g font-family="JetBrains Mono, monospace" font-size="10" font-weight="700">
          <rect x="268" y="422" width="68" height="15" fill="#FF4400" />
          <text x="273" y="433" fill="#FFFFFF">ELV +450m</text>
          <text x="385" y="465" fill="#121211" opacity="0.65">ELV +300m</text>
          <text x="1290" y="135" fill="#FF4400">SECTOR // N-09</text>
        </g>

        <!-- 2. 单座极简战术极坐标雷达环 (透过乳白亚克力卡片边缘可见) -->
        <g transform="translate(1216, 414)">
          <circle cx="0" cy="0" r="240" fill="none" stroke="#121211" stroke-width="1.2" opacity="0.25" />
          <circle cx="0" cy="0" r="170" fill="none" stroke="#121211" stroke-width="1" stroke-dasharray="4 6" opacity="0.35" />
          <circle cx="0" cy="0" r="95" fill="none" stroke="#FF4400" stroke-width="1.5" opacity="0.65" />
          <circle cx="0" cy="0" r="4" fill="#FF4400" />
          <line x1="-265" y1="0" x2="265" y2="0" stroke="#121211" stroke-width="0.9" opacity="0.22" />
          <line x1="0" y1="-265" x2="0" y2="265" stroke="#121211" stroke-width="0.9" opacity="0.22" />
          <circle cx="-62" cy="-48" r="4" fill="#FF4400" />
          <text x="-52" y="-44" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" fill="#121211">TGT_2050</text>
        </g>

        <!-- 雷达缓慢旋转扫描线 -->
        <g class="radar-sweep">
          <line x1="1216" y1="414" x2="1456" y2="414" stroke="#FF4400" stroke-width="1.5" opacity="0.55" />
        </g>
      </svg>

      <!-- 3. 三组克制的通信编码数据流 -->
      <div class="telemetry-stream stream-1">
        <div><span class="tag-black">COM.01</span>FREQ // 2050.84 MHz [SYNC]</div>
        <div>{{ hexLine }}</div>
      </div>

      <div class="telemetry-stream stream-2">
        <div><span class="tag-orange">RADAR</span>AZIMUTH: 284.6° // ELEV: +14.2°</div>
        <div>TOPO_DATUM: WGS-2050 // GRID_INTERVAL: 64M</div>
      </div>

      <div class="telemetry-stream stream-3">
        <div><span class="tag-black">SYS.NODE</span>ROACHU999 // 2050-TRPG ARCHIVE</div>
        <div>LATENCY: 04.2ms // BUFFER: NOMINAL</div>
      </div>
    </div>

    <!-- ====================================================================
         顶部导航栏 + 左右滑动模式开关 + 一键复位
         ==================================================================== -->
    <header class="vp-nav">
      <div class="vp-nav-left">
        <span class="brand-badge">2050</span>
        <a class="brand-title" :href="withBase('/')" style="text-decoration: none;">2050 TRPG 规则不全书</a>
      </div>

      <div class="vp-nav-right">
        <nav class="vp-nav-links">
          <a :href="withBase('/')">首页</a>
          <a :href="withBase('/core/rules')">核心系统</a>
          <a :href="withBase('/dev-log')">开发日志</a>
        </nav>

        <div class="workbench-controls">
          <div
            class="switch-wrapper"
            title="点击切换：规整网格模式 / 自由拼贴模式"
            @click="toggleMode"
          >
            <div class="switch-label">
              <span>{{ modeLabel }}</span>
              <span class="mode-sub">{{ modeSub }}</span>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="String(isCollageMode)"
              class="vp-cyber-switch"
            >
              <span class="track-icon icon-collage">自由</span>
              <span class="track-icon icon-grid">规整</span>
              <span class="switch-thumb"></span>
            </button>
          </div>

          <button
            type="button"
            class="btn-reset"
            title="重置卡片位置并回到规整网格排列"
            @click="resetDesk"
          >
            <span>↺</span>
            <span>复位桌面</span>
          </button>
        </div>
      </div>
    </header>

    <!-- ====================================================================
         主区域：左侧折叠目录侧边栏 + 右侧乳白亚克力卡片舞台
         ==================================================================== -->
    <main class="stage-shell">
      <aside class="acrylic-card index-sidebar">
        <span class="corner-mark corner-tl"></span>
        <span class="corner-mark corner-tr"></span>
        <span class="corner-mark corner-bl"></span>
        <span class="corner-mark corner-br"></span>

        <div class="sidebar-head">
          <div class="sidebar-title">
            <span class="num-box">IDX</span>
            <span>ARCHIVE INDEX // 目录</span>
          </div>
          <button
            type="button"
            class="sidebar-mini-btn"
            :title="anyGroupOpen ? '收起所有分组' : '展开所有分组'"
            @click="toggleAllGroups(!anyGroupOpen)"
          >
            {{ anyGroupOpen ? '全部收起' : '全部展开' }}
          </button>
        </div>

        <nav class="sidebar-nav" aria-label="站点目录">
          <ul class="sidebar-list">
            <template v-for="node in NAV_TREE" :key="node.text">
              <li v-if="!node.items">
                <a class="sidebar-link sidebar-link-top" :href="withBase(node.link)">{{ node.text }}</a>
              </li>

              <li v-else class="sidebar-group">
                <button
                  type="button"
                  class="sidebar-group-head"
                  :aria-expanded="String(!!groupOpen[node.key])"
                  @click="toggleGroup(node.key)"
                >
                  <span class="chev" :class="{ open: groupOpen[node.key] }">▸</span>
                  <span class="sidebar-group-text">{{ node.text }}</span>
                </button>

                <div class="sidebar-collapse" :class="{ open: groupOpen[node.key] }">
                  <div class="sidebar-collapse-inner">
                    <ul class="sidebar-sublist">
                      <template v-for="item in node.items" :key="item.text">
                        <li v-if="!item.items">
                          <a class="sidebar-link" :href="withBase(item.link)">{{ item.text }}</a>
                        </li>

                        <li v-else class="sidebar-nested">
                          <div class="sidebar-nested-row">
                            <a v-if="item.link" class="sidebar-link" :href="withBase(item.link)">{{ item.text }}</a>
                            <span v-else class="sidebar-link">{{ item.text }}</span>
                            <button
                              type="button"
                              class="chev-btn"
                              :aria-expanded="String(!!groupOpen[item.key])"
                              @click="toggleGroup(item.key)"
                            >
                              <span class="chev" :class="{ open: groupOpen[item.key] }">▸</span>
                            </button>
                          </div>

                          <div class="sidebar-collapse" :class="{ open: groupOpen[item.key] }">
                            <div class="sidebar-collapse-inner">
                              <ul class="sidebar-sublist sidebar-sublist-2">
                                <li v-for="leaf in item.items" :key="leaf.text">
                                  <a class="sidebar-link" :href="withBase(leaf.link)">{{ leaf.text }}</a>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </li>
                      </template>
                    </ul>
                  </div>
                </div>
              </li>
            </template>
          </ul>
        </nav>
      </aside>

      <div class="stage-container">
        <div class="stage-statusbar">
          <div class="status-left">
            <span class="status-dot"></span>
            <span><strong>SYSTEM READY</strong> // {{ statusHint }}</span>
          </div>
          <div class="status-right">
            <span>ACTIVE_MODULE: {{ activeCard }}</span>
            <span>SURFACE: MILKY_ACRYLIC_{{ acrylicOpacity }}%</span>
          </div>
        </div>

        <section
          class="collage-board"
          :class="isCollageMode ? 'is-collage-mode' : 'is-grid-mode'"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="endDrag"
          @pointercancel="endDrag"
        >
          <!-- 卡片 01：主视觉档案卡 (Hero) -->
          <article
            class="acrylic-card card-hero"
            :class="{ 'is-dragging': draggingId === 'MOD-01' }"
            data-card-id="MOD-01"
            :style="cardStyle('MOD-01')"
          >
            <span class="corner-mark corner-tl"></span>
            <span class="corner-mark corner-tr"></span>
            <span class="corner-mark corner-bl"></span>
            <span class="corner-mark corner-br"></span>
            <div class="orange-tape">ARCHIVE // 01</div>

            <div class="card-drag-bar">
              <div class="card-index-tag">
                <span class="num-box orange">01</span>
                <span>PRIMARY_DOSSIER // 主视觉模块</span>
              </div>
              <span class="card-coords">
                X:{{ displayCoord('MOD-01', 'x') }} Y:{{ displayCoord('MOD-01', 'y') }}
              </span>
            </div>

            <div class="card-body">
              <div class="hero-eyebrow">WORLDVIEW &amp; RULESET // v0.1.0-ALPHA</div>
              <h1 class="hero-title">2050 TRPG 规则不全书</h1>
              <div class="hero-serif-sub">“ 主打重 RP、轻规则、BD 构筑的都市奇幻 —— PC 在一个巨大的都市里生活与冒险。 ”</div>
              <p class="hero-desc">
                本书中标记为 WIP 的资源表示该内容仍在构建与数值测试中（别问为什么都是 WIP）。
                本规则是主包游玩 TRPG 后突发奇想设计的个人 TRPG 规则，采用双等级系统（生物 10 级 + 职业 10 级）
                共同构建 20 级角色，仅供测试跑团与规则框架搭建使用。
              </p>
              <div class="hero-actions">
                <a :href="withBase('/core/rules')" class="vp-btn-primary">
                  <span>进入核心文档</span>
                  <span>→</span>
                </a>
                <a :href="withBase('/dev-log')" class="vp-btn-secondary">
                  <span>查看开发日志</span>
                </a>
              </div>
            </div>
          </article>

          <!-- 卡片 02：档案状态 / 快速索引卡 -->
          <article
            class="acrylic-card card-index"
            :class="{ 'is-dragging': draggingId === 'MOD-02' }"
            data-card-id="MOD-02"
            :style="cardStyle('MOD-02')"
          >
            <span class="corner-mark corner-tl"></span>
            <span class="corner-mark corner-tr"></span>
            <span class="corner-mark corner-bl"></span>
            <span class="corner-mark corner-br"></span>

            <div class="card-drag-bar">
              <div class="card-index-tag">
                <span class="num-box">02</span>
                <span>CREATOR_PROFILE // 档案状态与索引</span>
              </div>
              <span class="card-coords">
                X:{{ displayCoord('MOD-02', 'x') }} Y:{{ displayCoord('MOD-02', 'y') }}
              </span>
            </div>

            <div class="card-body">
              <h2 class="placeholder-title">
                <span>猫头猫头猫 // 施工中的规则框架</span>
              </h2>
              <p class="placeholder-text">
                整体处于施工阶段，数值随时可能推翻重写。目前动作系统与部分名词借用自通用 D20/PF 协议，
                便于快速理解；双等级系统共同构建 20 级角色。
              </p>
              <div class="hazard-strip"></div>
              <ul class="placeholder-list">
                <li>
                  <a :href="withBase('/characters/bio-rules')">生物等级速查</a>
                  <span class="arrow">LINK // 01 →</span>
                </li>
                <li>
                  <a :href="withBase('/classes/hero')">职业模块速查 (1-5 级)</a>
                  <span class="arrow">LINK // 02 →</span>
                </li>
                <li>
                  <a :href="withBase('/lore/factions')">阵营与势力设定</a>
                  <span class="arrow">LINK // 03 →</span>
                </li>
              </ul>
            </div>
          </article>

          <!-- 卡片 03：核心系统入口 -->
          <article
            class="acrylic-card card-feature"
            :class="{ 'is-dragging': draggingId === 'MOD-03' }"
            data-card-id="MOD-03"
            :style="cardStyle('MOD-03')"
          >
            <span class="corner-mark corner-tl"></span>
            <span class="corner-mark corner-tr"></span>
            <span class="corner-mark corner-bl"></span>
            <span class="corner-mark corner-br"></span>

            <div class="card-drag-bar">
              <div class="card-index-tag">
                <span class="num-box">03</span>
                <span>SECTION_A // 核心系统</span>
              </div>
              <span class="card-coords">
                X:{{ displayCoord('MOD-03', 'x') }} Y:{{ displayCoord('MOD-03', 'y') }}
              </span>
            </div>

            <div class="card-body">
              <h3 class="placeholder-title">核心系统</h3>
              <p class="placeholder-text">
                规则总纲、影响度与破坏力、动作系统、绝技（Maneuvers）、类型系统、检定与动作轮、属性系统
                ——全部底层机制集中于此，早期测试版数值仍在施工。
              </p>
              <div class="card-footer-meta">
                <span>DOC_COUNT: 10</span>
                <a :href="withBase('/core/rules')" class="card-link">进入核心系统 →</a>
              </div>
            </div>
          </article>

          <!-- 卡片 04：种族入口 -->
          <article
            class="acrylic-card card-feature"
            :class="{ 'is-dragging': draggingId === 'MOD-04' }"
            data-card-id="MOD-04"
            :style="cardStyle('MOD-04')"
          >
            <span class="corner-mark corner-tl"></span>
            <span class="corner-mark corner-tr"></span>
            <span class="corner-mark corner-bl"></span>
            <span class="corner-mark corner-br"></span>
            <div class="orange-tape">FEATURED</div>

            <div class="card-drag-bar">
              <div class="card-index-tag">
                <span class="num-box orange">04</span>
                <span>SECTION_B // 种族模块</span>
              </div>
              <span class="card-coords">
                X:{{ displayCoord('MOD-04', 'x') }} Y:{{ displayCoord('MOD-04', 'y') }}
              </span>
            </div>

            <div class="card-body">
              <h3 class="placeholder-title">种族 (Bio 1-10)</h3>
              <p class="placeholder-text">
                人类、精灵（Animism）、半神（Demigod）、人形（Android）与第二类恶魔（Type-II Demon）
                ——生物等级 1-10 的种族框架，含种族与亚种规则。
              </p>
              <div class="card-footer-meta">
                <span>STATUS: WIP // 7 份档案</span>
                <a :href="withBase('/characters/ancestries')" class="card-link">浏览种族档案 →</a>
              </div>
            </div>
          </article>

          <!-- 卡片 05：职业入口 -->
          <article
            class="acrylic-card card-feature"
            :class="{ 'is-dragging': draggingId === 'MOD-05' }"
            data-card-id="MOD-05"
            :style="cardStyle('MOD-05')"
          >
            <span class="corner-mark corner-tl"></span>
            <span class="corner-mark corner-tr"></span>
            <span class="corner-mark corner-bl"></span>
            <span class="corner-mark corner-br"></span>

            <div class="card-drag-bar">
              <div class="card-index-tag">
                <span class="num-box">05</span>
                <span>SECTION_C // 职业模块</span>
              </div>
              <span class="card-coords">
                X:{{ displayCoord('MOD-05', 'x') }} Y:{{ displayCoord('MOD-05', 'y') }}
              </span>
            </div>

            <div class="card-body">
              <h3 class="placeholder-title">职业 (Class 1-10)</h3>
              <p class="placeholder-text">
                英雄、格斗家、灵修士与四系施法者（法师／术士／超能力者／现实扭曲者）
                ——职业等级 1-10 的构筑模块，专长树与法术系统仍在补全。
              </p>
              <div class="card-footer-meta">
                <span>UPDATED: 2026-08-27</span>
                <a :href="withBase('/classes/hero')" class="card-link">浏览职业模块 →</a>
              </div>
            </div>
          </article>

          <!-- 卡片 06：底部通栏日志与材质浓度实时微调条 -->
          <article
            class="acrylic-card card-footer-dock"
            :class="{ 'is-dragging': draggingId === 'MOD-06' }"
            data-card-id="MOD-06"
            :style="cardStyle('MOD-06')"
          >
            <span class="corner-mark corner-tl"></span>
            <span class="corner-mark corner-tr"></span>
            <span class="corner-mark corner-bl"></span>
            <span class="corner-mark corner-br"></span>

            <div style="flex: 1; min-width: 280px;">
              <div class="card-index-tag" style="margin-bottom: 6px;">
                <span class="num-box">06</span>
                <span style="font-family: var(--font-mono); font-size: 11px;">CHANGELOG &amp; MATERIAL_TUNER // 底部备注栏</span>
              </div>
              <div style="font-size: 13px; color: #3A3937;">
                最近更新：<a :href="withBase('/truth')" class="footer-repo-link">真相：帷幕之下</a>
                与 <a :href="withBase('/intro')" class="footer-repo-link">引言</a> 已上线 ｜ 项目仓库：
                <a href="https://github.com/Roachu999/2050-TRPG" target="_blank" rel="noreferrer" class="footer-repo-link">github.com/Roachu999/2050-TRPG</a>
                （欢迎提交 Issue 与反馈）
              </div>
            </div>

            <!-- 方便直观测试不同乳白浓度的微调滑块 -->
            <div class="acrylic-tuner">
              <span>乳白亚克力不透明度: <strong>{{ acrylicOpacity }}%</strong></span>
              <input type="range" v-model.number="acrylicOpacity" min="50" max="96" />
            </div>
          </article>
        </section>
      </div>
    </main>
  </div>
</template>
