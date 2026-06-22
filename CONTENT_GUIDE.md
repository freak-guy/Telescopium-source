# Telescopium 内容标签体系

## 中文标签（Tags）

建议每篇文章使用 2–4 个标签，优先从以下体系中选择：

| 标签 | 适用场景 |
|------|---------|
| `科研笔记` | 课题设计、实验记录、研究方法论 |
| `医学随笔` | 临床观察、病例分析、医学人文 |
| `文献阅读` | 论文精读、文献综述、读书笔记 |
| `AI工具` | AI 产品试用、Prompt 工程、模型评测 |
| `技术实践` | 开发记录、部署运维、工具配置 |
| `个人札记` | 阶段性总结、年度回顾、杂感 |
| `长文` | 超过 2000 字的深度文章 |

## 英文分类（Categories）

每篇文章建议只设 1 个 category：

| Category | 对应内容 |
|----------|---------|
| `Research` | 科研方法、论文阅读、实验记录 |
| `Medicine` | 医学思考、临床观察、病例 |
| `Reading` | 读书笔记、文献摘录 |
| `AI` | 人工智能相关 |
| `Tech` | 技术开发、工具实践 |
| `Notes` | 随笔、札记、日志 |

## 使用原则

1. **每篇文章 1 个 category**，保持分类清晰不重叠
2. **每篇文章 2–4 个 tags**，足够精确但不冗余
3. **避免低信息密度标签**：不要使用 `Test`、`其他`、`介绍`、`未分类` 等
4. **标签命名保持统一**：同一概念使用同一个标签名，不要混用近义词
5. **分类优先于标签**：先确定 category，再用 tags 补充细节维度

## Front-matter 标准格式

每篇文章的 YAML 头部应包含以下字段：

```markdown
---
title: 文章标题
date: YYYY-MM-DD HH:mm:ss
categories: Notes          # 六选一：Research / Medicine / Reading / AI / Tech / Notes
tags:
  - 个人札记              # 从中文标签体系中选 2–4 个
  - 长文
excerpt: 80–140 字的中文摘要，简洁说明文章主题，不重复标题。
cover: /assets/images/covers/default-cover.png   # 文章封面图路径
---
```

### excerpt 写法

- 长度：80–140 字
- 语言：中文为主
- 内容：简要说明文章主题，不重复标题
- 风格：克制、准确，不要营销化
- 首页文章卡片会自动截取前 130 字显示

### cover 字段使用规则

| 文章分类 | 推荐封面 |
|---------|---------|
| Research | `/assets/images/covers/research-cover.png` |
| Medicine | `/assets/images/covers/medicine-cover.png` |
| AI 或 Tech | `/assets/images/covers/ai-tools-cover.png` |
| Reading 或 Notes | `/assets/images/covers/personal-logs-cover.png` |
| 无法判断 | `/assets/images/covers/default-cover.png` |

封面图会在首页文章卡片顶部以 16:9 比例显示，带有暗色渐变遮罩。
如果文章不设 cover 字段，卡片将不显示封面图，保持纯文字布局。

### 图片放置路径

| 用途 | 路径 |
|------|------|
| 文章封面 | `source/assets/images/covers/` |
| 文章内嵌 | `source/assets/images/posts/` |
| 引用方式 | `![描述](/assets/images/posts/slug-01.png)` |

## 示例

```markdown
---
title: GPT-4 在临床诊断中的辅助应用初探
date: 2026-07-01 09:00:00
categories: AI
tags:
  - AI工具
  - 医学随笔
  - 长文
excerpt: 基于近期临床案例，探讨 GPT-4 在辅助鉴别诊断中的表现、局限性与潜在应用方向。
cover: /assets/images/covers/ai-tools-cover.png
---
```
