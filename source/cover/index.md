---
title: 摄影才是真爱
date: 2026-06-20
comments: false
---

<div class="cover-page">
  <div class="cover-split cover-left"></div>
  <div class="cover-split cover-right"></div>
  <div class="cover-overlay"></div>
  <div class="cover-content">
    <div class="cover-title">
      <span class="title-line title-sub">用镜头记录时光</span>
      <span class="title-line title-main">摄影才是真爱</span>
      <span class="title-line title-desc">光 · 影 · 瞬 · 间</span>
    </div>
    <a href="/" class="cover-btn">进入主页</a>
  </div>
</div>

<style>
/* Reset page for full-screen cover */
.nexmoe-post:has(.cover-page) {
  margin: 0 !important;
  padding: 0 !important;
  max-width: 100% !important;
  width: 100% !important;
  background: transparent !important;
  box-shadow: none !important;
}
.nexmoe-post:has(.cover-page) .nexmoe-post-cover,
.nexmoe-post:has(.cover-page) .nexmoe-post-meta,
.nexmoe-post:has(.cover-page) .nexmoe-post-copyright,
.nexmoe-post:has(.cover-page) .nexmoe-post-footer,
.nexmoe-post:has(.cover-page) .nexmoe-post-right {
  display: none !important;
}
.nexmoe-post:has(.cover-page) .article-entry,
.nexmoe-post:has(.cover-page) #article-container,
.nexmoe-post:has(.cover-page) .nexmoe-primary {
  padding: 0 !important;
  margin: 0 !important;
  max-width: 100% !important;
  width: 100% !important;
}

/* Full-screen cover */
.cover-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  z-index: 100;
}

/* Diagonal split background images */
.cover-split {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
.cover-left {
  left: 0;
  background: url(/img/cover.jpg) center center / cover no-repeat;
  clip-path: polygon(0 0, 60% 0, 40% 100%, 0 100%);
}
.cover-right {
  right: 0;
  background: url(/img/server-rack.jpg) center center / cover no-repeat;
  clip-path: polygon(60% 0, 100% 0, 100% 100%, 40% 100%);
}

/* Dark overlay for text readability */
.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  z-index: 2;
  pointer-events: none;
}

/* Center content */
.cover-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  text-align: center;
  pointer-events: none;
}
.cover-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 40px;
}
.title-sub {
  font-family: Georgia, 'Noto Serif SC', serif;
  font-size: 18px;
  color: rgba(255,255,255,0.7);
  letter-spacing: 6px;
  font-weight: 300;
}
.title-main {
  font-family: 'Noto Serif SC', Georgia, serif;
  font-size: 64px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 8px;
  text-shadow: 0 2px 20px rgba(0,0,0,0.5);
  line-height: 1.3;
}
.title-desc {
  font-family: Georgia, serif;
  font-size: 16px;
  color: rgba(255,255,255,0.5);
  letter-spacing: 12px;
  margin-top: 4px;
}
.cover-btn {
  display: inline-block;
  pointer-events: auto;
  padding: 12px 40px;
  border: 1.5px solid rgba(255,255,255,0.6);
  color: #fff;
  font-size: 14px;
  letter-spacing: 4px;
  text-decoration: none;
  transition: all 0.3s ease;
  background: transparent;
  font-family: 'Noto Sans SC', sans-serif;
}
.cover-btn:hover {
  background: rgba(255,255,255,0.15);
  border-color: #fff;
  letter-spacing: 6px;
}

/* Responsive */
@media (max-width: 768px) {
  .title-main {
    font-size: 36px;
    letter-spacing: 4px;
  }
  .title-sub {
    font-size: 14px;
    letter-spacing: 4px;
  }
  .title-desc {
    font-size: 12px;
    letter-spacing: 8px;
  }
  .cover-btn {
    padding: 10px 28px;
    font-size: 12px;
  }
}
</style>
