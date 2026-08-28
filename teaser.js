// OomBam teaser v13
// The cinematic sequence is CSS-driven for a stable seamless loop.
// JS only adds very subtle desktop parallax to the hero artwork.

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
      const x = (event.clientX / window.innerWidth - 0.5) * 3;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      hero.style.setProperty("--px", `${x}px`);
      hero.style.setProperty("--py", `${y}px`);
    });
  }, { passive: true });

  document.addEventListener("mouseleave", () => {
    hero.style.setProperty("--px", "0px");
    hero.style.setProperty("--py", "0px");
  });
});
