// 随机封面 - 从每篇文章页面中获取随机图片
(function() {
  var FALLBACK = 'https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/doubao/web/doubao_avatar.png';
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

  function applyCover(img, images) {
    if (!images || images.length === 0) return;
    var chosen = pickRandom(images);
    if (!chosen) return;

    img.setAttribute('src', chosen);
    img.setAttribute('srcset', '');
    img.style.objectFit = 'cover';
    img.setAttribute('onerror', "this.onerror=null;this.src='" + FALLBACK + "';this.style.objectFit='contain'");
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
