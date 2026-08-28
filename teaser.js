
document.addEventListener("DOMContentLoaded", () => {
  const teaser = document.getElementById("teaser");
  const heroArt = document.getElementById("heroArt");
  const waterLayer = document.getElementById("waterLayer");
  const petalLayer = document.getElementById("petalLayer");

  const mobile = window.matchMedia("(max-width: 700px)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const rand = (min, max) =>
    Math.random() * (max - min) + min;

  function createWater() {
    if (!waterLayer) return;

    waterLayer.innerHTML = "";

    if (reduced.matches) return;

    const count =
      mobile.matches
        ? 16
        : 30;

    for (let i = 0; i < count; i++) {
      const drop =
        document.createElement("span");

      drop.className =
        "water-drop";

      const size =
        rand(5, 18);

      drop.style.width =
        `${size}px`;

      drop.style.height =
        `${size}px`;

      drop.style.left =
        `${rand(0, 31)}%`;

      drop.style.top =
        `${rand(16, 78)}%`;

      drop.style.setProperty(
        "--mx",
        `${rand(45, 190)}px`
      );

      drop.style.setProperty(
        "--my",
        `${rand(-110, 120)}px`
      );

      drop.style.setProperty(
        "--duration",
        `${rand(4, 7.5)}s`
      );

      drop.style.setProperty(
        "--delay",
        `${rand(0, 8)}s`
      );

      waterLayer.appendChild(drop);
    }
  }

  function createPetals() {
    if (!petalLayer) return;

    petalLayer.innerHTML = "";

    if (reduced.matches) return;

    const count =
      mobile.matches
        ? 14
        : 26;

    for (let i = 0; i < count; i++) {
      const petal =
        document.createElement("span");

      petal.className =
        "floating-petal";

      petal.style.left =
        `${rand(71, 100)}%`;

      petal.style.top =
        `${rand(10, 76)}%`;

      petal.style.setProperty(
        "--size",
        `${rand(7, 19)}px`
      );

      petal.style.setProperty(
        "--mx",
        `${rand(-230, -55)}px`
      );

      petal.style.setProperty(
        "--my",
        `${rand(-90, 175)}px`
      );

      petal.style.setProperty(
        "--rot",
        `${rand(-320, 360)}deg`
      );

      petal.style.setProperty(
        "--duration",
        `${rand(5, 10)}s`
      );

      petal.style.setProperty(
        "--delay",
        `${rand(0, 9)}s`
      );

      petalLayer.appendChild(petal);
    }
  }

  function rebuildParticles() {
    createWater();
    createPetals();
  }

  rebuildParticles();

  /* ---------------------------------------------------------
     Desktop parallax.
     This moves only a few pixels so it does not look like
     a rectangular image sliding around.
  --------------------------------------------------------- */

  if (
    teaser &&
    heroArt &&
    !reduced.matches
  ) {
    teaser.addEventListener(
      "pointermove",
      (event) => {
        if (mobile.matches) return;

        const rect =
          teaser.getBoundingClientRect();

        const nx =
          (
            event.clientX -
            rect.left
          ) /
          rect.width -
          0.5;

        const ny =
          (
            event.clientY -
            rect.top
          ) /
          rect.height -
          0.5;

        heroArt.style.transform =
          `scale(1.055) translate3d(${nx * 7}px, ${ny * 5}px, 0)`;
      },
      { passive: true }
    );

    teaser.addEventListener(
      "pointerleave",
      () => {
        heroArt.style.transform = "";
      },
      { passive: true }
    );
  }

  let resizeTimer;

  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);

      resizeTimer =
        setTimeout(
          rebuildParticles,
          180
        );
    }
  );

  const motionChanged = () => {
    rebuildParticles();
  };

  if (
    typeof reduced.addEventListener ===
    "function"
  ) {
    reduced.addEventListener(
      "change",
      motionChanged
    );
  }
});
