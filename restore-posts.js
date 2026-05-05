const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync('content.json', 'utf8');
const data = JSON.parse(raw);

const postsDir = path.join('source', '_posts');
if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });

function cleanFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, '-');
}

for (const post of data.posts || []) {
  const title = post.title || 'untitled';
  const date = post.date || new Date().toISOString();
  const tags = (post.tags || []).map(t => t.name || t);
  const categories = (post.categories || []).map(c => c.name || c);
  const body = post.text || post.content || '';

  const frontMatter = `---
title: ${title}
date: ${date}
tags:
${tags.map(t => `  - ${t}`).join('\n')}
categories:
${categories.map(c => `  - ${c}`).join('\n')}
---

`;

  fs.writeFileSync(
    path.join(postsDir, cleanFilename(title) + '.md'),
    frontMatter + body,
    'utf8'
  );

  console.log('Recovered:', title);
}

console.log('Done.');
