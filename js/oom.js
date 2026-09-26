(() => {
  "use strict";

  const PHOTO_PATH = "assets/images/oom/";
  // Exact base filenames from Oom_Solo.zip, ordered oldest to newest.
  // Repository filenames follow the supplied Oom_Solo.zip source: .jpg.
  const photoBases = [
  "Oom_Oct2024_Solo (1)",
  "Oom_Oct2024_Solo (2)",
  "Oom_Oct2024_Solo (3)",
  "Oom_Oct2024_Solo (4)",
  "Oom_Oct2024_Solo (5)",
  "Oom_Oct2024_Solo (6)",
  "Oom_Oct2024_Solo (7)",
  "Oom_Oct2024_Solo (8)",
  "Oom_Oct2024_Solo (9)",
  "Oom_Oct2024_Solo (10)",
  "Oom_Oct2024_Solo (11)",
  "Oom_Oct2024_Solo (12)",
  "Oom_Oct2024_Solo (13)",
  "Oom_Oct2024_Solo (14)",
  "Oom_Oct2024_Solo (15)",
  "Oom_Oct2024_Solo (16)",
  "Oom_Oct2024_Solo (17)",
  "Oom_Oct2024_Solo (18)",
  "Oom_Oct2024_Solo (19)",
  "Oom_Oct2024_Solo (20)",
  "Oom_Dec2024_Solo (1)",
  "Oom_Dec2024_Solo (2)",
  "Oom_Dec2024_Solo (3)",
  "Oom_Dec2024_Solo (4)",
  "Oom_Dec2024_Solo (5)",
  "Oom_Dec2024_Solo (6)",
  "Oom_Dec2024_Solo (7)",
  "Oom_Dec2024_Solo (8)",
  "Oom_Dec2024_Solo (9)",
  "Oom_Dec2024_Solo (10)",
  "Oom_Dec2024_Solo (11)",
  "Oom_Dec2024_Solo (12)",
  "Oom_Dec2024_Solo (13)",
  "Oom_Dec2024_Solo (14)",
  "Oom_Dec2024_Solo (15)",
  "Oom_Dec2024_Solo (16)",
  "Oom_Dec2024_Solo (17)",
  "Oom_Dec2024_Solo (18)",
  "Oom_Dec2024_Solo (19)",
  "Oom_Dec2024_Solo (20)",
  "Oom_Movie_Prem_Feb2025 (1)",
  "Oom_Movie_Prem_Feb2025 (2)",
  "Oom_Movie_Prem_Feb2025 (3)",
  "Oom_Movie_Prem_Feb2025 (4)",
  "Oom_Movie_Prem_Feb2025 (5)",
  "Oom_Movie_Prem_Feb2025 (6)",
  "Oom_Movie_Prem_Feb2025 (7)",
  "Oom_Movie_Prem_Feb2025 (8)",
  "Oom_Movie_Prem_Feb2025 (9)",
  "Oom_Movie_Prem_Feb2025 (10)",
  "Oom_Sept2025_Solo (1)",
  "Oom_Sept2025_Solo (2)",
  "Oom_Sept2025_Solo (3)",
  "Oom_Sept2025_Solo (4)",
  "Oom_Sept2025_Solo (5)",
  "Oom_Sept2025_Solo (6)",
  "Oom_Sept2025_Solo (7)",
  "Oom_Sept2025_Solo (8)",
  "Oom_Sept2025_Solo (9)",
  "Oom_Sept2025_Solo (10)",
  "Oom_Sept2025_Solo (11)",
  "Oom_Sept2025_Solo (12)",
  "Oom_Sept2025_Solo (13)",
  "Oom_Sept2025_Solo (14)",
  "Oom_Sept2025_Solo (15)",
  "Oom_Sept2025_Solo (16)",
  "Oom_Sept2025_Solo (17)",
  "Oom_Mar12026_Solo (1)",
  "Oom_Mar12026_Solo (2)",
  "Oom_Mar12026_Solo (3)",
  "Oom_Mar12026_Solo (4)",
  "Oom_Mar12026_Solo (5)",
  "Oom_Mar12026_Solo (6)",
  "Oom_Mar12026_Solo (7)",
  "Oom_Mar12026_Solo (8)",
  "Oom_Mar12026_Solo (9)",
  "Oom_Mar12026_Solo (10)",
  "Oom_Mar12026_Solo (11)",
  "Oom_Mar12026_Solo (12)",
  "Oom_Mar12026_Solo (13)",
  "Oom_Mar12026_Solo (14)",
  "Oom_Mar12026_Solo (15)",
  "Oom_Mar12026_Solo (16)",
  "Oom_Mar12026_Solo (17)",
  "Oom_Mar12026_Solo (18)",
  "Oom_Mar12026_Solo (19)",
  "Oom_May182026_Solo (1)",
  "Oom_May182026_Solo (2)",
  "Oom_May182026_Solo (3)",
  "Oom_May182026_Solo (4)",
  "Oom_May182026_Solo (5)",
  "Oom_May182026_Solo (6)",
  "Oom_May182026_Solo (7)",
  "Oom_May182026_Solo (8)",
  "Oom_Movie_Prem_May252026 (1)",
  "Oom_Movie_Prem_May252026 (2)",
  "Oom_Movie_Prem_May252026 (3)",
  "Oom_Movie_Prem_May252026 (4)",
  "Oom_Movie_Prem_May252026 (5)",
  "Oom_Movie_Prem_May252026 (6)",
  "Oom_Movie_Prem_May252026 (7)",
  "Oom_Movie_Prem_May252026 (8)",
  "Oom_Movie_Prem_May252026 (9)",
  "Oom_Movie_Prem_May252026 (10)",
  "Oom_Movie_Prem_May252026 (11)",
  "Oom_Movie_Prem_May252026 (12)",
  "Oom_Movie_Prem_May252026 (13)",
  "Oom_Movie_Prem_May252026 (14)",
  "Oom_Movie_Prem_May252026 (15)",
  "Oom_Movie_Prem_May252026 (16)",
  "Oom_Movie_Prem_May252026 (17)",
  "Oom_FTS_Promo_Jun032026_Solo_ (1)",
  "Oom_FTS_Promo_Jun032026_Solo_ (2)",
  "Oom_July042026_Solo (1)",
  "Oom_July042026_Solo (2)",
  "Oom_July042026_Solo (3)",
  "Oom_July042026_Solo (4)",
  "Oom_July042026_Solo (5)",
  "Oom_July042026_Solo (6)",
  "Oom_Jul092026_Solo (1)",
  "Oom_Jul092026_Solo (2)",
  "Oom_Jul092026_Solo (3)",
  "Oom_Jul092026_Solo (4)",
  "Oom_Jul092026_Solo (5)",
  "Oom_Jul092026_Solo (6)",
  "Oom_Jul092026_Solo (7)",
  "Oom_Jul092026_Solo (8)",
  "Oom_Jul092026_Solo (9)",
  "Oom_Jul092026_Solo (10)",
  "Oom_Jul092026_Solo (11)",
  "Oom_Jul092026_Solo (12)",
  "Oom_Jul092026_Solo (13)",
  "Oom_Aug242026_Solo (1)",
  "Oom_Aug242026_Solo (2)",
  "Oom_Aug242026_Solo (3)",
  "Oom_Aug242026_Solo (4)",
  "Oom_Aug242026_Solo (5)",
  "Oom_Aug242026_Solo (6)",
  "Oom_Aug242026_Solo (7)",
  "Oom_Aug242026_Solo (8)",
  "Oom_Aug242026_Solo (9)",
  "Oom_Aug242026_Solo (10)",
  "Oom_Aug242026_Solo (11)",
  "Oom_Aug242026_Solo (12)",
  "Oom_Aug242026_Solo (13)",
  "Oom_Aug242026_Solo (14)",
  "Oom_Aug242026_Solo (15)",
  "Oom_Aug242026_Solo (16)",
  "Oom_Aug242026_Solo (17)",
  "Oom_ArcheryVlog_Sep182026_Solo (1)",
  "Oom_ArcheryVlog_Sep182026_Solo (2)",
  "Oom_ArcheryVlog_Sep182026_Solo (3)",
  "Oom_ArcheryVlog_Sep182026_Solo (4)",
  "Oom_ArcheryVlog_Sep182026_Solo (5)",
  "Oom_ArcheryVlog_Sep182026_Solo (6)",
  "Oom_ArcheryVlog_Sep182026_Solo (7)"
];

  const viewport = document.querySelector("[data-filmstrip-viewport]");
  const track = document.querySelector("[data-filmstrip-track]");
  const lightbox = document.querySelector("[data-oom-lightbox]");
  if (!viewport || !track) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let paused = false, dragging = false, pointerStart = 0, scrollStart = 0, resumeTimer = 0;
  let dragDistance = 0;
  let activeIndex = 0;

  function photoURL(base) { return `${PHOTO_PATH}${base}.jpg`; }

  function makePhoto(base, index, duplicate = false) {
    const figure = document.createElement("figure");
    figure.className = "oom-filmstrip__item";
    figure.setAttribute("aria-hidden", duplicate ? "true" : "false");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "oom-filmstrip__button";
    button.tabIndex = duplicate ? -1 : 0;
    button.dataset.index = index;
    button.setAttribute("aria-label", `Open Oom Solo Archive photo ${index + 1}`);
    const img = document.createElement("img");
    img.className = "oom-filmstrip__image";
    img.alt = duplicate ? "" : "Oom Eisaya solo archive photograph";
    img.loading = index < 8 && !duplicate ? "eager" : "lazy";
    img.decoding = "async";
    img.src = photoURL(base);
    button.appendChild(img); figure.appendChild(button); return figure;
  }

  const fragment = document.createDocumentFragment();
  photoBases.forEach((base, i) => fragment.appendChild(makePhoto(base, i, false)));
  // Duplicate one full set so the scroll position can wrap without a visual seam.
  photoBases.forEach((base, i) => fragment.appendChild(makePhoto(base, i, true)));
  track.appendChild(fragment);

  function firstSetWidth() { return track.scrollWidth / 2; }
  function normalizeScroll() {
    const width = firstSetWidth();
    if (!width) return;
    while (viewport.scrollLeft >= width) viewport.scrollLeft -= width;
    while (viewport.scrollLeft < 0) viewport.scrollLeft += width;
  }

  let previous = performance.now();
  function animate(now) {
    const dt = Math.min(50, now - previous);
    previous = now;
    if (!paused && !dragging && !reduceMotion.matches && document.visibilityState === "visible") {
      viewport.scrollLeft += 0.032 * dt; // ~32px/sec: visible but calm continuous movement
      normalizeScroll();
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  const pause = () => { paused = true; clearTimeout(resumeTimer); };
  const resumeSoon = (delay = 650) => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { paused = false; }, delay);
  };

  // Unified Pointer Events: mouse, touch and pen all drag the same track.
  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    dragging = true;
    dragDistance = 0;
    pause();
    viewport.classList.add("is-dragging");
    pointerStart = event.clientX;
    scrollStart = viewport.scrollLeft;
    viewport.setPointerCapture?.(event.pointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const delta = event.clientX - pointerStart;
    dragDistance = Math.max(dragDistance, Math.abs(delta));
    viewport.scrollLeft = scrollStart - delta;
    normalizeScroll();
  });

  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove("is-dragging");
    if (event?.pointerId !== undefined && viewport.hasPointerCapture?.(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    resumeSoon();
  }
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);
  viewport.addEventListener("lostpointercapture", () => {
    if (dragging) { dragging = false; viewport.classList.remove("is-dragging"); resumeSoon(); }
  });

  // Keyboard scrolling remains available without permanently pausing autoplay.
  viewport.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    pause();
    viewport.scrollBy({ left: event.key === "ArrowRight" ? 260 : -260, behavior: "smooth" });
    window.setTimeout(normalizeScroll, 350);
    resumeSoon(900);
  });
  if (!lightbox) return;
  const lightboxImage = lightbox.querySelector("[data-lightbox-image]");
  const closeButton = lightbox.querySelector("[data-lightbox-close]");
  const prevButton = lightbox.querySelector("[data-lightbox-prev]");
  const nextButton = lightbox.querySelector("[data-lightbox-next]");
  let lastFocus = null;

  function setLightboxImage(index) {
    activeIndex = (index + photoBases.length) % photoBases.length;
    lightboxImage.src = photoURL(photoBases[activeIndex]);
  }
  function openLightbox(index, trigger) {
    lastFocus = trigger; setLightboxImage(index); lightbox.hidden = false; document.body.classList.add("oom-lightbox-open"); pause(); closeButton?.focus();
  }
  function closeLightbox() {
    lightbox.hidden = true; document.body.classList.remove("oom-lightbox-open"); resumeSoon(); lastFocus?.focus?.();
  }
  track.addEventListener("click", (event) => {
    if (dragDistance > 8) { event.preventDefault(); dragDistance = 0; return; }
    const button = event.target.closest(".oom-filmstrip__button");
    if (!button || button.closest('[aria-hidden="true"]')) return;
    openLightbox(Number(button.dataset.index), button);
  });
  closeButton?.addEventListener("click", closeLightbox);
  prevButton?.addEventListener("click", () => setLightboxImage(activeIndex - 1));
  nextButton?.addEventListener("click", () => setLightboxImage(activeIndex + 1));
  lightbox.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") setLightboxImage(activeIndex - 1);
    if (event.key === "ArrowRight") setLightboxImage(activeIndex + 1);
  });
})();
