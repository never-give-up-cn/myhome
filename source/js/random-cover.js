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
      var img = card.querySelector('img.post-bg');
      if (!img) return;

      // 优先使用 data-photos 属性（主题已内联在 HTML 中）
      if (img.dataset.photos) {
        try {
          var photos = JSON.parse(img.dataset.photos);
          if (photos && photos.length > 0) {
            applyCover(img, photos);
            count++;
            if (count === cards.length) processing = false;
            return;
          }
        } catch(e) {
          // fallback
        }
      }

      // data-photos 为空时尝试 XHR 抓取
      var link = card.querySelector('a');
      if (!link) { count++; if (count === cards.length) processing = false; return; }

      var href = link.getAttribute('href');
      if (!href) { count++; if (count === cards.length) processing = false; return; }

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
  // 多图标组合（每次随机选 3-4 个组合）
  var iconCombos = [
    ['photography','network','server'],
    ['server','switch','virtualization'],
    ['wifi','network','security'],
    ['iot','wifi','computer'],
    ['photography','surveillance','iot'],
    ['network','server','security','switch'],
    ['photography','computer','iot','wifi'],
    ['server','virtualization','network','security'],
    ['surveillance','iot','wifi','photography'],
    ['switch','network','server','virtualization']
  ];

  var iconSvgs = {
    photography: '<path d="M-30,-22 L30,-22 L30,22 L-30,22 Z" stroke="white" stroke-width="2.5" fill="none" rx="4"/><circle cx="0" cy="0" r="12" stroke="white" stroke-width="2" fill="none"/><circle cx="0" cy="0" r="7" fill="rgba(255,255,255,0.15)"/><rect x="20" y="-28" width="7" height="5" fill="rgba(255,255,255,0.3)"/><ellipse cx="-3" cy="-3" rx="3" ry="1.5" fill="rgba(255,255,255,0.35)" transform="rotate(-30,-3,-3)"/>',
    network: '<rect x="-32" y="-8" width="64" height="16" rx="3" stroke="white" stroke-width="2" fill="none"/><circle cx="-18" cy="0" r="3" fill="rgba(255,255,255,0.2)"/><circle cx="0" cy="0" r="3" fill="rgba(255,255,255,0.2)"/><circle cx="18" cy="0" r="3" fill="rgba(255,255,255,0.2)"/><rect x="-32" y="-26" width="64" height="14" rx="2" stroke="white" stroke-width="1.5" fill="none" opacity="0.5"/><rect x="-32" y="12" width="64" height="14" rx="2" stroke="white" stroke-width="1.5" fill="none" opacity="0.5"/>',
    server: '<rect x="-28" y="-28" width="56" height="56" rx="3" stroke="white" stroke-width="2.5" fill="none"/><rect x="-22" y="-20" width="44" height="7" rx="1" fill="rgba(255,255,255,0.12)"/><rect x="-22" y="-8" width="44" height="7" rx="1" fill="rgba(255,255,255,0.12)"/><rect x="-22" y="4" width="44" height="7" rx="1" fill="rgba(255,255,255,0.12)"/><circle cx="20" cy="-24" r="2" fill="rgba(46,204,113,0.6)"/>',
    switch: '<rect x="-28" y="-18" width="56" height="36" rx="3" stroke="white" stroke-width="2.5" fill="none"/><rect x="-24" y="-14" width="12" height="9" rx="1.5" fill="rgba(255,255,255,0.12)"/><rect x="-8" y="-14" width="12" height="9" rx="1.5" fill="rgba(255,255,255,0.12)"/><rect x="8" y="-14" width="12" height="9" rx="1.5" fill="rgba(255,255,255,0.12)"/><rect x="-24" y="-1" width="48" height="5" rx="1" fill="rgba(255,255,255,0.08)"/><rect x="-24" y="7" width="48" height="5" rx="1" fill="rgba(255,255,255,0.08)"/><circle cx="21" cy="-14" r="1.5" fill="rgba(46,204,113,0.5)"/>',
    virtualization: '<rect x="-26" y="-32" width="52" height="64" rx="4" stroke="white" stroke-width="2.5" fill="none"/><rect x="-20" y="-26" width="40" height="26" rx="2" fill="rgba(255,255,255,0.08)"/><text x="0" y="-12" text-anchor="middle" font-size="8" fill="rgba(255,255,255,0.35)" font-family="monospace">VM</text><line x1="-16" y1="6" x2="16" y2="6" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/><line x1="-16" y1="11" x2="16" y2="11" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/><line x1="-16" y1="16" x2="16" y2="16" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/><line x1="-16" y1="21" x2="16" y2="21" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/><circle cx="20" cy="-20" r="1.5" fill="rgba(46,204,113,0.5)"/>',
    iot: '<circle cx="0" cy="-8" r="13" stroke="white" stroke-width="2.5" fill="none"/><path d="M-18,8 L-10,0 L-6,12 L2,-4 L10,12 L14,0 L22,8" stroke="white" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M-26,18 L-16,13 L-7,22 L2,10 L11,22 L20,13 L30,18" stroke="white" stroke-width="1.2" fill="none" stroke-linejoin="round" opacity="0.35"/><circle cx="4" cy="-10" r="1.5" fill="rgba(255,255,255,0.4)"/>',
    computer: '<rect x="-32" y="-24" width="64" height="46" rx="4" stroke="white" stroke-width="2.5" fill="none"/><rect x="-28" y="-20" width="56" height="20" rx="2" fill="rgba(255,255,255,0.08)"/><rect x="-28" y="4" width="24" height="14" rx="1.5" fill="rgba(255,255,255,0.06)"/><rect x="-2" y="4" width="28" height="14" rx="1.5" fill="rgba(255,255,255,0.06)"/><line x1="-18" y1="16" x2="20" y2="16" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>',
    security: '<path d="M-6,-32 Q-30,-32 -30,-10 Q-30,12 -12,18 L-12,30 L12,30 L12,18 Q30,12 30,-10 Q30,-32 6,-32 Z" stroke="white" stroke-width="2.5" fill="none"/><path d="M-10,4 L-10,18 L10,18 L10,4" stroke="white" stroke-width="1.8" fill="none"/><path d="M-18,-12 L-12,-12 L-6,-6" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="0" cy="0" rx="8" ry="6" fill="rgba(255,255,255,0.1)"/>',
    wifi: '<circle cx="-12" cy="0" r="9" stroke="white" stroke-width="2.5" fill="none"/><rect x="4" y="-7" width="28" height="14" rx="3" stroke="white" stroke-width="2" fill="none"/><line x1="-12" y1="-9" x2="-12" y2="-20" stroke="white" stroke-width="2"/><line x1="-20" y1="-16" x2="-4" y2="-16" stroke="white" stroke-width="1.2" opacity="0.4"/><path d="M-24,-18 Q-26,-28 -20,-32" stroke="white" stroke-width="1.2" fill="none" opacity="0.25"/>',
    surveillance: '<circle cx="0" cy="-4" r="16" stroke="white" stroke-width="2.5" fill="none"/><path d="M-22,14 Q-22,30 0,30 Q22,30 22,14" stroke="white" stroke-width="2" fill="none"/><circle cx="-4" cy="-6" r="2.5" fill="rgba(255,255,255,0.15)"/><circle cx="4" cy="-6" r="2.5" fill="rgba(255,255,255,0.15)"/><path d="M-3,2 Q0,5 3,2" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.3"/>'
  };

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
          img.setAttribute('src', drawMultiIconCanvas());
          img.style.objectFit = 'cover';
          img.style.padding = '0';
          img.style.background = 'none';
        };
        return;
      }
    }

    // 没找到图片 → 随机多图标组合
    img.setAttribute('src', drawMultiIconCanvas());
    img.setAttribute('srcset', '');
    img.style.objectFit = 'cover';
    img.style.padding = '0';
    img.style.background = 'none';
  }

  // 绘制多图标组合图（同步版，用 canvas 原生绘图）
  function drawMultiIconCanvas() {
    var w = 800, h = 600;
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');

    // 渐变背景
    var grad = ctx.createLinearGradient(0, 0, w * 0.7, h);
    var ci = Math.floor(Math.random() * (themeColors.length - 1));
    grad.addColorStop(0, themeColors[ci][0]);
    grad.addColorStop(0.5, themeColors[ci][1]);
    grad.addColorStop(1, themeColors[ci][0]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 装饰光晕
    for (var s = 0; s < 6; s++) {
      var sx = Math.random() * w, sy = Math.random() * h, sr = 60 + Math.random() * 100;
      var c = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      c.addColorStop(0, 'rgba(255,255,255,0.08)');
      c.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }

    // 散点
    for (var d = 0; d < 50; d++) {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.03 + Math.random() * 0.08) + ')';
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 选一组图标 3-4 个
    var combo = iconCombos[Math.floor(Math.random() * iconCombos.length)];
    var count = combo.length;
    var cols = 2, rows = 2;
    var cellW = w / cols, cellH = h / rows;
    var rad = Math.min(cellW, cellH) * 0.3;

    for (var i = 0; i < count && i < 4; i++) {
      var col = i % cols, row = Math.floor(i / cols);
      var cx = col * cellW + cellW / 2, cy = row * cellH + cellH / 2;
      var name = combo[i];

      ctx.save();
      ctx.translate(cx, cy);

      // 图标圆形底
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.arc(0, 0, rad * 0.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, rad * 0.7, 0, Math.PI * 2);
      ctx.stroke();

      var s = rad * 0.55;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2.5;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';

      // 根据图标名称绘制不同形状
      if (name === 'photography') {
        ctx.strokeRect(-s*0.8, -s*0.6, s*1.6, s*1.2);
        ctx.beginPath(); ctx.arc(0, 0, s*0.4, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, s*0.25, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(s*0.6, -s*0.8, s*0.25, s*0.2);
      } else if (name === 'network') {
        for (var n = 0; n < 3; n++) {
          var ny = -s*0.7 + n * s*0.7;
          ctx.strokeRect(-s*0.9, ny, s*1.8, s*0.45);
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.beginPath(); ctx.arc(0, ny + s*0.22, s*0.1, 0, Math.PI*2); ctx.fill();
        }
      } else if (name === 'server') {
        ctx.strokeRect(-s*0.8, -s*0.9, s*1.6, s*1.8);
        for (var sv = 0; sv < 4; sv++) {
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect(-s*0.65, -s*0.65 + sv * s*0.38, s*1.3, s*0.22);
        }
        ctx.fillStyle = 'rgba(46,204,113,0.5)';
        ctx.beginPath(); ctx.arc(s*0.55, -s*0.75, s*0.07, 0, Math.PI*2); ctx.fill();
      } else if (name === 'switch') {
        ctx.strokeRect(-s*0.85, -s*0.55, s*1.7, s*1.1);
        for (var sw = 0; sw < 3; sw++) {
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect(-s*0.7 + sw * s*0.5, -s*0.4, s*0.35, s*0.25);
        }
        ctx.fillStyle = 'rgba(46,204,113,0.5)';
        ctx.beginPath(); ctx.arc(s*0.6, -s*0.4, s*0.05, 0, Math.PI*2); ctx.fill();
      } else if (name === 'virtualization') {
        ctx.strokeRect(-s*0.75, -s*0.95, s*1.5, s*1.9);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(-s*0.55, -s*0.75, s*1.1, s*0.7);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = Math.round(s*0.3) + 'px monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('VM', 0, -s*0.4);
        for (var vm = 0; vm < 4; vm++) {
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.fillRect(-s*0.55, s*0.1 + vm * s*0.3, s*1.1, s*0.18);
        }
      } else if (name === 'iot') {
        ctx.beginPath(); ctx.arc(0, -s*0.2, s*0.4, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -s*0.2, s*0.15, 0, Math.PI*2); ctx.fill();
        var iotR = s*0.55;
        for (var io = 0; io < 5; io++) {
          var ang = -Math.PI/2 + (io-2)*0.6;
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.beginPath();
          ctx.arc(Math.cos(ang)*iotR, -s*0.2 + Math.sin(ang)*iotR, s*0.05, 0, Math.PI*2);
          ctx.fill();
        }
      } else if (name === 'security') {
        ctx.beginPath();
        ctx.moveTo(0, -s*0.95);
        ctx.lineTo(-s*0.85, -s*0.5);
        ctx.lineTo(-s*0.85, s*0.2);
        ctx.lineTo(0, s*0.9);
        ctx.lineTo(s*0.85, s*0.2);
        ctx.lineTo(s*0.85, -s*0.5);
        ctx.closePath(); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s*0.3, -s*0.3);
        ctx.moveTo(0, 0); ctx.lineTo(-s*0.2, s*0.1);
        ctx.stroke();
      } else if (name === 'wifi') {
        ctx.beginPath(); ctx.arc(-s*0.3, 0, s*0.3, 0, Math.PI*2); ctx.stroke();
        ctx.strokeRect(s*0.15, -s*0.2, s*0.7, s*0.4);
        ctx.beginPath();
        ctx.moveTo(-s*0.3, -s*0.7);
        ctx.lineTo(-s*0.3, -s*0.9);
        ctx.stroke();
        for (var wf = 0; wf < 2; wf++) {
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect(s*0.25, -s*0.12 + wf * s*0.24, s*0.5, s*0.15);
        }
      } else if (name === 'surveillance') {
        ctx.beginPath(); ctx.arc(0, -s*0.15, s*0.5, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-s*0.65, s*0.4); ctx.quadraticCurveTo(0, s*0.85, s*0.65, s*0.4);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.arc(0, -s*0.15, s*0.2, 0, Math.PI*2); ctx.fill();
      }

      ctx.restore();
    }

    return canvas.toDataURL();
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
