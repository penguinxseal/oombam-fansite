document.addEventListener("DOMContentLoaded", () => {
  const teaser = document.querySelector(".teaser");
  const stage = document.querySelector(".duo-stage");

  if (!teaser) return;

  requestAnimationFrame(() => {
    teaser.classList.add("is-ready");
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;

  if (reducedMotion || !canHover || !stage) return;

  const updatePointer = (event) => {
    const x = ((event.clientX / window.innerWidth) - 0.5) * 12;
    const y = ((event.clientY / window.innerHeight) - 0.5) * 10;

    teaser.style.setProperty("--pointer-x", `${x}px`);
    teaser.style.setProperty("--pointer-y", `${y}px`);
  };

  const resetPointer = () => {
    teaser.style.setProperty("--pointer-x", "0px");
    teaser.style.setProperty("--pointer-y", "0px");
  };

  window.addEventListener("mousemove", updatePointer, { passive: true });
  window.addEventListener("mouseleave", resetPointer, { passive: true });
});
