<!--
  Atmospheric grain overlay.
  Renders a fixed full-viewport layer with an inline SVG turbulence pattern at low opacity.
  Pinned to z-index 1 with pointer-events: none so it sits above content but never blocks input.
  Pure-CSS, no JS runtime surface.
-->
<template>
  <div class="grain" aria-hidden="true"></div>
</template>

<style scoped>
.grain {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0.015;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  background-repeat: repeat;
  mix-blend-mode: multiply;
}

/* No animation tax in reduced-motion mode → bump opacity slightly for the same visual weight. */
@media (prefers-reduced-motion: reduce) {
  .grain {
    opacity: 0.025;
  }
}
</style>