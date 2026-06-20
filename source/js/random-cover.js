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

  // 色彩方案
  var themeColors = [
    ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'], ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'], ['#a18cd1', '#fbc2eb'],
    ['#fccb90', '#d57eeb'], ['#0c3483', '#a2b6df'],
    ['#fc5c7d', '#6a82fb'], ['#2b5876', '#4e4376'],
    ['#11998e', '#38ef7d'], ['#fc4a1a', '#f7b733'],
    ['#00b4db', '#0083b0'], ['#b224ef', '#7579ff'],
    ['#654ea3', '#eaafc8'], ['#ed213a', '#93291e']
  ];

  function generateArtImage(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    var colors = themeColors[Math.floor(Math.random() * themeColors.length)];

    // 1. 渐变主背景
    var grad = ctx.createLinearGradient(0, 0, width * 0.7, height);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(0.6, colors[1]);
    grad.addColorStop(1, colors[0]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. 大装饰圆（柔光晕）
    var spots = [
      [width * 0.8, height * 0.2, 200],
      [width * 0.2, height * 0.8, 160],
      [width * 0.5, height * 0.5, 100],
      [width * 0.9, height * 0.7, 140],
      [width * 0.1, height * 0.3, 120]
    ];
    for (var s = 0; s < spots.length; s++) {
      var sp = spots[s];
      var c = ctx.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], sp[2]);
      c.addColorStop(0, 'rgba(255,255,255,0.12)');
      c.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(sp[0], sp[1], sp[2], 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. 网格线条装饰
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (var gx = 0; gx < width; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx + 30, height);
      ctx.stroke();
    }
    for (var gy = 0; gy < height; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy + 20);
      ctx.stroke();
    }

    // 4. 随机三角形
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (var t = 0; t < 6; t++) {
      var tx = Math.random() * width;
      var ty = Math.random() * height;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + 30 + Math.random() * 60, ty - 20 - Math.random() * 40);
      ctx.lineTo(tx - 20 - Math.random() * 40, ty + 20 + Math.random() * 40);
      ctx.closePath();
      ctx.fill();
    }

    // 5. 相机图标（中心偏上）
    var cx = width / 2, cy = height * 0.38;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    // 机身
    ctx.strokeRect(cx - 28, cy - 18, 56, 36);
    // 顶部闪光
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(cx + 18, cy - 22, 8, 6);
    // 镜头
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();
    // 内圈
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // 镜头光晕
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.ellipse(cx - 4, cy - 4, 3, 2, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // 6. 底部文字区域
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(width * 0.15, height * 0.78, width * 0.7, 2);

    // 7. 四角装饰
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    var d = 30;
    // 左上
    ctx.beginPath(); ctx.moveTo(d, 0); ctx.lineTo(d, d); ctx.lineTo(0, d); ctx.stroke();
    // 右上
    ctx.beginPath(); ctx.moveTo(width - d, 0); ctx.lineTo(width - d, d); ctx.lineTo(width, d); ctx.stroke();
    // 左下
    ctx.beginPath(); ctx.moveTo(d, height); ctx.lineTo(d, height - d); ctx.lineTo(0, height - d); ctx.stroke();
    // 右下
    ctx.beginPath(); ctx.moveTo(width - d, height); ctx.lineTo(width - d, height - d); ctx.lineTo(width, height - d); ctx.stroke();

    // ========== 13. 山脉/波形底部 ==========
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.beginPath(); ctx.moveTo(0, height);
    for (var mx = 0; mx <= width; mx += 3) {
      ctx.lineTo(mx, height - 30 - Math.sin(mx * 0.005) * 25 - Math.sin(mx * 0.012) * 15 - Math.sin(mx * 0.025) * 8);
    }
    ctx.lineTo(width, height); ctx.closePath(); ctx.fill();

    // ========== 14. 第二层山脉 ==========
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.beginPath(); ctx.moveTo(0, height);
    for (var mx2 = 0; mx2 <= width; mx2 += 3) {
      ctx.lineTo(mx2, height - 50 - Math.sin(mx2 * 0.008 + 1) * 30 - Math.sin(mx2 * 0.018) * 12);
    }
    ctx.lineTo(width, height); ctx.closePath(); ctx.fill();

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
