/* =========================================================
   OOMBAM OFFICIAL FANSITE — TEASER V6
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const teaser = document.getElementById("teaser");
  const waterZone = document.getElementById("waterParticles");
  const petalZone = document.getElementById("petalParticles");

  const WATER_COUNT_DESKTOP = 34;
  const WATER_COUNT_MOBILE = 18;
  const PETAL_COUNT_DESKTOP = 28;
  const PETAL_COUNT_MOBILE = 15;

  const mediaMobile = window.matchMedia("(max-width: 700px)");
  const mediaReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const isMobile = () => mediaMobile.matches;
  const reducedMotion = () => mediaReducedMotion.matches;

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
  }

  function createWaterParticles() {
    if (!waterZone || reducedMotion()) return;

    waterZone.innerHTML = "";

    const count = isMobile()
      ? WATER_COUNT_MOBILE
      : WATER_COUNT_DESKTOP;

    for (let i = 0; i < count; i++) {
      const drop = document.createElement("span");
      drop.className = "water-drop";

      const size = random(5, 18);
      const startX = random(1, 27);
      const startY = random(24, 75);
      const moveX = random(50, 190);
      const moveY = random(-90, 110);
      const duration = random(3.8, 7);
      const delay = random(0, 8);

      drop.style.width = `${size}px`;
      drop.style.height = `${size}px`;
      drop.style.left = `${startX}%`;
      drop.style.top = `${startY}%`;

      drop.style.setProperty("--move-x", `${moveX}px`);
      drop.style.setProperty("--move-y", `${moveY}px`);
      drop.style.setProperty("--duration", `${duration}s`);
      drop.style.setProperty("--delay", `${delay}s`);

      waterZone.appendChild(drop);
    }
  }

  function createPetalParticles() {
    if (!petalZone || reducedMotion()) return;

    petalZone.innerHTML = "";

    const count = isMobile()
      ? PETAL_COUNT_MOBILE
      : PETAL_COUNT_DESKTOP;

    for (let i = 0; i < count; i++) {
      const petal = document.createElement("span");
      petal.className = "floating-petal";

      const size = random(7, 19);
      const startX = random(73, 99);
      const startY = random(20, 75);
      const moveX = random(-220, -55);
      const moveY = random(-80, 170);
      const duration = random(5, 10);
      const delay = random(0, 9);
      const rotation = randomInt(-300, 360);

      petal.style.left = `${startX}%`;
      petal.style.top = `${startY}%`;

      petal.style.setProperty("--petal-size", `${size}px`);
      petal.style.setProperty("--move-x", `${moveX}px`);
      petal.style.setProperty("--move-y", `${moveY}px`);
      petal.style.setProperty("--rotation", `${rotation}deg`);
      petal.style.setProperty("--duration", `${duration}s`);
      petal.style.setProperty("--delay", `${delay}s`);

      petalZone.appendChild(petal);
    }
  }

  /* ---------------------------------------------------------
     Very subtle environment parallax.
     Characters themselves keep their own CSS animation.
  --------------------------------------------------------- */
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId = null;

  function handlePointerMove(event) {
    if (!teaser || isMobile() || reducedMotion()) return;

    const rect = teaser.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;

    targetX = nx * 10;
    targetY = ny * 7;

    if (!rafId) {
      rafId = requestAnimationFrame(updateParallax);
    }
  }

  function handlePointerLeave() {
    targetX = 0;
    targetY = 0;

    if (!rafId) {
      rafId = requestAnimationFrame(updateParallax);
    }
  }

  function updateParallax() {
    currentX += (targetX - currentX) * 0.07;
    currentY += (targetY - currentY) * 0.07;

    teaser.style.setProperty("--pointer-x", `${currentX}px`);
    teaser.style.setProperty("--pointer-y", `${currentY}px`);

    const bgBlue = teaser.querySelector(".scene-bg__blue");
    const bgPink = teaser.querySelector(".scene-bg__pink");
    const center = teaser.querySelector(".scene-bg__center");

    if (bgBlue) {
      bgBlue.style.marginLeft = `${currentX * -0.28}px`;
      bgBlue.style.marginTop = `${currentY * -0.22}px`;
    }

    if (bgPink) {
      bgPink.style.marginLeft = `${currentX * 0.28}px`;
      bgPink.style.marginTop = `${currentY * 0.22}px`;
    }

    if (center) {
      center.style.marginLeft = `${currentX * 0.08}px`;
      center.style.marginTop = `${currentY * 0.08}px`;
    }

    const stillMoving =
      Math.abs(targetX - currentX) > 0.05 ||
      Math.abs(targetY - currentY) > 0.05;

    if (stillMoving) {
      rafId = requestAnimationFrame(updateParallax);
    } else {
      rafId = null;
    }
  }

  function rebuildParticles() {
    createWaterParticles();
    createPetalParticles();
  }

  rebuildParticles();

  let resizeTimer;

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuildParticles, 180);
  });

  if (teaser) {
    teaser.addEventListener("pointermove", handlePointerMove, { passive: true });
    teaser.addEventListener("pointerleave", handlePointerLeave, { passive: true });
  }

  const motionChangeHandler = () => {
    if (reducedMotion()) {
      if (waterZone) waterZone.innerHTML = "";
      if (petalZone) petalZone.innerHTML = "";
    } else {
      rebuildParticles();
    }
  };

  if (typeof mediaReducedMotion.addEventListener === "function") {
    mediaReducedMotion.addEventListener("change", motionChangeHandler);
  } else if (typeof mediaReducedMotion.addListener === "function") {
    mediaReducedMotion.addListener(motionChangeHandler);
  }
});
