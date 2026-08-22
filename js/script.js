"use strict";

(() => {
  const body = document.body;
  const root = document.documentElement;

  const siteHeader = document.getElementById("siteHeader");
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const themeToggle = document.getElementById("themeToggle");

  const searchToggle = document.getElementById("siteSearchToggle");
  const siteSearch = document.getElementById("siteSearch");
  const searchClose = document.getElementById("siteSearchClose");
  const searchInput = document.getElementById("siteSearchInput");
  const searchResults = document.getElementById("siteSearchResults");

  const DESKTOP_BREAKPOINT = 1100;
  const THEME_KEY = "oombam-theme";

  /* =====================================================
     HEADER STATE
  ===================================================== */
  const updateHeader = () => {
    if (!siteHeader) return;
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  /* =====================================================
     GLOBAL NAVIGATION SUBMENUS
     Central config = one source of truth across every page.

     Note: Blogs is intentionally shown as "Coming soon" until a real
     page/section exists. This avoids shipping a dead or misleading link.
  ===================================================== */
  const NAV_SUBMENUS = {
    media: {
      label: "Media",
      items: [
        { label: "Fulfill The Series", href: "just-the-two-of-us.html" },
        { label: "Interviews", href: "index.html#media-interviews" },
        { label: "Blogs", disabled: true, note: "Coming soon" },
        { label: "Soundtrack", href: "index.html#media-soundtrack" }
      ]
    },
    blossoms: {
      label: "Blossoms",
      items: [
        { label: "Fan Letters", href: "community.html#letters" },
        { label: "Community Guidelines", href: "community-guidelines.html" },
        { label: "Submission Guidelines", href: "submission-guidelines.html" }
      ]
    }
  };

  const chevronMarkup = `
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path d="m4 6 4 4 4-4"></path>
    </svg>`;

  const normalizedPath = (pathname) => pathname
    .replace(/\\/g, "/")
    .replace(/\/index\.html$/i, "/");

  const isCurrentSubmenuHref = (href) => {
    if (!href) return false;
    try {
      const target = new URL(href, window.location.href);
      const samePath = target.origin === window.location.origin &&
        normalizedPath(target.pathname) === normalizedPath(window.location.pathname);
      if (!samePath) return false;

      /* A hash-specific submenu should only be active on that exact hash. */
      if (target.hash) return target.hash === window.location.hash;
      return !window.location.hash || normalizedPath(target.pathname) !== "/";
    } catch (_) {
      return false;
    }
  };

  const makeSubmenuItem = (item, mode) => {
    const isDesktop = mode === "desktop";
    const el = document.createElement(item.disabled ? "span" : "a");
    el.className = `${isDesktop ? "desktop" : "mobile"}-submenu-link`;

    if (item.disabled) {
      el.classList.add("is-disabled");
      el.setAttribute("aria-disabled", "true");
    } else {
      el.href = item.href;
      if (isCurrentSubmenuHref(item.href)) {
        el.classList.add("is-current");
        el.setAttribute("aria-current", "location");
      }
    }

    const label = document.createElement("span");
    label.textContent = item.label;
    el.append(label);

    if (item.disabled && item.note) {
      const note = document.createElement("small");
      note.className = "submenu-coming-soon";
      note.textContent = item.note;
      el.append(note);
    } else {
      const arrow = document.createElement("span");
      arrow.className = "submenu-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "→";
      el.append(arrow);
    }

    return el;
  };

  const updateSubmenuCurrentStates = () => {
    document.querySelectorAll(".desktop-submenu-link[href], .mobile-submenu-link[href]").forEach((link) => {
      const current = isCurrentSubmenuHref(link.getAttribute("href"));
      link.classList.toggle("is-current", current);
      if (current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  const closeAllMobileSubmenus = () => {
    document.querySelectorAll(".mobile-nav-group.is-open").forEach((group) => {
      group.classList.remove("is-open");
      const toggle = group.querySelector(".mobile-submenu-toggle");
      toggle?.setAttribute("aria-expanded", "false");
    });
  };

  const enhanceNavigationSubmenus = () => {
    const desktopNav = document.querySelector(".desktop-nav");
    const mobilePanel = document.querySelector(".mobile-menu-panel");

    Object.entries(NAV_SUBMENUS).forEach(([key, config]) => {
      /* DESKTOP: keep the parent destination clickable; dropdown opens on hover/focus. */
      if (desktopNav) {
        const parent = [...desktopNav.children].find((el) =>
          el.matches?.(`a[data-nav-key="${key}"]`)
        );

        if (parent && !parent.closest(".nav-menu-group")) {
          const group = document.createElement("div");
          group.className = "nav-menu-group";
          group.dataset.submenuGroup = key;

          const submenuId = `desktopSubmenu-${key}`;
          const submenu = document.createElement("div");
          submenu.className = "desktop-submenu";
          submenu.id = submenuId;
          submenu.setAttribute("aria-label", `${config.label} submenu`);

          config.items.forEach((item) => submenu.append(makeSubmenuItem(item, "desktop")));

          parent.before(group);
          group.append(parent, submenu);
          parent.classList.add("nav-parent-link");
          parent.setAttribute("aria-haspopup", "true");
          parent.setAttribute("aria-controls", submenuId);
          parent.setAttribute("aria-expanded", "false");
          parent.insertAdjacentHTML("beforeend", `<span class="nav-chevron">${chevronMarkup}</span>`);

          const setExpanded = (expanded) => {
            group.classList.toggle("is-open", expanded);
            parent.setAttribute("aria-expanded", String(expanded));
          };

          group.addEventListener("pointerenter", () => setExpanded(true));
          group.addEventListener("pointerleave", () => setExpanded(false));
          group.addEventListener("focusin", () => setExpanded(true));
          group.addEventListener("focusout", (event) => {
            if (!group.contains(event.relatedTarget)) setExpanded(false);
          });
          group.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
              setExpanded(false);
              parent.focus();
            }
          });
        }
      }

      /* MOBILE: parent link stays a real destination; chevron controls children. */
      if (mobilePanel) {
        const parent = [...mobilePanel.children].find((el) =>
          el.matches?.(`a[data-nav-key="${key}"]`)
        );

        if (parent && !parent.closest(".mobile-nav-group")) {
          const group = document.createElement("div");
          group.className = "mobile-nav-group";
          group.dataset.submenuGroup = key;

          const row = document.createElement("div");
          row.className = "mobile-nav-parent-row";

          const submenuId = `mobileSubmenu-${key}`;
          const toggle = document.createElement("button");
          toggle.className = "mobile-submenu-toggle";
          toggle.type = "button";
          toggle.setAttribute("aria-label", `Show ${config.label} links`);
          toggle.setAttribute("aria-controls", submenuId);
          toggle.setAttribute("aria-expanded", "false");
          toggle.innerHTML = chevronMarkup;

          const submenu = document.createElement("div");
          submenu.className = "mobile-submenu";
          submenu.id = submenuId;
          config.items.forEach((item) => submenu.append(makeSubmenuItem(item, "mobile")));

          parent.before(group);
          row.append(parent, toggle);
          group.append(row, submenu);

          toggle.addEventListener("click", () => {
            const willOpen = !group.classList.contains("is-open");
            document.querySelectorAll(".mobile-nav-group.is-open").forEach((other) => {
              if (other === group) return;
              other.classList.remove("is-open");
              other.querySelector(".mobile-submenu-toggle")?.setAttribute("aria-expanded", "false");
            });
            group.classList.toggle("is-open", willOpen);
            toggle.setAttribute("aria-expanded", String(willOpen));
            toggle.setAttribute("aria-label", `${willOpen ? "Hide" : "Show"} ${config.label} links`);
          });
        }
      }
    });

    updateSubmenuCurrentStates();
  };

  enhanceNavigationSubmenus();
  window.addEventListener("hashchange", updateSubmenuCurrentStates);

  /* =====================================================
     ACTIVE NAVIGATION
     One source of truth: body[data-active-nav]
  ===================================================== */
  const navLinks = [...document.querySelectorAll("[data-nav-key]")];

  const setActiveNav = (key) => {
    if (!key) return;
    navLinks.forEach((link) => {
      const active = link.dataset.navKey === key;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  };

  setActiveNav(body.dataset.activeNav || "welcome");

  /* Keep homepage active nav meaningful while scrolling. */
  if (body.classList.contains("page-home") && "IntersectionObserver" in window) {
    const sectionMap = [
      ["home", "welcome"],
      ["about", "story"],
      ["moments", "moments"],
      ["media", "media"],
      ["updates", "updates"]
    ];

    const observed = sectionMap
      .map(([id, key]) => [document.getElementById(id), key])
      .filter(([el]) => Boolean(el));

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const match = observed.find(([el]) => el === visible.target);
      if (match) setActiveNav(match[1]);
    }, {
      rootMargin: "-32% 0px -52% 0px",
      threshold: [0.01, 0.2, 0.45]
    });

    observed.forEach(([el]) => observer.observe(el));
  }

  /* =====================================================
     MOBILE MENU
  ===================================================== */
  let menuWasFocusedBy = null;

  const closeMenu = ({ restoreFocus = false } = {}) => {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.remove("is-open", "open");
    menuToggle.classList.remove("is-active", "active");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    body.classList.remove("menu-open");
    closeAllMobileSubmenus();
    if (restoreFocus && menuWasFocusedBy) menuWasFocusedBy.focus();
  };

  const openMenu = () => {
    if (!mobileMenu || !menuToggle) return;
    closeSearch();
    menuWasFocusedBy = document.activeElement;
    mobileMenu.classList.add("is-open");
    menuToggle.classList.add("is-active");
    mobileMenu.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close navigation menu");
    body.classList.add("menu-open");

    const activeParent = mobileMenu.querySelector(".mobile-nav-parent-row > a.active");
    const activeGroup = activeParent?.closest(".mobile-nav-group");
    if (activeGroup) {
      activeGroup.classList.add("is-open");
      activeGroup.querySelector(".mobile-submenu-toggle")?.setAttribute("aria-expanded", "true");
    }

    requestAnimationFrame(() => {
      mobileMenu.querySelector("a")?.focus({ preventScroll: true });
    });
  };

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      mobileMenu.classList.contains("is-open") ? closeMenu() : openMenu();
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });

    mobileMenu.querySelectorAll("[data-menu-close]").forEach((el) => {
      el.addEventListener("click", () => closeMenu({ restoreFocus: true }));
    });
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > DESKTOP_BREAKPOINT) closeMenu();
  });

  /* =====================================================
     THEME
     Compatibility: update BOTH html[data-theme] and body.dark-theme
     so existing page-specific dark-mode CSS continues to work.
  ===================================================== */
  const getPreferredTheme = () => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch (_) {}
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const applyTheme = (theme, persist = false) => {
    const dark = theme === "dark";
    root.dataset.theme = dark ? "dark" : "light";
    body.classList.toggle("dark-theme", dark);

    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(dark));
      themeToggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    }

    if (persist) {
      try { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch (_) {}
    }
  };

  applyTheme(getPreferredTheme());

  themeToggle?.addEventListener("click", () => {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
  });

  /* =====================================================
     GLOBAL SEARCH
     Header search behaves identically on every page.
     It indexes main destinations + meaningful sections on current page.
  ===================================================== */
  const SITE_INDEX = [
    { title: "Welcome", category: "Home", href: "index.html#home", keywords: "home welcome oombam" },
    { title: "Our Story", category: "Home", href: "index.html#about", keywords: "story journey memories" },
    { title: "Oom Eisaya", category: "Profile", href: "oom.html", keywords: "oom eisaya profile actress" },
    { title: "Bam Saralee", category: "Profile", href: "bam.html", keywords: "bam saralee profile actress" },
    { title: "Moments", category: "Home", href: "index.html#moments", keywords: "moments gallery memories" },
    { title: "Media", category: "Home", href: "index.html#media", keywords: "media videos soundtrack interviews" },
    { title: "Fulfill The Series", category: "Media", href: "just-the-two-of-us.html", keywords: "fulfill series archive video episodes" },
    { title: "Interviews", category: "Media", href: "index.html#media-interviews", keywords: "interviews official clips appearances videos" },
    { title: "Soundtrack", category: "Media", href: "index.html#media-soundtrack", keywords: "soundtrack music songs fulfill ost" },
    { title: "Community Blossoms", category: "Blossoms", href: "community.html", keywords: "community blossoms letters projects fan art" },
    { title: "Fan Letters", category: "Blossoms", href: "community.html#letters", keywords: "fan letters write oom bam oombam" },
    { title: "Community Guidelines", category: "Blossoms", href: "community-guidelines.html", keywords: "community rules guidelines privacy respect" },
    { title: "Submission Guidelines", category: "Blossoms", href: "submission-guidelines.html", keywords: "submission rules credit photos permission" },
    { title: "Updates", category: "Home", href: "index.html#updates", keywords: "updates schedule latest" }
  ];

  const cleanText = (value = "") => value.replace(/\s+/g, " ").trim();

  const pageSections = () => {
    const pageTitle = body.dataset.pageTitle || document.title;
    const candidates = [...document.querySelectorAll("main section, main article")];
    const seen = new Set();

    return candidates.flatMap((el, index) => {
      const heading = el.querySelector("h1, h2, h3, [aria-label]");
      const title = cleanText(heading?.textContent || heading?.getAttribute?.("aria-label") || "");
      if (!title || seen.has(title.toLowerCase())) return [];
      seen.add(title.toLowerCase());

      if (!el.id) el.id = `page-search-${index + 1}`;
      const text = cleanText(el.textContent).slice(0, 420);
      const snippet = text.length > 140 ? `${text.slice(0, 137)}…` : text;
      return [{
        title,
        category: pageTitle,
        href: `#${el.id}`,
        keywords: `${title} ${text}`.toLowerCase(),
        snippet,
        local: true
      }];
    });
  };

  let localIndex = [];
  let searchWasFocusedBy = null;

  function normalizePath(pathname) {
    return pathname.replace(/\/index\.html$/i, "/");
  }

  function isSamePageHref(href) {
    try {
      const target = new URL(href, window.location.href);
      return target.origin === window.location.origin &&
        normalizePath(target.pathname) === normalizePath(window.location.pathname);
    } catch (_) {
      return false;
    }
  }

  function navigateOrScroll(href) {
    if (!href) return;
    const targetUrl = new URL(href, window.location.href);
    if (isSamePageHref(href) && targetUrl.hash) {
      const target = document.querySelector(targetUrl.hash);
      if (target) {
        const offset = siteHeader?.offsetHeight || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - offset - 12;
        window.scrollTo({ top, behavior: "smooth" });
        return;
      }
    }
    window.location.href = href;
  }

  function makeSearchResult(item) {
    const link = document.createElement("a");
    link.className = "site-search-result";
    link.href = item.href;

    const copy = document.createElement("div");
    const category = document.createElement("span");
    category.textContent = item.category;
    const title = document.createElement("strong");
    title.textContent = item.title;
    copy.append(category, title);

    if (item.snippet) {
      const snippet = document.createElement("small");
      snippet.textContent = item.snippet;
      copy.append(snippet);
    }

    const arrow = document.createElement("em");
    arrow.textContent = "↗";
    link.append(copy, arrow);

    link.addEventListener("click", (event) => {
      if (item.local || isSamePageHref(item.href)) {
        event.preventDefault();
        closeSearch();
        navigateOrScroll(item.href);
      }
    });
    return link;
  }

  function renderSearch(query = "") {
    if (!searchResults) return;
    const q = cleanText(query).toLowerCase();
    searchResults.replaceChildren();

    const source = [...SITE_INDEX, ...localIndex];
    const results = q
      ? source.filter((item) => `${item.title} ${item.category} ${item.keywords || ""}`.toLowerCase().includes(q))
      : SITE_INDEX.slice(0, 6);

    const deduped = [];
    const seen = new Set();
    for (const item of results) {
      const key = `${item.title}|${item.href}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      }
      if (deduped.length === 8) break;
    }

    if (!deduped.length) {
      const empty = document.createElement("p");
      empty.className = "site-search-empty";
      empty.textContent = `No result found for “${query}”. Try Oom, Bam, Fulfill, Moments, or Blossoms.`;
      searchResults.append(empty);
      return;
    }

    deduped.forEach((item) => searchResults.append(makeSearchResult(item)));
  }

  function openSearch() {
    if (!siteSearch || !searchToggle || !searchInput) return;
    closeMenu();
    localIndex = pageSections();
    searchWasFocusedBy = document.activeElement;
    siteSearch.classList.add("is-open");
    siteSearch.setAttribute("aria-hidden", "false");
    searchToggle.setAttribute("aria-expanded", "true");
    body.classList.add("search-open");
    renderSearch(searchInput.value);
    requestAnimationFrame(() => searchInput.focus({ preventScroll: true }));
  }

  function closeSearch({ restoreFocus = false } = {}) {
    if (!siteSearch || !searchToggle) return;
    siteSearch.classList.remove("is-open");
    siteSearch.setAttribute("aria-hidden", "true");
    searchToggle.setAttribute("aria-expanded", "false");
    body.classList.remove("search-open");
    if (restoreFocus && searchWasFocusedBy) searchWasFocusedBy.focus();
  }

  searchToggle?.addEventListener("click", () => {
    siteSearch?.classList.contains("is-open") ? closeSearch({ restoreFocus: true }) : openSearch();
  });
  searchClose?.addEventListener("click", () => closeSearch({ restoreFocus: true }));
  siteSearch?.querySelectorAll("[data-search-close]").forEach((el) => {
    el.addEventListener("click", () => closeSearch({ restoreFocus: true }));
  });
  searchInput?.addEventListener("input", () => renderSearch(searchInput.value));

  /* =====================================================
     KEYBOARD / SAME-PAGE NAVIGATION
  ===================================================== */
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (siteSearch?.classList.contains("is-open")) closeSearch({ restoreFocus: true });
    else if (mobileMenu?.classList.contains("is-open")) closeMenu({ restoreFocus: true });
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || link.closest(".site-search-result")) return;
    const href = link.getAttribute("href");
    if (!href || !isSamePageHref(href)) return;
    const targetUrl = new URL(href, window.location.href);
    if (!targetUrl.hash) return;
    const target = document.querySelector(targetUrl.hash);
    if (!target) return;
    event.preventDefault();
    closeMenu();
    navigateOrScroll(href);
  });

  /* Dynamic copyright year used by profile pages. */
  const currentYear = document.getElementById("currentYear");
  if (currentYear) currentYear.textContent = new Date().getFullYear();

  /* =====================================================
     HOMEPAGE EVENT COUNTDOWN
     Kept here so the same shared script is safe on all pages.
  ===================================================== */
  const eventCountdown = document.getElementById("eventCountdown");
  const countdownDays = document.getElementById("countdownDays");
  const countdownHours = document.getElementById("countdownHours");
  const countdownMinutes = document.getElementById("countdownMinutes");
  const countdownSeconds = document.getElementById("countdownSeconds");
  const countdownStatus = document.getElementById("countdownStatus");

  if (eventCountdown && countdownDays && countdownHours && countdownMinutes && countdownSeconds) {
    const targetTime = new Date("2026-08-15T00:00:00+08:00").getTime();
    const pad = (n) => String(n).padStart(2, "0");

    const updateCountdown = () => {
      const remaining = targetTime - Date.now();
      if (remaining <= 0) {
        countdownDays.textContent = "00";
        countdownHours.textContent = "00";
        countdownMinutes.textContent = "00";
        countdownSeconds.textContent = "00";
        if (countdownStatus) countdownStatus.textContent = "OOMBAM • Shanghai Private Event";
        return false;
      }
      const SECOND = 1000, MINUTE = 60000, HOUR = 3600000, DAY = 86400000;
      countdownDays.textContent = pad(Math.floor(remaining / DAY));
      countdownHours.textContent = pad(Math.floor((remaining % DAY) / HOUR));
      countdownMinutes.textContent = pad(Math.floor((remaining % HOUR) / MINUTE));
      countdownSeconds.textContent = pad(Math.floor((remaining % MINUTE) / SECOND));
      if (countdownStatus) countdownStatus.textContent = "Shanghai Private Event • August 15, 2026 • Shanghai, China";
      return true;
    };

    if (updateCountdown()) {
      const timer = window.setInterval(() => {
        if (!updateCountdown()) window.clearInterval(timer);
      }, 1000);
    }
  }
})();
