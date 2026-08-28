// OomBam teaser v12
// The 18-second sequence is intentionally CSS-driven so it loops smoothly
// without timers drifting out of sync. JS only adds a tiny pointer parallax.

document.addEventListener("DOMContentLoaded", () => {
  const teaser = document.getElementById("teaser");
  if (!teaser) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduced || !finePointer) return;

  const hero = teaser.querySelector(".hero-image");
  if (!hero) return;

  let raf = 0;
  window.addEventListener("pointermove", (event) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = (event.clientX / window.innerWidth - 0.5) * 5;
      const y = (event.clientY / window.innerHeight - 0.5) * 3;
      hero.style.setProperty("--px", `${x}px`);
      hero.style.setProperty("--py", `${y}px`);
    });
  }, { passive: true });
});
