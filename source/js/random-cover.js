// 随机封面 - 从每篇文章的页面内容中获取随机图片
(function() {
  var FALLBACK = 'https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/doubao/web/doubao_avatar.png';
  var cache = {};

  function pickRandom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // 获取文章中的图片（过滤掉图标、头像等小图）
  function extractArticleImages(html, baseUrl) {
    var images = [];
    var parser = document.createElement('div');
    parser.innerHTML = html;

    // 查找文章内容区域内的图片
    var articleContent = parser.querySelector('#article-container, .article-entry, .markdown-body, .post-content, [role="main"]');
    var imgs = (articleContent || parser).querySelectorAll('img');

    for (var i = 0; i < imgs.length; i++) {
      var src = imgs[i].getAttribute('src') || imgs[i].getAttribute('data-src') || '';
      if (!src) continue;

      // 跳过小图标、头像、表情等
      if (src.indexOf('avatar') > -1) continue;
      if (src.indexOf('icon') > -1) continue;
      if (src.indexOf('emoji') > -1) continue;
      if (src.indexOf('logo') > -1) continue;
      if (src.indexOf('favicon') > -1) continue;

      // 只取 jpg/png/webp 等图片格式
      if (!/\.(jpg|jpeg|png|webp|svg|gif|bmp)(\?|$)/i.test(src)) continue;

      // 处理相对路径
      if (src.startsWith('/')) {
        src = src;
      } else if (!src.startsWith('http')) {
        src = new URL(src, baseUrl).pathname;
      }

      images.push(src);
    }
    return images;
  }

  function fetchArticleImages(url) {
    return new Promise(function(resolve) {
      if (cache[url]) {
        resolve(cache[url]);
        return;
      }

      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.timeout = 8000;

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 400) {
          var imgs = extractArticleImages(xhr.responseText, url);
          cache[url] = imgs;
          resolve(imgs);
        } else {
          resolve([]);
        }
      };

      xhr.onerror = function() { resolve([]); };
      xhr.ontimeout = function() { resolve([]); };
      xhr.send();
    });
  }

  function setCoverImage(imgElement, src) {
    imgElement.setAttribute('src', src);
    imgElement.setAttribute('srcset', '');
    imgElement.style.objectFit = 'cover';
    imgElement.setAttribute('onerror', "this.onerror=null;this.src='" + FALLBACK + "';this.style.objectFit='contain'");
  }

  function randomizeCovers() {
    // Butterfly 主题选择器
    var cards = document.querySelectorAll('.post_cover');
    if (!cards.length) {
      // Fluid 主题备选
      var fluidCards = document.querySelectorAll('.index-card .index-img');
      if (fluidCards.length) {
        processCards(fluidCards);
      }
      return;
    }
    processCards(cards);
  }

  function processCards(cards) {
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var link = card.querySelector('a');
      var img = card.querySelector('.post-bg[src], img[src]');

      if (!link || !img) continue;

      var href = link.getAttribute('href');
      // 构建完整 URL
      var fullUrl = (href.startsWith('http') ? '' : window.location.origin) + href;

      // 异步获取文章图片
      fetchArticleImages(fullUrl).then(function(articleImgs) {
        if (articleImgs && articleImgs.length > 0) {
          var chosen = pickRandom(articleImgs);
          setCoverImage(img, chosen);
        }
      });
    }
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', randomizeCovers);
    } else {
      randomizeCovers();
    }
  }

  // 首次加载
  init();

  // PJAX 翻页
  document.addEventListener('pjax:complete', function() {
    // 清除缓存，重新获取最新页面内容
    cache = {};
    randomizeCovers();
  });

  if (typeof btf !== 'undefined' && btf.addGlobalFn) {
    btf.addGlobalFn('pjaxComplete', function() {
      cache = {};
      randomizeCovers();
    }, 'randomCover');
  }
})();
