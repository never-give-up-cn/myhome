---
title: 作品集
date: 2026-06-20
type: gallery
comments: false
---


<div class="gallery-wrap">
  <div class="gallery-item">
    <img src="/img/posts/sunset.svg" alt="日落风光">
    <div class="gallery-info">
      <p class="gallery-title">🌅 落日余晖</p>
      <p class="gallery-desc">追逐每一场日落，记录天空的色彩</p>
    </div>
  </div>
  <div class="gallery-item">
    <img src="/img/posts/night-photo.svg" alt="夜景长曝光">
    <div class="gallery-info">
      <p class="gallery-title">🌙 夜色长曝</p>
      <p class="gallery-desc">城市夜空与星光的对话</p>
    </div>
  </div>
  <div class="gallery-item">
    <img src="/img/posts/macro.svg" alt="微距摄影">
    <div class="gallery-info">
      <p class="gallery-title">🌸 微观世界</p>
      <p class="gallery-desc">发现镜头之下的细腻之美</p>
    </div>
  </div>
  <div class="gallery-item">
    <img src="/img/avatar.jpg" alt="我的头像">
    <div class="gallery-info">
      <p class="gallery-title">📷 光影捕手</p>
      <p class="gallery-desc">用镜头定格时光的美好</p>
    </div>
  </div>
</div>

<style>
.gallery-wrap {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin: 30px 0;
}
.gallery-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  aspect-ratio: 16 / 10;
}
.gallery-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}
.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.gallery-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: white;
}
.gallery-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px;
}
.gallery-desc {
  font-size: 14px;
  margin: 0;
  opacity: 0.85;
}
@media (max-width: 768px) {
  .gallery-wrap {
    grid-template-columns: 1fr;
  }
}
</style>
