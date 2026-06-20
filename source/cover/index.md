---
title: 摄影才是真爱
date: 2026-06-20
comments: false
---

<div class="cover-page">
  <div class="cover-overlay"></div>
  <div class="cover-grid">
    <div class="grid-item item-1"><img src="/img/photos/IMG_4924.jpg" alt="摄影"></div>
    <div class="grid-item item-2"><img src="/img/photos/IMG_4933.jpg" alt="摄影"></div>
    <div class="grid-item item-3"><img src="/img/photos/IMG_4946.jpg" alt="摄影"></div>
    <div class="grid-item item-4"><img src="/img/photos/IMG_4950.jpg" alt="摄影"></div>
    <div class="grid-item item-5"><img src="/img/photos/IMG_4956.jpg" alt="摄影"></div>
    <div class="grid-item item-6"><img src="/img/photos/P1010022.JPG" alt="摄影"></div>
    <div class="grid-item item-7"><img src="/img/photos/P1010032.JPG" alt="摄影"></div>
    <div class="grid-item item-8"><img src="/img/photos/IMG_20181201_103517.jpg" alt="摄影"></div>
    <div class="grid-item item-9"><img src="/img/photos/IMG_20181201_182443.jpg" alt="摄影"></div>
  </div>
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
/* Reset page padding for full-screen cover */
.page-cover .nexmoe-post {
  margin: 0 !important;
  padding: 0 !important;
  max-width: 100% !important;
  width: 100% !important;
  background: transparent !important;
  box-shadow: none !important;
}
.page-cover .nexmoe-post-cover,
.page-cover .nexmoe-post-meta,
.page-cover .nexmoe-post-footer {
  display: none !important;
}
.page-cover .article-entry {
  padding: 0 !important;
  margin: 0 !important;
}
.page-cover #article-container {
  padding: 0 !important;
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

/* 9-grid background */
.cover-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100vw;
  height: 100vh;
  gap: 2px;
  background: #000;
}
.grid-item {
  overflow: hidden;
  position: relative;
}
.grid-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease, filter 0.6s ease;
  filter: brightness(0.6);
}
.grid-item:hover img {
  transform: scale(1.1);
  filter: brightness(0.85);
}

/* Dark overlay to ensure text readability */
.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.35);
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

<script>
// Auto-redirect after splash timeout (optional - remove if you want manual navigation)
// setTimeout(() => { window.location.href = '/'; }, 5000);
</script>
