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
  const searchInput = document.getElementById("siteSearchInput");
  const searchForm = document.getElementById("siteSearchForm");
  const searchStatus = document.getElementById("siteSearchStatus");
  const searchResults = document.getElementById("siteSearchResults");
  const themeGlyph = themeToggle?.querySelector(".ob-theme-glyph");

  const DESKTOP_BREAKPOINT = 1100;
  const THEME_KEY = "oombam-theme";

  /* -----------------------------------------------------
     Helpers
  ----------------------------------------------------- */
  const normalizedPath = (pathname) => pathname
    .replace(/\\/g, "/")
    .replace(/\/index\.html$/i, "/");

  const samePage = (href) => {
    try {
      const target = new URL(href, window.location.href);
      return target.origin === window.location.origin &&
        normalizedPath(target.pathname) === normalizedPath(window.location.pathname);
    } catch (_) {
      return false;
    }
  };

  const isCurrentSubmenuHref = (href) => {
    if (!href) return false;
    try {
      const target = new URL(href, window.location.href);
      const samePath = target.origin === window.location.origin &&
        normalizedPath(target.pathname) === normalizedPath(window.location.pathname);
      if (!samePath) return false;
      if (target.hash) return target.hash === window.location.hash;
      return normalizedPath(target.pathname) !== "/" || !window.location.hash;
    } catch (_) {
      return false;
    }
  };

  const cleanText = (value = "") => value.replace(/\s+/g, " ").trim();

  /* -----------------------------------------------------
     Header scroll state
  ----------------------------------------------------- */
  const updateHeader = () => {
    siteHeader?.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  /* -----------------------------------------------------
     Desktop submenus
  ----------------------------------------------------- */
  const desktopGroups = [...document.querySelectorAll(".ob-nav__group")];

  const closeDesktopSubmenus = (except = null) => {
    desktopGroups.forEach((group) => {
      if (group === except) return;
      group.classList.remove("is-open");
      group.querySelector(".ob-nav__submenu-toggle")?.setAttribute("aria-expanded", "false");
    });
  };

  desktopGroups.forEach((group) => {
    const toggle = group.querySelector(".ob-nav__submenu-toggle");
    const submenu = group.querySelector(".ob-submenu");
    if (!toggle || !submenu) return;

    let closeTimer = null;

    const cancelClose = () => {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
    };

    const setOpen = (open) => {
      cancelClose();
      if (open) closeDesktopSubmenus(group);
      group.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    const scheduleClose = () => {
      cancelClose();
      closeTimer = window.setTimeout(() => setOpen(false), 140);
    };

    const parentLink = group.querySelector(".ob-nav__link");
    const touchPrimary = window.matchMedia("(hover: none), (pointer: coarse)");

    /*
      Mouse/trackpad desktops: true hover navigation.
      Touch tablets: never depend on hover because WebKit can synthesize
      pointerenter/pointerleave around a tap and immediately close the menu.
    */
    group.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") setOpen(true);
    });
    group.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") scheduleClose();
    });
    submenu.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") cancelClose();
    });
    submenu.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") scheduleClose();
    });

    /* Chevron is always an explicit submenu toggle. */
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setOpen(!group.classList.contains("is-open"));
    });

    /*
      Touch-tablet interaction:
      - first tap on Media/Blossoms opens and keeps the submenu visible
      - second tap on the already-open parent follows its normal link
      - tapping elsewhere closes the submenu
      This preserves the parent destination without sacrificing discoverability.
    */
    parentLink?.addEventListener("click", (event) => {
      const touchLike = touchPrimary.matches || event.detail === 0;
      if (!touchLike) return;

      if (!group.classList.contains("is-open")) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(true);
      }
    });

    /* Prevent the browser's long-press link sheet on touch navigation parents. */
    parentLink?.addEventListener("contextmenu", (event) => {
      if (touchPrimary.matches) event.preventDefault();
    });

    group.addEventListener("focusin", () => setOpen(true));
    group.addEventListener("focusout", (event) => {
      if (!group.contains(event.relatedTarget)) scheduleClose();
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.focus();
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".ob-nav__group")) closeDesktopSubmenus();
  });

  /* Highlight exact submenu destination. */
  const updateSubmenuCurrentStates = () => {
    document.querySelectorAll(".ob-submenu__link[href], .ob-mobile-submenu__link[href]").forEach((link) => {
      const current = isCurrentSubmenuHref(link.getAttribute("href"));
      link.classList.toggle("is-current", current);
      if (current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };
  updateSubmenuCurrentStates();
  window.addEventListener("hashchange", updateSubmenuCurrentStates);

  /* -----------------------------------------------------
     Active main navigation
  ----------------------------------------------------- */
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

  /* -----------------------------------------------------
     Mobile submenu accordions
  ----------------------------------------------------- */
  const mobileGroups = [...document.querySelectorAll(".ob-mobile-nav__group")];

  const closeMobileSubmenus = (except = null) => {
    mobileGroups.forEach((group) => {
      if (group === except) return;
      group.classList.remove("is-open");
      group.querySelector(".ob-mobile-nav__toggle")?.setAttribute("aria-expanded", "false");
    });
  };

  mobileGroups.forEach((group) => {
    const toggle = group.querySelector(".ob-mobile-nav__toggle");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const open = !group.classList.contains("is-open");
      if (open) closeMobileSubmenus(group);
      group.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
  });

  /* -----------------------------------------------------
     Mobile menu
  ----------------------------------------------------- */
  let menuWasFocusedBy = null;

  function closeMenu({ restoreFocus = false } = {}) {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.remove("is-open");
    menuToggle.classList.remove("is-active");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    body.classList.remove("ob-menu-open");
    closeMobileSubmenus();
    if (restoreFocus && menuWasFocusedBy) menuWasFocusedBy.focus();
  }

  function openMenu() {
    if (!mobileMenu || !menuToggle) return;
    closeSearch();
    menuWasFocusedBy = document.activeElement;
    mobileMenu.classList.add("is-open");
    menuToggle.classList.add("is-active");
    mobileMenu.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close navigation menu");
    body.classList.add("ob-menu-open");

    const activeParent = mobileMenu.querySelector(".ob-mobile-nav__parent-link.active");
    const activeGroup = activeParent?.closest(".ob-mobile-nav__group");
    if (activeGroup) {
      activeGroup.classList.add("is-open");
      activeGroup.querySelector(".ob-mobile-nav__toggle")?.setAttribute("aria-expanded", "true");
    }

    requestAnimationFrame(() => {
      mobileMenu.querySelector("a")?.focus({ preventScroll: true });
    });
  }

  menuToggle?.addEventListener("click", () => {
    mobileMenu?.classList.contains("is-open") ? closeMenu() : openMenu();
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => closeMenu());
  });

  mobileMenu?.querySelectorAll("[data-menu-close]").forEach((el) => {
    el.addEventListener("click", () => closeMenu({ restoreFocus: true }));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > DESKTOP_BREAKPOINT) closeMenu();
  });

  /* -----------------------------------------------------
     Theme
  ----------------------------------------------------- */
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
    body.classList.toggle("dark-theme", dark); // keeps legacy page dark styles working

    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(dark));
      themeToggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    }
    if (themeGlyph) themeGlyph.textContent = dark ? "☀" : "☾";

    if (persist) {
      try { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch (_) {}
    }
  };

  applyTheme(getPreferredTheme());
  themeToggle?.addEventListener("click", () => {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
  });

  /* -----------------------------------------------------
     Global site search
  ----------------------------------------------------- */
  const SITE_INDEX = [
    { title: "Welcome", category: "Home", href: "index.html#home", keywords: "home welcome oombam" },
    { title: "Our Story", category: "Home", href: "index.html#about", keywords: "story journey memories" },
    { title: "Oom Eisaya", category: "Profile", href: "oom.html", keywords: "oom eisaya profile actress" },
    { title: "Bam Saralee", category: "Profile", href: "bam.html", keywords: "bam saralee profile actress" },
    { title: "Moments", category: "Home", href: "index.html#moments", keywords: "moments gallery memories" },
    { title: "Media", category: "Home", href: "index.html#media", keywords: "media videos soundtrack interviews" },
    { title: "Fulfill The Series", category: "Media", href: "just-the-two-of-us.html", keywords: "fulfill series archive video episodes" },
    { title: "Interviews", category: "Media", href: "index.html#media-interviews", keywords: "interviews official clips appearances videos" },
    { title: "Blogs", category: "Media", href: "index.html#media-blogs", keywords: "blogs stories notes editorials reflections oombam" },
    { title: "Soundtrack", category: "Media", href: "index.html#media-soundtrack", keywords: "soundtrack music songs fulfill ost" },
    { title: "Community Blossoms", category: "Blossoms", href: "community.html", keywords: "community blossoms letters projects fan art" },
    { title: "Fan Letters", category: "Blossoms", href: "community.html#letters", keywords: "fan letters write oom bam oombam" },
    { title: "Community Guidelines", category: "Blossoms", href: "community-guidelines.html", keywords: "community rules guidelines privacy respect" },
    { title: "Submission Guidelines", category: "Blossoms", href: "submission-guidelines.html", keywords: "submission rules credit photos permission" },
    { title: "Updates", category: "Home", href: "index.html#updates", keywords: "updates schedule latest" }
  ];

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

  function navigateOrScroll(href) {
    if (!href) return;
    const targetUrl = new URL(href, window.location.href);
    if (samePage(href) && targetUrl.hash) {
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
    link.className = "ob-search-result";
    link.href = item.href;

    const copy = document.createElement("div");
    const category = document.createElement("span");
    category.className = "ob-search-result__category";
    category.textContent = item.category;
    const title = document.createElement("strong");
    title.className = "ob-search-result__title";
    title.textContent = item.title;
    copy.append(category, title);

    if (item.snippet) {
      const snippet = document.createElement("small");
      snippet.className = "ob-search-result__snippet";
      snippet.textContent = item.snippet;
      copy.append(snippet);
    }

    const arrow = document.createElement("em");
    arrow.className = "ob-search-result__arrow";
    arrow.textContent = "↗";
    link.append(copy, arrow);

    link.addEventListener("click", (event) => {
      if (item.local || samePage(item.href)) {
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

    if (!q) {
      if (searchStatus) searchStatus.textContent = "Start typing to search pages and sections.";
      return;
    }

    const source = [...SITE_INDEX, ...localIndex];
    const results = source.filter((item) =>
      `${item.title} ${item.category} ${item.keywords || ""}`.toLowerCase().includes(q)
    );

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
      empty.className = "ob-site-search__empty";
      empty.textContent = `No result found for “${query}”. Try Oom, Bam, Fulfill, Interviews, or Blossoms.`;
      searchResults.append(empty);
      if (searchStatus) searchStatus.textContent = "No matching pages or sections found.";
      return;
    }

    if (searchStatus) {
      searchStatus.textContent = `${deduped.length} result${deduped.length === 1 ? "" : "s"} found.`;
    }
    deduped.forEach((item) => searchResults.append(makeSearchResult(item)));
  }

  function openSearch() {
    if (!siteSearch || !searchToggle || !searchInput) return;
    closeMenu();
    localIndex = pageSections();
    searchWasFocusedBy = document.activeElement;
    siteSearch.hidden = false;
    siteSearch.setAttribute("aria-hidden", "false");
    searchToggle.setAttribute("aria-expanded", "true");
    renderSearch(searchInput.value);
    requestAnimationFrame(() => searchInput.focus({ preventScroll: true }));
  }

  function closeSearch({ restoreFocus = false } = {}) {
    if (!siteSearch || !searchToggle) return;
    siteSearch.hidden = true;
    siteSearch.setAttribute("aria-hidden", "true");
    searchToggle.setAttribute("aria-expanded", "false");
    searchResults?.replaceChildren();
    if (searchStatus) searchStatus.textContent = "Start typing to search pages and sections.";
    if (restoreFocus && searchWasFocusedBy) searchWasFocusedBy.focus();
  }

  searchToggle?.addEventListener("click", () => {
    if (!siteSearch) return;
    siteSearch.hidden ? openSearch() : closeSearch({ restoreFocus: true });
  });

  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    renderSearch(searchInput?.value || "");
  });

  searchInput?.addEventListener("input", () => renderSearch(searchInput.value));

  /* -----------------------------------------------------
     Keyboard + same-page navigation
  ----------------------------------------------------- */
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeDesktopSubmenus();
    if (siteSearch && !siteSearch.hidden) closeSearch({ restoreFocus: true });
    else if (mobileMenu?.classList.contains("is-open")) closeMenu({ restoreFocus: true });
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || link.closest(".ob-search-result")) return;
    const href = link.getAttribute("href");
    if (!href || !samePage(href)) return;
    const targetUrl = new URL(href, window.location.href);
    if (!targetUrl.hash) return;
    const target = document.querySelector(targetUrl.hash);
    if (!target) return;
    event.preventDefault();
    closeMenu();
    navigateOrScroll(href);
  });

  /* Dynamic footer year */
  const currentYear = document.getElementById("currentYear");
  if (currentYear) currentYear.textContent = new Date().getFullYear();

  /* -----------------------------------------------------
     Homepage event countdown — safe on pages without it
  ----------------------------------------------------- */
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
