<template>
  <div class="atmosphere" aria-hidden="true">
    <div class="fog"></div>
    <div class="scanlines"></div>
    <div class="flicker"></div>
  </div>
</template>

<style scoped>
.atmosphere {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.fog {
  position: absolute;
  inset: -10%;
  background:
    radial-gradient(60% 40% at 30% 20%, rgba(43, 108, 255, 0.10), transparent 70%),
    radial-gradient(50% 50% at 75% 70%, rgba(94, 242, 255, 0.08), transparent 70%),
    radial-gradient(40% 30% at 50% 90%, rgba(255, 157, 60, 0.06), transparent 70%);
  filter: blur(40px);
  animation: fog-drift 22s ease-in-out infinite alternate;
}
.scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0,
    rgba(0, 0, 0, 0) 2px,
    rgba(0, 0, 0, 0.18) 3px,
    rgba(0, 0, 0, 0) 4px
  );
  background-size: 100% 6px;
  animation: scanline-drift 8s linear infinite;
  opacity: 0.5;
}
.flicker {
  position: absolute;
  inset: 0;
  background: rgba(94, 242, 255, 0.04);
  animation: flicker 6s steps(1) infinite;
}
</style>
