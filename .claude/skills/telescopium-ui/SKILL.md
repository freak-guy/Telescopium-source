---
name: telescopium-ui
description: Telescopium 静态博客 UI 美化规范。用于修改 Hexo 主题、液态玻璃、深空科技风、文章卡片、导航栏、Hero 区和阅读体验。
---

# Telescopium UI Skill

## 目标

将 Telescopium 博客设计成高级、克制、医学科研气质的深空液态玻璃风格。

## 禁止事项

- 不要使用普通 Bootstrap 风格
- 不要使用廉价霓虹灯效果
- 不要大面积高饱和蓝紫渐变
- 不要让文字可读性下降
- 不要堆叠过多动画
- 不要破坏 Hexo generate
- 不要修改服务器配置
- 不要部署

## 品牌风格

- Deep Space Luxury UI
- Liquid Glass
- Minimal Scientific Interface
- Apple-like depth
- Vercel-like restraint
- OpenAI-like quiet technology

## 色彩系统

- 主背景：#080B14
- 深层背景：#111827
- 品牌蓝：#3B82F6
- 品牌紫：#8B5CF6
- 主文字：#F8FAFC
- 次文字：#94A3B8
- 边框：rgba(255,255,255,0.16)
- 玻璃背景：rgba(255,255,255,0.08)

## 液态玻璃组件标准

每个玻璃组件必须包含：

1. 半透明背景
2. backdrop-filter blur
3. -webkit-backdrop-filter
4. 细边框
5. 内部高光
6. 柔和阴影
7. hover 时轻微位移，不超过 4px

推荐 CSS：

```css
.liquid-glass {
  position: relative;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04));
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.22),
    0 24px 80px rgba(0,0,0,0.38);
}
