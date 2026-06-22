/**
 * Telescopium Blog — 轻量评论系统 前端脚本
 * API: https://api.telescopium.top/api/comments
 */
;(function () {
  'use strict';

  var API_BASE = 'https://api.telescopium.top/api/comments';

  // ── DOM 引用 ──
  var form = document.getElementById('comment-form');
  var list = document.getElementById('comments-list');
  var msg = document.getElementById('comment-message');
  var submitBtn = document.getElementById('comment-submit');
  var authorInput = document.getElementById('comment-author');
  var contentInput = document.getElementById('comment-content');

  if (!form || !list) return; // 非文章页，不存在评论区

  // ── 获取当前文章信息 ──
  var articlePath = window.location.pathname;
  // 确保末尾有 /
  if (articlePath.charAt(articlePath.length - 1) !== '/') {
    articlePath += '/';
  }
  var pageTitle = document.title || '';

  // ── 工具函数 ──
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function setMessage(text, isError) {
    msg.textContent = text;
    msg.className = 'comment-message' + (isError ? ' comment-message-error' : ' comment-message-success');
    if (text) {
      var hide = setTimeout(function () {
        msg.textContent = '';
        msg.className = 'comment-message';
      }, 5000);
      msg._hideTimer = hide;
    }
  }

  // ── 渲染评论列表 ──
  function renderComments(comments) {
    if (!list) return;

    // 清空
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    if (!comments || comments.length === 0) {
      var emptyEl = document.createElement('p');
      emptyEl.className = 'comments-empty';
      emptyEl.textContent = '暂无评论，欢迎留下第一条评论。';
      list.appendChild(emptyEl);
      return;
    }

    comments.forEach(function (c) {
      var card = document.createElement('div');
      card.className = 'comment-card';

      var meta = document.createElement('div');
      meta.className = 'comment-card-meta';

      var authorEl = document.createElement('span');
      authorEl.className = 'comment-card-author';
      authorEl.textContent = c.author || '匿名';

      var timeEl = document.createElement('span');
      timeEl.className = 'comment-card-time';
      timeEl.textContent = c.created_at || '';

      meta.appendChild(authorEl);
      meta.appendChild(timeEl);

      var bodyEl = document.createElement('div');
      bodyEl.className = 'comment-card-body';

      var contentP = document.createElement('p');
      contentP.textContent = c.content || '';

      bodyEl.appendChild(contentP);

      card.appendChild(meta);
      card.appendChild(bodyEl);
      list.appendChild(card);
    });
  }

  // ── 加载评论 ──
  function loadComments() {
    if (!list) return;

    // 显示加载状态
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
    var loadingEl = document.createElement('p');
    loadingEl.className = 'comments-loading';
    loadingEl.textContent = '加载中……';
    list.appendChild(loadingEl);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', API_BASE + '?path=' + encodeURIComponent(articlePath));
    xhr.timeout = 10000;

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var resp = JSON.parse(xhr.responseText);
          if (resp.code === 200) {
            renderComments(resp.data);
            return;
          }
        } catch (e) {
          // JSON 解析失败
        }
      }
      // 请求失败
      while (list.firstChild) {
        list.removeChild(list.firstChild);
      }
      var errEl = document.createElement('p');
      errEl.className = 'comments-error';
      errEl.textContent = '评论加载失败，请稍后再试。';
      list.appendChild(errEl);
    };

    xhr.onerror = function () {
      while (list.firstChild) {
        list.removeChild(list.firstChild);
      }
      var errEl = document.createElement('p');
      errEl.className = 'comments-error';
      errEl.textContent = '评论加载失败，请稍后再试。';
      list.appendChild(errEl);
    };

    xhr.ontimeout = function () {
      xhr.abort();
      while (list.firstChild) {
        list.removeChild(list.firstChild);
      }
      var errEl = document.createElement('p');
      errEl.className = 'comments-error';
      errEl.textContent = '评论加载超时，请稍后再试。';
      list.appendChild(errEl);
    };

    xhr.send();
  }

  // ── 提交评论 ──
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var author = authorInput.value.trim();
    var content = contentInput.value.trim();

    if (!author) {
      setMessage('请填写用户名', true);
      authorInput.focus();
      return;
    }

    if (author.length > 24) {
      setMessage('用户名不能超过 24 个字符', true);
      return;
    }

    if (!content) {
      setMessage('请填写评论内容', true);
      contentInput.focus();
      return;
    }

    if (content.length > 1000) {
      setMessage('评论内容不能超过 1000 个字符', true);
      return;
    }

    // 禁用按钮
    submitBtn.disabled = true;
    submitBtn.textContent = '正在发布……';
    setMessage('', false);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', API_BASE);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 15000;

    xhr.onload = function () {
      submitBtn.disabled = false;
      submitBtn.textContent = '发布评论';

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var resp = JSON.parse(xhr.responseText);
          if (resp.code === 200) {
            setMessage('评论发布成功', false);
            // 清空输入框
            contentInput.value = '';
            // 重新加载评论
            loadComments();
            return;
          } else {
            setMessage(resp.message || '评论发布失败，请稍后再试', true);
            return;
          }
        } catch (e) {
          // JSON 解析失败
        }
      }

      // 处理限流
      if (xhr.status === 429) {
        try {
          var resp429 = JSON.parse(xhr.responseText);
          setMessage(resp429.message || '评论过于频繁，请稍后再试', true);
        } catch (e) {
          setMessage('评论过于频繁，请稍后再试', true);
        }
        return;
      }

      setMessage('评论发布失败，请稍后再试', true);
    };

    xhr.onerror = function () {
      submitBtn.disabled = false;
      submitBtn.textContent = '发布评论';
      setMessage('网络错误，请稍后再试', true);
    };

    xhr.ontimeout = function () {
      submitBtn.disabled = false;
      submitBtn.textContent = '发布评论';
      xhr.abort();
      setMessage('请求超时，请稍后再试', true);
    };

    xhr.send(
      JSON.stringify({
        path: articlePath,
        page_title: pageTitle,
        author: author,
        content: content,
        website: '',
      })
    );
  });

  // ── 页面加载时获取评论 ──
  loadComments();
})();
