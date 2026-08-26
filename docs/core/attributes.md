---
title: 属性
---

<style>
.attr-phy { color: #d94a4a; font-weight: bold; }
.attr-str { color: #e8833c; font-weight: bold; }
.attr-agl { color: #d9a63c; font-weight: bold; }
.attr-end { color: #3fa968; font-weight: bold; }
.attr-fle { color: #1e8f5e; font-weight: bold; }
.attr-rea { color: #2aa6a0; font-weight: bold; }
.attr-men { color: #4a72d4; font-weight: bold; }
.attr-int { color: #8a5fd4; font-weight: bold; }
.attr-cha { color: #c05fd4; font-weight: bold; }
</style>

# 属性 <Badge type="warning" text="WIP" />

核心属性为三项，在建立人物时从三个核心选项的子选项里各选择一个作为你的主属性。未选择的那项则作为副属性。副属性在检定时，数值为主属性的一半，且向下取整。

::: tip 例子
身体能力为5、选择<span class="attr-str">力量</span>为核心时，<span class="attr-str">力量</span>检定数值为5，<span class="attr-agl">敏捷</span>为2。身体能力为10、<span class="attr-str">力量</span>核心时，<span class="attr-str">力量</span>检定数值为10，<span class="attr-agl">敏捷</span>为5。
:::

属性没有理论上限，但一般来讲，你只能通过自由属性点将单一属性提升到25。

| 颜色 | 属性 |
| --- | --- |
| <span style="color:#d94a4a">■</span> | <span class="attr-phy">身体能力</span>（<span class="attr-str">力量</span> / <span class="attr-agl">敏捷</span>） |
| <span style="color:#3fa968">■</span> | <span class="attr-end">耐力</span>（<span class="attr-fle">肉体</span> / <span class="attr-rea">反应</span>） |
| <span style="color:#4a72d4">■</span> | <span class="attr-men">精神能力</span>（<span class="attr-int">物质</span> / <span class="attr-cha">心灵</span>） |

## <span class="attr-phy">[身体能力]</span>

影响攻击时的命中与伤害检定、移动能力（数值×10米）、负重能力（数值×50KG）。

- **<span class="attr-str">力量</span>**：你认为一次打击就能击倒敌人更重要。选择<span class="attr-str">力量</span>作为核心，那么你的负重将会提升，变为数值×100KG。
- **<span class="attr-agl">敏捷</span>**：你认为连续不断的攻击更能击溃敌人。选择<span class="attr-agl">敏捷</span>作为核心，那么你的移动距离获得提升，变为数值×15米。此外，你的多重攻击减值降低。

## <span class="attr-end">[耐力]</span>

影响生命值（数值×10点）、伤害抗性、天生防御（数值/2）。

- **<span class="attr-fle">肉体</span>**：你认为强健的体魄才能让你更好地抵御危险。选择<span class="attr-fle">肉体</span>作为核心，那么你的最大生命值获得额外加值，额外提升数值×5点。
- **<span class="attr-rea">反应</span>**：你认为不被命中、或者躲开致命伤才能让你更好地防备危险。选择<span class="attr-rea">反应</span>作为核心，那么你的天生防御将获得提升，向上取整并+1。你获得你天生防御一半的常规伤害（打击、斩击、穿刺）抗性。

## <span class="attr-men">[精神能力]</span>

影响施法能力（施法者）、法术抗性（非施法者）。特殊职业技能。

- **<span class="attr-int">物质（智力）</span>**：你认为魔法是一门需要学习的高等科学，世界是物理的。你需要用公式、用方程来使用法术。
- **<span class="attr-cha">心灵（魅力）</span>**：你认为魔法不过是将你的个人意识投射到现实，世界是唯心的。你只需要想，就可以使用法术。
