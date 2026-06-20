// 随机封面 - 每次刷新首页文章卡片显示不同的照片
(function() {
  var FALLBACK = 'https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/doubao/web/doubao_avatar.png';

  var coverPool = [
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

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
    }
    return arr;
  }

  function randomizeCovers() {
    // Try Butterfly selector first, fallback to Fluid selector
    var cards = document.querySelectorAll('.post_cover .post-bg[src]');
    if (!cards.length) {
      cards = document.querySelectorAll('.index-card .index-img img');
    }
    if (!cards.length) return;

    var shuffled = shuffle(coverPool.slice());
    for (var i = 0; i < cards.length; i++) {
      var idx = i % shuffled.length;
      var img = cards[i];

      // Set random cover
      img.setAttribute('src', shuffled[idx]);
      img.setAttribute('srcset', '');
      img.style.objectFit = 'cover';

      // Fallback if image fails to load
      img.setAttribute('onerror', "this.onerror=null;this.src='" + FALLBACK + "';this.style.objectFit='contain'");
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', randomizeCovers);
  } else {
    randomizeCovers();
  }
})();
