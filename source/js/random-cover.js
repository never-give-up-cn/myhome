// 随机封面 - 优先使用文章自己的配图
(function() {
  var FALLBACK = 'https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/doubao/web/doubao_avatar.png';

  var globalPool = [
    '/img/photos/IMG_4924.jpg',
    '/img/photos/IMG_4933.jpg',
    '/img/photos/IMG_4946.jpg',
    '/img/photos/IMG_4950.jpg',
    '/img/photos/IMG_4955.jpg',
    '/img/photos/IMG_4956.jpg',
    '/img/photos/IMG_4964.jpg',
    '/img/photos/IMG_4967.jpg',
    '/img/photos/P1010022.JPG',
    '/img/photos/P1010032.JPG',
    '/img/photos/P1010040.JPG',
    '/img/photos/IMG_20181201_103517.jpg',
    '/img/photos/IMG_20181202_104151.jpg',
    '/img/photos/IMG_20181213_094438.jpg',
    '/img/photos/IMG_20181214_075105.jpg',
    '/img/photos/P1010064.JPG',
    '/img/photos/dji-pocket-4p.jpg',
    '/img/photos/insta360-luna-ultra.jpg'
  ];

  function pickRandom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
    }
    return arr;
  }

  function randomizeCovers() {
    var cards = document.querySelectorAll('.post_cover .post-bg[src]');
    if (!cards.length) {
      cards = document.querySelectorAll('.index-card .index-img img');
    }
    if (!cards.length) return;

    var shuffled = shuffle(globalPool.slice());
    var globalIdx = 0;

    for (var i = 0; i < cards.length; i++) {
      var img = cards[i];
      var chosen = null;

      // 优先：从文章的 data-photos 中随机选一张
      var photosAttr = img.getAttribute('data-photos');
      if (photosAttr && photosAttr !== '[]') {
        try {
          var articlePhotos = JSON.parse(photosAttr);
          chosen = pickRandom(articlePhotos);
        } catch(e) {}
      }

      // 备选：从全局照片池随机
      if (!chosen) {
        chosen = shuffled[globalIdx % shuffled.length];
        globalIdx++;
      }

      img.setAttribute('src', chosen);
      img.setAttribute('srcset', '');
      img.style.objectFit = 'cover';
      img.setAttribute('onerror', "this.onerror=null;this.src='" + FALLBACK + "';this.style.objectFit='contain'");
    }
  }

  function initRandomCover() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', randomizeCovers);
    } else {
      randomizeCovers();
    }
  }

  // 首次加载
  initRandomCover();

  // PJAX 翻页
  document.addEventListener('pjax:complete', randomizeCovers);
  if (typeof btf !== 'undefined' && btf.addGlobalFn) {
    btf.addGlobalFn('pjaxComplete', randomizeCovers, 'randomCover');
  }
})();
