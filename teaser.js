document.addEventListener("DOMContentLoaded", () => {
  const teaser = document.getElementById("teaser");
  if (!teaser) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduced || !canHover) return;

  let rafId = 0;

  window.addEventListener("pointermove", (event) => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const x = (event.clientX / window.innerWidth - 0.5) * 5;
      const y = (event.clientY / window.innerHeight - 0.5) * 3;
      teaser.style.setProperty("--mx", `${x}px`);
      teaser.style.setProperty("--my", `${y}px`);
    });
  }, { passive: true });

  document.addEventListener("mouseleave", () => {
    teaser.style.setProperty("--mx", "0px");
    teaser.style.setProperty("--my", "0px");
  });
});
