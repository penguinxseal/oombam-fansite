
document.addEventListener("DOMContentLoaded", () => {
  const waterLayer = document.getElementById("waterLayer");
  const petalLayer = document.getElementById("petalLayer");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = window.matchMedia("(max-width: 700px)");

  const rand = (min, max) => Math.random() * (max - min) + min;

  function makeWater() {
    if (!waterLayer) return;
    waterLayer.innerHTML = "";
    if (reduced.matches) return;

    const count = mobile.matches ? 17 : 32;

    for (let i = 0; i < count; i++) {
      const drop = document.createElement("span");
      drop.className = "water-drop";

      const size = rand(5, 18);
      drop.style.width = `${size}px`;
      drop.style.height = `${size}px`;
      drop.style.left = `${rand(0, 30)}%`;
      drop.style.top = `${rand(16, 78)}%`;
      drop.style.setProperty("--mx", `${rand(45, 190)}px`);
      drop.style.setProperty("--my", `${rand(-105, 120)}px`);
      drop.style.setProperty("--duration", `${rand(4, 7.5)}s`);
      drop.style.setProperty("--delay", `${rand(0, 8)}s`);

      waterLayer.appendChild(drop);
    }
  }

  function makePetals() {
    if (!petalLayer) return;
    petalLayer.innerHTML = "";
    if (reduced.matches) return;

    const count = mobile.matches ? 15 : 28;

    for (let i = 0; i < count; i++) {
      const petal = document.createElement("span");
      petal.className = "petal";

      petal.style.left = `${rand(71, 100)}%`;
      petal.style.top = `${rand(10, 77)}%`;
      petal.style.setProperty("--size", `${rand(7, 19)}px`);
      petal.style.setProperty("--mx", `${rand(-230, -55)}px`);
      petal.style.setProperty("--my", `${rand(-90, 175)}px`);
      petal.style.setProperty("--rot", `${rand(-320, 360)}deg`);
      petal.style.setProperty("--duration", `${rand(5, 10)}s`);
      petal.style.setProperty("--delay", `${rand(0, 9)}s`);

      petalLayer.appendChild(petal);
    }
  }

  function rebuild() {
    makeWater();
    makePetals();
  }

  rebuild();

  let timer;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 180);
  });
});
