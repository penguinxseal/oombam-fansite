document.addEventListener("DOMContentLoaded", () => {
  const waterLayer = document.getElementById("waterLayer");
  const petalLayer = document.getElementById("petalLayer");
  const teaser = document.getElementById("teaser");

  const mobile = window.matchMedia("(max-width: 700px)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const rand = (min, max) => Math.random() * (max - min) + min;

  function createWater() {
    if (!waterLayer) return;
    waterLayer.innerHTML = "";
    if (reduced.matches) return;

    const count = mobile.matches ? 16 : 30;

    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.className = "water-drop";

      const size = rand(5, 18);
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.left = `${rand(0, 31)}%`;
      el.style.top = `${rand(16, 78)}%`;
      el.style.setProperty("--mx", `${rand(45, 190)}px`);
      el.style.setProperty("--my", `${rand(-110, 120)}px`);
      el.style.setProperty("--duration", `${rand(4, 7.5)}s`);
      el.style.setProperty("--delay", `${rand(0, 8)}s`);

      waterLayer.appendChild(el);
    }
  }

  function createPetals() {
    if (!petalLayer) return;
    petalLayer.innerHTML = "";
    if (reduced.matches) return;

    const count = mobile.matches ? 14 : 26;

    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.className = "petal";

      el.style.left = `${rand(71, 100)}%`;
      el.style.top = `${rand(10, 76)}%`;
      el.style.setProperty("--size", `${rand(7, 19)}px`);
      el.style.setProperty("--mx", `${rand(-230, -55)}px`);
      el.style.setProperty("--my", `${rand(-90, 175)}px`);
      el.style.setProperty("--rot", `${rand(-320, 360)}deg`);
      el.style.setProperty("--duration", `${rand(5, 10)}s`);
      el.style.setProperty("--delay", `${rand(0, 9)}s`);

      petalLayer.appendChild(el);
    }
  }

  function rebuild() {
    createWater();
    createPetals();
  }

  rebuild();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, 180);
  });

  // Subtle mouse parallax on desktop only.
  if (teaser && !reduced.matches) {
    teaser.addEventListener("pointermove", (event) => {
      if (mobile.matches) return;

      const rect = teaser.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      const art = teaser.querySelector(".hero-art");

      if (art) {
        art.style.transform =
          `scale(1.055) translate3d(${x * 8}px, ${y * 6}px, 0)`;
      }
    }, { passive: true });

    teaser.addEventListener("pointerleave", () => {
      const art = teaser.querySelector(".hero-art");
      if (art) art.style.transform = "";
    });
  }
});
