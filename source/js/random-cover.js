// 随机封面 - 从每篇文章页面中获取随机图片
(function() {
  var cache = {};
  var processing = false;

  function pickRandom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getArticleImages(html) {
    var results = [];
    // 从 article-container 中提取所有图片
    var match = html.match(/id="article-container"[^>]*>([\s\S]*?)<\/article>/);
    var content = match ? match[1] : html;

    // 提取所有 img src
    var srcRegex = /src="([^"]*\.(jpg|jpeg|png|webp|svg))"/gi;
    var match2;
    while ((match2 = srcRegex.exec(content)) !== null) {
      var src = match2[1];
      // 跳过头像、图标等
      if (/avatar|icon|logo|favicon|emoji|banner/i.test(src)) continue;
      if (results.indexOf(src) === -1) results.push(src);
    }

    // 如果没找到，从整个页面找
    if (results.length === 0) {
      var allSrcRegex = /src="([^"]*\.(jpg|jpeg|png))"/gi;
      while ((match2 = allSrcRegex.exec(html)) !== null) {
        var src2 = match2[1];
        if (/avatar|icon|logo|favicon/i.test(src2)) continue;
        if (/cover/i.test(src2)) continue;
        if (results.indexOf(src2) === -1) results.push(src2);
      }
    }

    return results;
  }

  function randomizeCovers() {
    if (processing) return;
    processing = true;

    var cards = document.querySelectorAll('.post_cover');
    if (!cards || cards.length === 0) {
      processing = false;
      return;
    }

    var count = 0;

    cards.forEach(function(card) {
      var link = card.querySelector('a');
      var img = card.querySelector('img.post-bg');
      if (!link || !img) return;

      var href = link.getAttribute('href');
      if (!href) return;

      var fullUrl = href.startsWith('http') ? href : window.location.origin + href;

      if (cache[fullUrl]) {
        applyCover(img, cache[fullUrl]);
        count++;
        if (count === cards.length) processing = false;
        return;
      }

      var xhr = new XMLHttpRequest();
      xhr.open('GET', fullUrl, true);
      xhr.timeout = 5000;

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 400) {
          var images = getArticleImages(xhr.responseText);
          cache[fullUrl] = images;
          applyCover(img, images);
        }
        count++;
        if (count === cards.length) processing = false;
      };

      xhr.onerror = function() { count++; if (count === cards.length) processing = false; };
      xhr.ontimeout = function() { count++; if (count === cards.length) processing = false; };
      xhr.send();
    });
  }

  // 色彩方案 - 不同分类对应不同渐变
  var themeColors = [
    ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'], ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'], ['#a18cd1', '#fbc2eb'],
    ['#fccb90', '#d57eeb'], ['#e0c3fc', '#8ec5fc'],
    ['#0c3483', '#a2b6df'], ['#fc5c7d', '#6a82fb'],
    ['#2b5876', '#4e4376'], ['#c0392b', '#8e44ad']
  ];

  function generateArtImage(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');

    // 随机颜色组合
    var colors = themeColors[Math.floor(Math.random() * themeColors.length)];

    // 渐变背景
    var grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(0.5, colors[1]);
    grad.addColorStop(1, colors[0]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 装饰圆
    for (var i = 0; i < 5; i++) {
      var x = Math.random() * width;
      var y = Math.random() * height;
      var r = 30 + Math.random() * 120;
      var c = ctx.createRadialGradient(x, y, 0, x, y, r);
      c.addColorStop(0, 'rgba(255,255,255,0.15)');
      c.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 相机图标（中心偏上）
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2.5;
    var cx = width / 2, cy = height * 0.42;
    ctx.strokeRect(cx - 24, cy - 16, 48, 32);
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toDataURL();
  }

  function applyCover(img, images) {
    if (images && images.length > 0) {
      var picked = pickRandom(images);
      if (picked) {
        img.setAttribute('src', picked);
        img.setAttribute('srcset', '');
        img.style.objectFit = 'cover';
        img.onerror = function() {
          img.onerror = null;
          img.setAttribute('src', generateArtImage(800, 600));
          img.style.objectFit = 'cover';
        };
        return;
      }
    }

    // 没找到图片 → 生成渐变艺术图
    img.setAttribute('src', generateArtImage(800, 600));
    img.setAttribute('srcset', '');
    img.style.objectFit = 'cover';
  }

  // 加载执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', randomizeCovers);
  } else {
    randomizeCovers();
  }

  // PJAX
  document.addEventListener('pjax:complete', function() { cache = {}; randomizeCovers(); });
  if (typeof btf !== 'undefined' && btf.addGlobalFn) {
    btf.addGlobalFn('pjaxComplete', function() { cache = {}; randomizeCovers(); }, 'randomCover');
  }
})();
