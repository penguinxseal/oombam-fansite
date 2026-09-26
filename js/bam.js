(() => {
  "use strict";

  const PHOTO_PATH = "assets/images/bam/";
  // Exact base filenames from Bam_Solo.zip, ordered oldest to newest.
  // Repository filenames follow the supplied Bam_Solo.zip source: .jpg.
  const photoBases = [
  'Bam_Jun2023_Solo (1)',
  'Bam_Jun2023_Solo (2)',
  'Bam_Jun2023_Solo (3)',
  'Bam_Jun2023_Solo (4)',
  'Bam_Jun2023_Solo (5)',
  'Bam_2023_Solo (1)',
  'Bam_2023_Solo (2)',
  'Bam_2023_Solo (3)',
  'Bam_2023_Solo (4)',
  'Bam_2023_Solo (5)',
  'Bam_2023_Solo (6)',
  'Bam_2023_Solo (7)',
  'Bam_2023_Solo (8)',
  'Bam_2023_Solo (9)',
  'Bam_Dec2023_Solo (1)',
  'Bam_Dec2023_Solo (2)',
  'Bam_Dec2023_Solo (3)',
  'Bam_Dec2023_Solo (4)',
  'Bam_Dec2023_Solo (5)',
  'Bam_Dec2023_Solo (6)',
  'Bam_Dec2023_Solo (7)',
  'Bam_Dec2023_Solo (8)',
  'Bam_Dec2023_Solo (9)',
  'Bam_Dec2023_Solo (10)',
  'Bam_Dec2023_Solo (11)',
  'Bam_Dec2023_Solo (12)',
  'Bam_Dec2023_Solo (13)',
  'Bam_Dec2023_Solo (14)',
  'Bam_Dec2023_Solo (15)',
  'Bam_Dec2023_Solo (16)',
  'Bam_Dec2023_Solo (17)',
  'Bam_Dec2023_Solo (18)',
  'Bam_Dec2023_Solo (19)',
  'Bam_Dec2023_Solo (20)',
  'Bam_Dec2023_Solo (21)',
  'Bam_Dec2023_Solo (22)',
  'Bam_Dec2023_Solo (23)',
  'Bam_Dec2023_Solo (24)',
  'Bam_Dec2023_Solo (25)',
  'Bam_Dec2023_Solo (26)',
  'Bam_Dec2023_Solo (27)',
  'Bam_Apr2025_Solo (1)',
  'Bam_Apr2025_Solo (2)',
  'Bam_Apr2025_Solo (3)',
  'Bam_Apr2025_Solo (4)',
  'Bam_Apr2025_Solo (5)',
  'Bam_Apr2025_Solo (6)',
  'Bam_Apr2025_Solo (7)',
  'Bam_Apr2025_Solo (8)',
  'Bam_Apr2025_Solo (9)',
  'Bam_Apr2025_Solo (10)',
  'Bam_Sept2025_Solo (1)',
  'Bam_Sept2025_Solo (2)',
  'Bam_Sept2025_Solo (3)',
  'Bam_Sept2025_Solo (4)',
  'Bam_Sept2025_Solo (5)',
  'Bam_May052026_Solo (1)',
  'Bam_May052026_Solo (2)',
  'Bam_May052026_Solo (3)',
  'Bam_May052026_Solo (4)',
  'Bam_May052026_Solo (5)',
  'Bam_FTS_Promo_Jun03 (1)',
  'Bam_FTS_Promo_Jun03 (2)',
  'Bam_FTS_Promo_Jun03 (3)',
  'Bam_FTS_Promo_Jun03 (4)',
  'Bam_FTS_Promo_Jun03 (5)',
  'Bam_Jun62026_Solo (1)',
  'Bam_Jun62026_Solo (2)',
  'Bam_Jun62026_Solo (3)',
  'Bam_Jun62026_Solo (4)',
  'Bam_Jun62026_Solo (5)',
  'Bam_Jun62026_Solo (6)',
  'Bam_Jun62026_Solo (7)',
  'Bam_Jun62026_Solo (8)',
  'Bam_Jun62026_Solo (9)',
  'Bam_Jun62026_Solo (10)',
  'Bam_Jun292026_Solo (1)',
  'Bam_Jun292026_Solo (2)',
  'Bam_Jun292026_Solo (3)',
  'Bam_Jun292026_Solo (4)',
  'Bam_Jun292026_Solo (5)',
  'Bam_Jun292026_Solo (6)',
  'Bam_Jun292026_Solo (7)',
  'Bam_Jun292026_Solo (8)',
  'Bam_Jun292026_Solo (9)',
  'Bam_Jun302026_Solo (1)',
  'Bam_Jun302026_Solo (2)',
  'Bam_Jun302026_Solo (3)',
  'Bam_Jun302026_Solo (4)',
  'Bam_Jun302026_Solo (5)',
  'Bam_Jun302026_Solo (6)',
  'Bam_Jun302026_Solo (7)',
  'Bam_Jun302026_Solo (8)',
  'Bam_Jun302026_Solo (9)',
  'Bam_Jul12026_Solo (1)',
  'Bam_Jul12026_Solo (2)',
  'Bam_Jul12026_Solo (3)',
  'Bam_Jul12026_Solo (4)',
  'Bam_Jul12026_Solo (5)',
  'Bam_Jul12026_Solo (6)',
  'Bam_Jul12026_Solo (7)',
  'Bam_Jul12026_Solo (8)',
  'Bam_Jul12026_Solo (9)',
];

  const viewport = document.querySelector("[data-filmstrip-viewport]");
  const track = document.querySelector("[data-filmstrip-track]");
  const lightbox = document.querySelector("[data-bam-lightbox]");
  if (!viewport || !track) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let paused = false, dragging = false, pointerStart = 0, scrollStart = 0, resumeTimer = 0;
  let dragDistance = 0;
  let activeIndex = 0;

  function photoURL(base) { return `${PHOTO_PATH}${base}.jpg`; }

  function makePhoto(base, index, duplicate = false) {
    const figure = document.createElement("figure");
    figure.className = "bam-filmstrip__item";
    figure.setAttribute("aria-hidden", duplicate ? "true" : "false");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bam-filmstrip__button";
    button.tabIndex = duplicate ? -1 : 0;
    button.dataset.index = index;
    button.setAttribute("aria-label", `Open Bam Solo Archive photo ${index + 1}`);
    const img = document.createElement("img");
    img.className = "bam-filmstrip__image";
    img.alt = duplicate ? "" : "Bam Saralee solo archive photograph";
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

  function firstSetWidth() {
    const duplicateStart = track.children[photoBases.length];
    return duplicateStart ? duplicateStart.offsetLeft : track.scrollWidth / 2;
  }

  // v20.5.2: drive the strip with transform instead of scrollLeft.
  // Mobile browsers can quantize/cancel tiny scripted scrollLeft changes during touch handling;
  // translate3d keeps autoplay smooth and uses the same position model for touch, pen and mouse.
  let offset = 0;
  let previous = performance.now();
  let dragStartOffset = 0;
  let touchIdentifier = null;

  function normalizeOffset() {
    const width = firstSetWidth();
    if (!width) return;
    offset = ((offset % width) + width) % width;
  }

  function renderTrack() {
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
  }

  function animate(now) {
    const dt = Math.min(50, now - previous);
    previous = now;
    if (!paused && !dragging && !reduceMotion.matches && document.visibilityState === "visible") {
      offset += 0.032 * dt; // ~32px/sec
      normalizeOffset();
      renderTrack();
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  const pause = () => { paused = true; clearTimeout(resumeTimer); };
  const resumeSoon = (delay = 650) => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { paused = false; previous = performance.now(); }, delay);
  };

  function beginDrag(clientX) {
    dragging = true;
    dragDistance = 0;
    pause();
    viewport.classList.add("is-dragging");
    pointerStart = clientX;
    dragStartOffset = offset;
  }

  function moveDrag(clientX) {
    if (!dragging) return;
    const delta = clientX - pointerStart;
    dragDistance = Math.max(dragDistance, Math.abs(delta));
    offset = dragStartOffset - delta;
    normalizeOffset();
    renderTrack();
  }

  function finishDrag() {
    if (!dragging) return;
    dragging = false;
    touchIdentifier = null;
    viewport.classList.remove("is-dragging");
    normalizeOffset();
    renderTrack();
    resumeSoon();
  }

  // Pointer Events cover modern desktop/tablet/mobile browsers.
  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    beginDrag(event.clientX);
    try { viewport.setPointerCapture(event.pointerId); } catch (_) {}
  });
  viewport.addEventListener("pointermove", (event) => moveDrag(event.clientX));
  viewport.addEventListener("pointerup", (event) => {
    try { if (viewport.hasPointerCapture?.(event.pointerId)) viewport.releasePointerCapture(event.pointerId); } catch (_) {}
    finishDrag();
  });
  viewport.addEventListener("pointercancel", finishDrag);
  viewport.addEventListener("lostpointercapture", finishDrag);

  // Touch fallback for older iOS/WebKit builds where Pointer Events are incomplete.
  if (!("PointerEvent" in window)) {
    viewport.addEventListener("touchstart", (event) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      touchIdentifier = touch.identifier;
      beginDrag(touch.clientX);
    }, { passive: true });
    viewport.addEventListener("touchmove", (event) => {
      const touch = Array.from(event.changedTouches).find(t => t.identifier === touchIdentifier);
      if (touch) moveDrag(touch.clientX);
    }, { passive: true });
    viewport.addEventListener("touchend", finishDrag, { passive: true });
    viewport.addEventListener("touchcancel", finishDrag, { passive: true });
  }

  // Keyboard arrows remain available as an accessibility control.
  viewport.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    pause();
    offset += event.key === "ArrowRight" ? 260 : -260;
    normalizeOffset();
    renderTrack();
    resumeSoon(900);
  });

  // Recalculate seamlessly after rotation/tablet resize.
  window.addEventListener("resize", () => {
    normalizeOffset();
    renderTrack();
  }, { passive: true });

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
    lastFocus = trigger; setLightboxImage(index); lightbox.hidden = false; document.body.classList.add("bam-lightbox-open"); pause(); closeButton?.focus();
  }
  function closeLightbox() {
    lightbox.hidden = true; document.body.classList.remove("bam-lightbox-open"); resumeSoon(); lastFocus?.focus?.();
  }
  track.addEventListener("click", (event) => {
    if (dragDistance > 8) { event.preventDefault(); dragDistance = 0; return; }
    const button = event.target.closest(".bam-filmstrip__button");
    if (!button) return;
    // Both halves of the seamless loop represent real archive photos. The cloned
    // half is hidden from the accessibility tree, but it must remain clickable.
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

/* ==========================================================
   BAM SPECIAL COMMUNITY ACCESS · v20.6.0
   ========================================================== */
(() => {
  "use strict";
  const config = window.BAMBAM_COMMUNITY_CONFIG || {};
  if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase?.createClient) return;

  const openButton = document.querySelector("[data-bam-access-open]");
  const label = document.querySelector("[data-bam-access-label]");
  const modal = document.querySelector("[data-bam-access-modal]");
  const form = document.querySelector("[data-bam-access-form]");
  const codeInput = document.querySelector("[data-bam-access-code]");
  const toggle = document.querySelector("[data-bam-access-toggle]");
  const submit = document.querySelector("[data-bam-access-submit]");
  const status = document.querySelector("[data-bam-access-status]");
  if (!openButton || !modal || !form || !codeInput || !submit || !status) return;

  const endpoint = `${config.supabaseUrl.replace(/\/$/, "")}/functions/v1/artist-access-login`;
  const persistent = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  const verifier = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "bam-special-access-verifier" },
  });

  let lastFocus = null;
  let verifiedExistingBam = false;
  const setStatus = (message = "", success = false) => {
    status.textContent = message;
    status.classList.toggle("is-success", success);
  };
  const profileIsBam = (p) => p?.role === "artist" && p?.artist_identity === "bam" && p?.artist_access_status === "active" && (!p?.artist_access_expires_at || new Date(p.artist_access_expires_at) > new Date());

  async function readBamProfile(client, userId) {
    const { data, error } = await client.from("community_profiles")
      .select("role,artist_identity,artist_access_status,artist_access_expires_at")
      .eq("user_id", userId).maybeSingle();
    if (error) return null;
    return data;
  }

  async function detectExistingBam() {
    try {
      const { data: { session } } = await persistent.auth.getSession();
      if (!session?.user?.id) return;
      const profile = await readBamProfile(persistent, session.user.id);
      if (profileIsBam(profile)) {
        verifiedExistingBam = true;
        label.textContent = "Enter Community";
        openButton.querySelector("span[aria-hidden='true']").textContent = "🌸";
      }
    } catch (_) { /* keep the private entry in its default state */ }
  }

  function openModal() {
    if (verifiedExistingBam) { window.location.href = "community.html"; return; }
    lastFocus = document.activeElement;
    setStatus("");
    codeInput.value = "";
    codeInput.type = "password";
    toggle && (toggle.textContent = "Show");
    modal.hidden = false;
    document.body.classList.add("bam-access-open");
    requestAnimationFrame(() => codeInput.focus());
  }
  function closeModal() {
    if (submit.disabled) return;
    modal.hidden = true;
    document.body.classList.remove("bam-access-open");
    codeInput.value = "";
    setStatus("");
    lastFocus?.focus?.();
  }

  openButton.addEventListener("click", openModal);
  modal.querySelectorAll("[data-bam-access-close]").forEach(el => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", e => { if (!modal.hidden && e.key === "Escape") closeModal(); });
  toggle?.addEventListener("click", () => {
    const show = codeInput.type === "password";
    codeInput.type = show ? "text" : "password";
    toggle.textContent = show ? "Hide" : "Show";
    toggle.setAttribute("aria-label", `${show ? "Hide" : "Show"} recovery code`);
    toggle.setAttribute("aria-pressed", String(show));
    codeInput.focus();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const credential = codeInput.value.trim();
    if (!credential) { setStatus("Enter the private recovery code."); codeInput.focus(); return; }

    submit.disabled = true;
    submit.textContent = "Verifying…";
    setStatus("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": config.supabaseAnonKey },
        body: JSON.stringify({ credential }),
      });
      const payload = await response.json().catch(() => ({}));
      codeInput.value = ""; // never retain the recovery credential after the request
      if (!response.ok || !payload?.access_token || !payload?.refresh_token) throw new Error("invalid-access");

      // Verify the returned Artist identity in a non-persistent client first. This prevents
      // an ordinary member/admin browser session from being replaced by a Bam or invalid Artist session.
      const { data: verified, error: verifySessionError } = await verifier.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      });
      if (verifySessionError || !verified?.user?.id) throw new Error("invalid-session");
      const profile = await readBamProfile(verifier, verified.user.id);
      if (!profileIsBam(profile)) {
        await verifier.auth.signOut().catch(() => {});
        throw new Error("wrong-artist");
      }

      const { error: persistError } = await persistent.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      });
      if (persistError) throw new Error("session-persist-failed");
      await verifier.auth.signOut().catch(() => {});
      setStatus("Access confirmed. Opening the Blossom Community…", true);
      window.setTimeout(() => { window.location.href = "community.html"; }, 350);
    } catch (error) {
      codeInput.value = "";
      setStatus(error?.message === "wrong-artist" ? "This access code isn't valid for Bam's private access." : "We couldn't verify this private access code. Please try again.");
      codeInput.focus();
    } finally {
      submit.disabled = false;
      submit.textContent = "Enter Community";
    }
  });

  detectExistingBam();
})();
