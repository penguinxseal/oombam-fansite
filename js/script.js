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
  /* -----------------------------------------------------
     Mobile menu viewport anchoring
     -----------------------------------------------------
     Static 58px/72px offsets drift on iOS/Chrome landscape as
     browser chrome changes the visible viewport. Measure the
     actual sticky-header bottom and expose it to Global.css.
  ----------------------------------------------------- */
  function syncMobileMenuAnchor() {
    if (!siteHeader) return;

    if (window.innerWidth > DESKTOP_BREAKPOINT) {
      root.style.removeProperty("--ob-mobile-menu-top");
      return;
    }

    const headerRect = siteHeader.getBoundingClientRect();
    const headerBottom = Math.max(0, Math.round(headerRect.bottom));
    root.style.setProperty("--ob-mobile-menu-top", `${headerBottom}px`);
  }

  syncMobileMenuAnchor();

  let menuWasFocusedBy = null;
  let lockedScrollY = 0;
  let menuScrollLocked = false;

  function lockPageForMobileMenu() {
    if (menuScrollLocked) return;

    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    menuScrollLocked = true;

    /*
      iOS Safari/Chrome can continue moving the visual viewport even when
      overflow:hidden is applied to body. Freezing the document itself keeps
      the landscape navigation panel physically stationary on screen.
    */
    body.style.position = "fixed";
    body.style.top = `-${lockedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
  }

  function unlockPageForMobileMenu() {
    if (!menuScrollLocked) return;

    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    body.style.overflow = "";

    menuScrollLocked = false;
    window.scrollTo(0, lockedScrollY);
  }

  function closeMenu({ restoreFocus = false } = {}) {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.remove("is-open");
    menuToggle.classList.remove("is-active");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    body.classList.remove("ob-menu-open");
    unlockPageForMobileMenu();
    closeMobileSubmenus();
    if (restoreFocus && menuWasFocusedBy) menuWasFocusedBy.focus();
  }

  function openMenu() {
    if (!mobileMenu || !menuToggle) return;
    syncMobileMenuAnchor();
    closeSearch();
    lockPageForMobileMenu();
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
      syncMobileMenuAnchor();
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
    syncMobileMenuAnchor();
    if (window.innerWidth > DESKTOP_BREAKPOINT) closeMenu();
  }, { passive: true });

  window.addEventListener("orientationchange", () => {
    window.setTimeout(syncMobileMenuAnchor, 80);
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncMobileMenuAnchor, { passive: true });
    /* Do not reposition the open menu on visualViewport scroll.
       The page is scroll-locked while the menu is open, so moving the
       panel here would recreate the landscape drift we are preventing. */
  }

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
    if (themeGlyph) {
      themeGlyph.innerHTML = dark
        ? `<svg class="ob-theme-svg ob-theme-svg--sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
             <circle cx="12" cy="12" r="4.25"></circle>
             <path d="M12 2.25v2.1M12 19.65v2.1M2.25 12h2.1M19.65 12h2.1M5.1 5.1l1.48 1.48M17.42 17.42l1.48 1.48M18.9 5.1l-1.48 1.48M6.58 17.42L5.1 18.9"></path>
           </svg>`
        : `<svg class="ob-theme-svg ob-theme-svg--moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
             <path d="M20.1 15.4A8.2 8.2 0 0 1 8.6 3.9 8.7 8.7 0 1 0 20.1 15.4Z"></path>
           </svg>`;
    }

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
    { title: "Vlogs", category: "Media", href: "index.html#media-vlogs", keywords: "vlogs trips activities behind the scenes casual moments oombam" },
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




  /* -----------------------------------------------------
     Interviews archive runtime verification
  ----------------------------------------------------- */
  if (document.querySelector("[data-interviews-open]") && !document.getElementById("interviewsModal")) {
    console.warn("[OomBam] Interviews trigger found but Interviews modal markup is missing.");
  }

  /* -----------------------------------------------------
     Homepage Interviews Archive — in-page modal
  ----------------------------------------------------- */
  const INTERVIEW_ITEMS = [
  {
    "title": "Character introduction: Pafun",
    "category": "quick",
    "platform": "TikTok",
    "url": "https://www.tiktok.com/@oombam_ch3/video/7629251593849933077"
  },
  {
    "title": "Character introduction: Aioon",
    "category": "quick",
    "platform": "TikTok",
    "url": "https://www.tiktok.com/@oombam_ch3/video/7629411087493909768"
  },
  {
    "title": "Save the Date 𝒜𝒾𝑜𝑜𝓃 🩵 𝒫𝒶𝒻𝓊𝓃",
    "category": "features",
    "platform": "TikTok",
    "url": "https://www.tiktok.com/@oombam_ch3/video/7630385428822084882"
  },
  {
    "title": "🐧🦭 Behind the Scenes at the Fulfill Series Blessing Ceremony ✨🩵",
    "category": "features",
    "platform": "TikTok",
    "url": "https://www.tiktok.com/@oombam_ch3/video/7631181076773326101"
  },
  {
    "title": "My Ambulove EP.43 — Oom & Bam | GoyNattyDream",
    "category": "long",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=PfPtNgyRIiw&t=96s"
  },
  {
    "title": "Uncut — OomBam on Preaw Pak EP.20 | Sam Roasters x BeneBene.bkk",
    "category": "long",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=I-XsZuycpI0"
  },
  {
    "title": "OomBam Interview: I’m so glad it’s you | SERIES SOCIETY",
    "category": "long",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=eFhgj2ZJ7I4"
  },
  {
    "title": "A Feel-Good English Chat with Sapphic Pair Oom–Bam | Kham Nee Dee Feat. EP.195",
    "category": "long",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=8LDF9li9Y-c"
  },
  {
    "title": "If You Can’t Take It Anymore, Just Cry — Oom & Bam Open Up About Life and Learning to Love Themselves | Dear Myself EP.38",
    "category": "long",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=fUY-qq8x1y8&t=911s"
  },
  {
    "title": "Fulfill — Oom Eisaya & Bam Saralee | Time to Talk EP.64",
    "category": "long",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=5CY1PWgf_po"
  },
  {
    "title": "Fun Interview & Games with OomBam x Doo Yuri Pai Wan Wan | Fun Talk with #OomBam",
    "category": "long",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=vYDWOW3RETo&t=56s"
  },
  {
    "title": "ELLE Ask Me Anything: OomBam",
    "category": "quick",
    "platform": "X",
    "url": "https://x.com/ELLEThailand/status/2063173680902152663/video/1"
  },
  {
    "title": "OomBam’s 2nd DaraLive Interview | Fulfill [ENG SUB]",
    "category": "long",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=JCSxcdHJvDw"
  },
  {
    "title": "ARMCHAIR: Casual Talk, Serious Conversations — Oom Eisaya & Bam Saralee | EP.31",
    "category": "long",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=fCBLvksldCQ"
  },
  {
    "title": "LIVE: Oom Eisaya Celebrates Her Birthday at ‘OOM Eisaya Birthday Charity 2026’",
    "category": "features",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=98y6aPkV33A"
  },
  {
    "title": "PODKAZZ EP.14 — Oom–Bam: Friendship, Dreams & a Message to Their Fans",
    "category": "long",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=9sCz53r9yWA"
  },
  {
    "title": "You Know Me EP.27 — OomBam: Every Step of Growth Has a Story and Enriches Our Lives | Khaosod",
    "category": "long",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=eLleedcKO0Y"
  },
  {
    "title": "OomBam x Blooming with You Interview 11.07.2026 | BLOOMING DAY WITH OOMBAM #OomBam1stFansign",
    "category": "features",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=0O0tUDjoHak"
  },
  {
    "title": "Oom–Bam on Finding Comfort in Having a Partner, Choosing Opposing Teams for #GirlCup, and Watching Their Rivalry Turn Adorable",
    "category": "features",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=BenfzXARvqo"
  }
];

  const interviewsModal = document.getElementById("interviewsModal");
  const interviewsGrid = document.getElementById("interviewsGrid");
  const interviewsView = document.getElementById("interviewsView");
  const interviewPlayerView = document.getElementById("interviewPlayerView");
  const interviewPlayerShell = document.getElementById("interviewPlayerShell");
  const interviewPlayerTitle = document.getElementById("interviewPlayerTitle");
  const interviewPlayerPlatform = document.getElementById("interviewPlayerPlatform");
  const interviewPlayerOriginal = document.getElementById("interviewPlayerOriginal");
  const interviewTabs = [...document.querySelectorAll("[data-interview-filter]")];
  const interviewOpeners = [...document.querySelectorAll("[data-interviews-open]")];
  const interviewClosers = [...document.querySelectorAll("[data-interviews-close]")];
  let interviewsLastFocus = null;
  let interviewsScrollY = 0;

  const youtubeIdFromUrl = (url) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1);
      return parsed.searchParams.get("v");
    } catch (_) {
      return "";
    }
  };

  const tiktokIdFromUrl = (url) => {
    const match = String(url).match(/\/video\/(\d+)/);
    return match ? match[1] : "";
  };

  const interviewCategoryLabel = (category) => ({
    long: "Long-form",
    quick: "Quick Interview",
    features: "Feature"
  }[category] || "Interview");

  function buildInterviewCard(item) {
    const card = document.createElement("article");
    card.className = "interview-card";
    card.dataset.category = item.category;

    const top = document.createElement("div");
    top.className = "interview-card__top";

    const platform = document.createElement("span");
    platform.className = `interview-platform interview-platform--${item.platform.toLowerCase()}`;
    platform.textContent = item.platform;

    const category = document.createElement("span");
    category.className = "interview-card__category";
    category.textContent = interviewCategoryLabel(item.category);

    top.append(platform, category);

    const title = document.createElement("h3");
    title.textContent = item.title;

    const action = document.createElement("button");
    action.type = "button";
    action.className = "interview-card__action";
    action.textContent = item.platform === "X" ? "Open on X ↗" : "Watch →";

    if (item.platform === "X") {
      action.addEventListener("click", () => window.open(item.url, "_blank", "noopener,noreferrer"));
    } else {
      action.addEventListener("click", () => openInterviewPlayer(item));
    }

    card.append(top, title, action);
    return card;
  }

  function renderInterviews(filter = "all") {
    if (!interviewsGrid) return;
    const visible = filter === "all"
      ? INTERVIEW_ITEMS
      : INTERVIEW_ITEMS.filter((item) => item.category === filter);
    interviewsGrid.replaceChildren(...visible.map(buildInterviewCard));
  }

  function setInterviewFilter(filter) {
    interviewTabs.forEach((tab) => {
      const active = tab.dataset.interviewFilter === filter;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    renderInterviews(filter);
  }

  function resetInterviewPlayer() {
    if (interviewPlayerShell) interviewPlayerShell.replaceChildren();
    if (interviewPlayerView) interviewPlayerView.hidden = true;
    if (interviewsView) interviewsView.hidden = false;
  }

  function openInterviewPlayer(item) {
    if (!interviewPlayerShell || !interviewPlayerView || !interviewsView) return;
    interviewPlayerShell.replaceChildren();

    const iframe = document.createElement("iframe");
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    iframe.title = item.title;

    if (item.platform === "YouTube") {
      const id = youtubeIdFromUrl(item.url);
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
      iframe.className = "interview-player-frame interview-player-frame--youtube";
    } else if (item.platform === "TikTok") {
      const id = tiktokIdFromUrl(item.url);
      iframe.src = `https://www.tiktok.com/player/v1/${id}?autoplay=0&loop=0`;
      iframe.className = "interview-player-frame interview-player-frame--tiktok";
    }

    interviewPlayerShell.append(iframe);
    interviewPlayerTitle.textContent = item.title;
    interviewPlayerPlatform.textContent = `${item.platform} • ${interviewCategoryLabel(item.category)}`;
    interviewPlayerOriginal.href = item.url;
    interviewPlayerOriginal.textContent = `Open on ${item.platform} ↗`;

    interviewsView.hidden = true;
    interviewPlayerView.hidden = false;
    interviewPlayerView.scrollIntoView({ block: "start" });
  }

  function openInterviewsModal() {
    if (!interviewsModal) return;
    interviewsLastFocus = document.activeElement;
    interviewsScrollY = window.scrollY || 0;
    resetInterviewPlayer();
    setInterviewFilter("all");
    interviewsModal.classList.add("is-open");
    interviewsModal.setAttribute("aria-hidden", "false");
    body.classList.add("interviews-open");
    requestAnimationFrame(() => interviewsModal.querySelector(".interviews-modal__close")?.focus({ preventScroll: true }));
  }

  function closeInterviewsModal() {
    if (!interviewsModal) return;
    interviewsModal.classList.remove("is-open");
    interviewsModal.setAttribute("aria-hidden", "true");
    body.classList.remove("interviews-open");
    resetInterviewPlayer();
    window.scrollTo(0, interviewsScrollY);
    interviewsLastFocus?.focus?.({ preventScroll: true });
  }

  interviewOpeners.forEach((button) => button.addEventListener("click", openInterviewsModal));
  interviewClosers.forEach((button) => button.addEventListener("click", closeInterviewsModal));
  interviewTabs.forEach((tab) => tab.addEventListener("click", () => setInterviewFilter(tab.dataset.interviewFilter)));
  document.querySelector("[data-interview-back]")?.addEventListener("click", resetInterviewPlayer);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && interviewsModal?.classList.contains("is-open")) {
      closeInterviewsModal();
    }
  });

  renderInterviews("all");



  /* -----------------------------------------------------
     Homepage Vlogs Archive — in-page modal
  ----------------------------------------------------- */
  const VLOG_ITEMS = [
  {
    "title": "OomBam Vlog: Practicing for Their Honeymoon in Hong Kong",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=uld1-ODX768"
  },
  {
    "title": "Mini Vlog: A Merit-Making Trip That Feels More Like a Date?!",
    "platform": "X",
    "url": "https://x.com/OomBam_CH3/status/2063893796656427286/video/1"
  },
  {
    "title": "Ending the Year on a Warm Note with the ‘New Year Pajama Party’",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=5waayw1E2yA"
  },
  {
    "title": "OomBam: Horseback Riding Is Just an Excuse, But… I Want You in Every Universe",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=9gYJCDoVlqE"
  },
  {
    "title": "OomBam: Step Dance (Love)",
    "platform": "YouTube",
    "url": "https://www.youtube.com/watch?v=epGazWVi2hk"
  }
];

  const vlogsModal = document.getElementById("vlogsModal");
  const vlogsGrid = document.getElementById("vlogsGrid");
  const vlogsView = document.getElementById("vlogsView");
  const vlogPlayerView = document.getElementById("vlogPlayerView");
  const vlogPlayerShell = document.getElementById("vlogPlayerShell");
  const vlogPlayerTitle = document.getElementById("vlogPlayerTitle");
  const vlogPlayerPlatform = document.getElementById("vlogPlayerPlatform");
  const vlogPlayerOriginal = document.getElementById("vlogPlayerOriginal");
  const vlogOpeners = [...document.querySelectorAll("[data-vlogs-open]")];
  const vlogClosers = [...document.querySelectorAll("[data-vlogs-close]")];
  let vlogsLastFocus = null;
  let vlogsScrollY = 0;

  function buildVlogCard(item) {
    const card = document.createElement("article");
    card.className = "vlog-card";

    const platform = document.createElement("span");
    platform.className = `vlog-platform vlog-platform--${item.platform.toLowerCase()}`;
    platform.textContent = item.platform;

    const title = document.createElement("h3");
    title.textContent = item.title;

    const action = document.createElement("button");
    action.type = "button";
    action.className = "vlog-card__action";
    action.textContent = item.platform === "X" ? "Open on X ↗" : "Watch →";

    if (item.platform === "X") {
      action.addEventListener("click", () => window.open(item.url, "_blank", "noopener,noreferrer"));
    } else {
      action.addEventListener("click", () => openVlogPlayer(item));
    }

    card.append(platform, title, action);
    return card;
  }

  function renderVlogs() {
    if (!vlogsGrid) return;
    vlogsGrid.replaceChildren(...VLOG_ITEMS.map(buildVlogCard));
  }

  function resetVlogPlayer() {
    if (vlogPlayerShell) vlogPlayerShell.replaceChildren();
    if (vlogPlayerView) vlogPlayerView.hidden = true;
    if (vlogsView) vlogsView.hidden = false;
  }

  function openVlogPlayer(item) {
    if (!vlogPlayerShell || !vlogPlayerView || !vlogsView) return;

    vlogPlayerShell.replaceChildren();

    const iframe = document.createElement("iframe");
    iframe.className = "vlog-player-frame vlog-player-frame--youtube";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    iframe.title = item.title;

    const id = youtubeIdFromUrl(item.url);
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;

    vlogPlayerShell.append(iframe);
    vlogPlayerTitle.textContent = item.title;
    vlogPlayerPlatform.textContent = item.platform;
    vlogPlayerOriginal.href = item.url;
    vlogPlayerOriginal.textContent = `Open on ${item.platform} ↗`;

    vlogsView.hidden = true;
    vlogPlayerView.hidden = false;
    vlogPlayerView.scrollIntoView({ block: "start" });
  }

  function openVlogsModal() {
    if (!vlogsModal) return;
    vlogsLastFocus = document.activeElement;
    vlogsScrollY = window.scrollY || 0;
    resetVlogPlayer();
    renderVlogs();
    vlogsModal.classList.add("is-open");
    vlogsModal.setAttribute("aria-hidden", "false");
    body.classList.add("vlogs-open");
    requestAnimationFrame(() => vlogsModal.querySelector(".vlogs-modal__close")?.focus({ preventScroll: true }));
  }

  function closeVlogsModal() {
    if (!vlogsModal) return;
    vlogsModal.classList.remove("is-open");
    vlogsModal.setAttribute("aria-hidden", "true");
    body.classList.remove("vlogs-open");
    resetVlogPlayer();
    window.scrollTo(0, vlogsScrollY);
    vlogsLastFocus?.focus?.({ preventScroll: true });
  }

  vlogOpeners.forEach((button) => button.addEventListener("click", openVlogsModal));
  vlogClosers.forEach((button) => button.addEventListener("click", closeVlogsModal));
  document.querySelector("[data-vlog-back]")?.addEventListener("click", resetVlogPlayer);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && vlogsModal?.classList.contains("is-open")) {
      closeVlogsModal();
    }
  });

  renderVlogs();



  /* -----------------------------------------------------
     Media submenu navigation
     Desktop + mobile:
     - Interviews opens Interviews modal
     - Vlogs opens Vlogs modal
     - Soundtrack scrolls to soundtrack thumbnail
  ----------------------------------------------------- */
  function scrollToMediaCard(selector) {
    const target = document.querySelector(selector);
    if (!target) return;

    closeDesktopSubmenus();
    closeMenu();

    const offset = siteHeader?.offsetHeight || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - offset - 18;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: "smooth"
    });

    target.classList.add("media-nav-target");
    window.setTimeout(() => target.classList.remove("media-nav-target"), 1200);
  }

  document.querySelectorAll("[data-open-interviews-nav]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      closeDesktopSubmenus();
      closeMenu();
      openInterviewsModal();
    });
  });

  document.querySelectorAll("[data-open-vlogs-nav]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      closeDesktopSubmenus();
      closeMenu();
      openVlogsModal();
    });
  });

  document.querySelectorAll("[data-scroll-soundtrack-nav]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      scrollToMediaCard("#media-soundtrack");
    });
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


/* =========================================================
   Homepage Moments — monthly modal archive
========================================================= */
(() => {
  const body = document.body;

  const MOMENTS_MONTHS = [
    {
      key: "april",
      eyebrow: "APRIL 2026",
      title: "The Fulfill Era Begins",
      intro: "April marked the opening chapter of OomBam’s 2026 journey — moving from introductions and teasers into the official premiere era of Fulfill.",
      note: "Same people. More memories ♡",
      image: "assets/images/2026/April/OB_April_2026.jpg",
      alt: "OomBam during April 2026 activities",
      creditText: "Photo: @jzornphotoholic",
      creditHref: "https://www.instagram.com/jzornphotoholic?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==",
      events: [
        {
          date: "13–17 Apr",
          title: "Character Introduction Week",
          summary: "A focused rollout that introduced the series world and helped establish the pairing ahead of premiere week."
        },
        {
          date: "20 Apr",
          title: "Teaser V5",
          summary: "A late promotional push that sharpened anticipation for OomBam’s on-screen chapter."
        },
        {
          date: "21 Apr",
          title: "CH3 Thailand Official Content",
          summary: "Network-led promotions brought the series into its launch phase and widened attention around the pair."
        },
        {
          date: "24 Apr",
          title: "Fulfill First Premiere & Press Tour",
          summary: "The defining milestone of the month, marking the public start of the Fulfill era."
        },
        {
          date: "26 Apr",
          title: "Post-Premiere Episode 1 Promotions",
          summary: "Early audience engagement carried the momentum forward immediately after the first broadcast week."
        }
      ]
    },
    {
      key: "may",
      eyebrow: "MAY 2026",
      title: "From the Screen to the Fans",
      intro: "May expanded OomBam’s reach through fan-facing appearances and shared public events, led by a major international milestone in Taipei.",
      note: "From the screen to the fans ♡",
      image: "assets/images/2026/May/OB_May_2026.jpg",
      alt: "OomBam during May 2026 activities",
      creditText: "Photo: @jzornphotoholic",
      creditHref: "https://www.instagram.com/jzornphotoholic?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==",
      events: [
        {
          date: "03 May",
          title: "OomBam 1st Fan Meeting in Taipei",
          summary: "A standout month-defining milestone and an early international fan meeting for the pair."
        },
        {
          date: "08 May",
          title: "Fulfill EP03 Promotion",
          summary: "Shared promotional activities kept the series and pairing highly visible during the core broadcast stretch."
        },
        {
          date: "14 May",
          title: "Tres Cherie POEM x CHERRY KHEMUPSORN",
          summary: "A notable joint appearance that extended the month beyond core series promotion."
        },
        {
          date: "19 May",
          title: "Paragon Cineplex Pair Event",
          summary: "Another shared public event that brought OomBam directly to fans in a cinema setting."
        }
      ]
    },
    {
      key: "june",
      eyebrow: "JUNE 2026",
      title: "Closing One Chapter",
      intro: "June carried OomBam through the closing stretch of Fulfill, balancing official content, shared appearances, and the finale that defined the month.",
      note: "One chapter closes. The journey continues ♡",
      image: "assets/images/2026/June/OB_June_2026.jpg",
      alt: "OomBam during June 2026 activities",
      creditText: "Photo: @dewy_photo",
      creditHref: "https://www.instagram.com/dewy_photo?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==",
      events: [
        {
          date: "05 Jun",
          title: "Fulfill Press Tour",
          summary: "Shared promotion continued as the series approached its final chapter."
        },
        {
          date: "09 Jun",
          title: "CH3 Thailand Content",
          summary: "Official content kept OomBam visible during the final weeks of the drama’s run."
        },
        {
          date: "11 Jun",
          title: "Vlog Release",
          summary: "A lighter, more casual release that added a personal layer to the month’s schedule."
        },
        {
          date: "12 Jun",
          title: "Fulfill Final Episode",
          summary: "The emotional center of June and the clearest turning point from series run to post-series momentum."
        },
        {
          date: "16 Jun",
          title: "ARMCHAIR Feature",
          summary: "A post-finale appearance that showed the pairing continuing beyond the screen."
        }
      ]
    },
    {
      key: "july",
      eyebrow: "JULY 2026",
      title: "Blooming With You",
      intro: "July shifted the focus toward fandom and shared memories, with a photobook-centered month that let fans celebrate OomBam in person.",
      note: "Same people. More memories ♡",
      image: "assets/images/2026/July/OB_July_2026.png",
      alt: "OomBam during July 2026 activities",
      creditText: "Photo: @__dans_mes_yeux__",
      creditHref: "",
      events: [
        {
          date: "11 Jul",
          title: "OOMBAM Blooming With You Photobook Fan Sign",
          summary: "The defining July milestone, built around a release fans could finally hold and celebrate together."
        },
        {
          date: "11 Jul",
          title: "Blooming With You Photobook Launch Activities",
          summary: "Companion activities around the photobook helped turn the day into a full fan-centered moment."
        },
        {
          date: "21 Jul",
          title: "Thailand Content Market",
          summary: "An industry-facing appearance that placed OomBam within a broader entertainment spotlight."
        },
        {
          date: "30 Jul",
          title: "Alive Park Hall, Future Park Event",
          summary: "Another shared public appearance that kept the month’s momentum going."
        }
      ]
    },
    {
      key: "august",
      eyebrow: "AUGUST 2026",
      title: "OomBam Goes International",
      intro: "August became a month of wider visibility and shared milestones for OomBam. From the playful energy of Girls Cup, to the international spotlight of Weibo Gala 2026, and their first Shanghai fansign, the month reflected both their growing presence as a pair and their expanding connection with fans beyond Thailand.",
      note: "Different stages. Same OomBam ♡",
      image: "assets/images/2026/August/OB_Aug_2026.jpg",
      alt: "OomBam during August 2026 activities",
      creditText: "Photo: @dewy_photo",
      creditHref: "https://www.instagram.com/dewy_photo?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==",
      events: [
        {
          date: "01 Aug",
          title: "Girls Cup Presented by MAMA",
          summary: "Oom and Bam joined the Girls Cup on opposing teams, bringing playful rivalry and their familiar chemistry into a lively shared event.",
          image: "assets/images/2026/August/GirlsCup/OB_GirlsCup_2026%20%283%29.jpg",
          imageAlt: "Oom and Bam at Girls Cup Presented by MAMA on August 1, 2026",
          imagePosition: "center center",
          creditText: "Photo: @dewy_photo",
          creditHref: "https://www.instagram.com/dewy_photo?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==",
          detail: {
            eyebrow: "01 AUGUST 2026",
            title: "Girls Cup Presented by MAMA",
            narrative: "Girls Cup opened August on a bright, energetic note for OomBam. Taking part on opposite teams — Oom with Team Mint and Bam with Team Peach — they brought playful rivalry and their natural chemistry into a more spontaneous setting. The event gave fans a fun look at their dynamic beyond formal promotional appearances and became a memorable shared moment to start the month.",
            note: "Playful rivals. Same OomBam ♡",
            galleries: {
              pair: [
                "assets/images/2026/August/GirlsCup/OB_GirlsCup_2026%20%283%29.jpg",
                "assets/images/2026/August/GirlsCup/OB_GirlsCup_2026%20%281%29.jpg",
                "assets/images/2026/August/GirlsCup/OB_GirlsCup_2026%20%282%29.jpg",
                "assets/images/2026/August/GirlsCup/OB_GirlsCup_2026%20%284%29.jpg",
                "assets/images/2026/August/GirlsCup/OB_GirlsCup_2026%20%288%29.jpg"
              ],
              oom: [
                "assets/images/2026/August/GirlsCup/GirlsCup_Oom_Solo%20%281%29.jpg",
                "assets/images/2026/August/GirlsCup/GirlsCup_Oom_Solo%20%282%29.jpg",
                "assets/images/2026/August/GirlsCup/GirlsCup_Oom_Solo%20%283%29.jpg",
                "assets/images/2026/August/GirlsCup/GirlsCup_Oom_Solo%20%284%29.jpg",
                "assets/images/2026/August/GirlsCup/GirlsCup_Oom_Solo%20%285%29.jpg"
              ],
              bam: [
                "assets/images/2026/August/GirlsCup/Girlscup_Bam_Solo%20%281%29.jpg",
                "assets/images/2026/August/GirlsCup/Girlscup_Bam_Solo%20%282%29.jpg",
                "assets/images/2026/August/GirlsCup/Girlscup_Bam_Solo%20%283%29.jpg"
              ]
            }
          }
        },
        {
          date: "08 Aug",
          title: "Weibo Gala 2026 • Cultural Communication Night",
          summary: "The defining August highlight and a major international visibility milestone."
        },
        {
          date: "15 Aug",
          title: "1st Fansign in Shanghai",
          summary: "An important fan-facing overseas event that deepened their connection with international supporters."
        }
      ]
    }
  ];

  const monthMap = new Map(MOMENTS_MONTHS.map((month, index) => [month.key, { ...month, index }]));

  const modal = document.getElementById("momentsModal");
  const modalEyebrow = document.getElementById("momentsModalEyebrow");
  const modalTitle = document.getElementById("momentsModalTitle");
  const modalIntro = document.getElementById("momentsModalIntro");
  const modalImage = document.getElementById("momentsModalImage");
  const modalCredit = document.getElementById("momentsModalCredit");
  const modalNote = document.getElementById("momentsModalNote");
  const modalEvents = document.getElementById("momentsModalEvents");
  const eventBackButton = document.getElementById("momentsEventBack");
  const eventGallery = document.getElementById("momentsEventGallery");
  const galleryPrevButton = document.getElementById("momentsGalleryPrev");
  const galleryNextButton = document.getElementById("momentsGalleryNext");
  const galleryCounter = document.getElementById("momentsGalleryCounter");
  const galleryCredit = document.getElementById("momentsGalleryCredit");
  const galleryMeta = document.getElementById("momentsGalleryMeta");
  const eventsHeading = document.querySelector(".moments-modal__events-heading");
  const modalFooter = document.querySelector(".moments-modal__footer--editorial");
  const openers = [...document.querySelectorAll("[data-moment-open]")];
  const closers = [...document.querySelectorAll("[data-moments-close]")];
  const prevButton = document.querySelector("[data-moments-prev]");
  const nextButton = document.querySelector("[data-moments-next]");

  if (!modal || !openers.length) return;

  let activeMonthKey = MOMENTS_MONTHS[0].key;
  let lastFocusedEl = null;
  let lockedScrollY = 0;
  let scrollLocked = false;

  const lockScroll = () => {
    if (scrollLocked) return;
    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    body.style.position = "fixed";
    body.style.top = `-${lockedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    body.classList.add("moments-open");
    scrollLocked = true;
  };

  const unlockScroll = () => {
    if (!scrollLocked) return;
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    body.style.overflow = "";
    body.classList.remove("moments-open");
    scrollLocked = false;
    window.scrollTo(0, lockedScrollY);
  };

  const buildCreditNode = (month) => {
    if (!modalCredit) return;
    modalCredit.replaceChildren();
    if (month.creditHref) {
      const link = document.createElement("a");
      link.href = month.creditHref;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = month.creditText;
      modalCredit.append(link);
    } else {
      modalCredit.textContent = month.creditText;
    }
  };

  const buildEvents = (month) => {
    if (!modalEvents) return;
    modalEvents.replaceChildren();
    month.events.forEach((event) => {
      const item = event.detail ? document.createElement("button") : document.createElement("span");
      item.className = `moments-modal__moment-link${event.detail ? " is-clickable" : " is-static"}`;
      item.textContent = `${event.date} · ${event.title}`;

      if (event.detail) {
        item.type = "button";
        item.setAttribute("aria-label", `Open ${event.title} photo story`);
        item.addEventListener("click", () => renderEventDetail(month, event));
      }

      modalEvents.append(item);
    });
  };

  let activeGalleryPhotos = [];
  let activeGalleryIndex = 0;
  let activeGalleryEvent = null;

  const getEventGalleryPhotos = (event) => {
    const galleries = event.detail?.galleries || {};
    return ["pair", "oom", "bam"].flatMap((key) => galleries[key] || []);
  };

  const renderGalleryPhoto = (index) => {
    if (!activeGalleryPhotos.length || !activeGalleryEvent || !modalImage) return;
    activeGalleryIndex = (index + activeGalleryPhotos.length) % activeGalleryPhotos.length;
    const src = activeGalleryPhotos[activeGalleryIndex];
    modalImage.src = src;
    modalImage.alt = `${activeGalleryEvent.title} — photo ${activeGalleryIndex + 1} of ${activeGalleryPhotos.length}`;
    modalImage.style.objectPosition = "center center";
    if (galleryCounter) {
      const current = String(activeGalleryIndex + 1).padStart(2, "0");
      const total = String(activeGalleryPhotos.length).padStart(2, "0");
      galleryCounter.textContent = `${current} / ${total}`;
    }
    if (galleryCredit) {
      galleryCredit.textContent = (activeGalleryEvent.creditText || "Photo: @dewy_photo").replace("Photo:", "Photo ·");
      galleryCredit.href = activeGalleryEvent.creditHref || "#";
    }
  };

  const renderEventDetail = (month, event) => {
    if (!event.detail) return;
    const panel = modal.querySelector(".moments-modal__panel");
    panel?.classList.add("is-event-detail");

    if (modalEyebrow) modalEyebrow.textContent = event.detail.eyebrow || event.date;
    if (modalTitle) modalTitle.textContent = event.detail.title || event.title;
    if (modalIntro) modalIntro.textContent = event.detail.narrative || event.summary;
    if (modalNote) modalNote.textContent = "";

    if (modalCredit) {
      modalCredit.replaceChildren();
      modalCredit.hidden = true;
    }

    activeGalleryEvent = event;
    activeGalleryPhotos = getEventGalleryPhotos(event);
    const preferred = event.image;
    activeGalleryIndex = Math.max(0, activeGalleryPhotos.indexOf(preferred));
    if (!activeGalleryPhotos.length && preferred) activeGalleryPhotos = [preferred];
    renderGalleryPhoto(activeGalleryIndex);

    if (eventBackButton) {
      eventBackButton.hidden = false;
      eventBackButton.textContent = `← Back to ${month.eyebrow.split(" ")[0]}`;
      eventBackButton.onclick = () => renderMonth(month.key);
    }
    if (eventGallery) eventGallery.hidden = false;
    if (galleryMeta) galleryMeta.hidden = false;
    if (eventsHeading) eventsHeading.hidden = true;
    if (modalEvents) modalEvents.hidden = true;
    if (modalFooter) modalFooter.hidden = true;

    if (galleryPrevButton) galleryPrevButton.onclick = () => renderGalleryPhoto(activeGalleryIndex - 1);
    if (galleryNextButton) galleryNextButton.onclick = () => renderGalleryPhoto(activeGalleryIndex + 1);

    const copyPanel = modal.querySelector(".moments-modal__masthead-copy");
    if (copyPanel) copyPanel.scrollTop = 0;
    if (panel) panel.scrollTo({ top: 0, behavior: "auto" });
  };

  const updateNavButtons = (month) => {
    if (!prevButton || !nextButton) return;
    const prevMonth = MOMENTS_MONTHS[month.index - 1];
    const nextMonth = MOMENTS_MONTHS[month.index + 1];

    prevButton.disabled = !prevMonth;
    nextButton.disabled = !nextMonth;
    prevButton.dataset.targetMonth = prevMonth?.key || "";
    nextButton.dataset.targetMonth = nextMonth?.key || "";
    prevButton.textContent = prevMonth ? `← ${prevMonth.eyebrow}` : "← Previous Month";
    nextButton.textContent = nextMonth ? `${nextMonth.eyebrow} →` : "Next Month →";
  };

  const renderMonth = (monthKey) => {
    const month = monthMap.get(monthKey) || MOMENTS_MONTHS[0];
    activeMonthKey = month.key;

    modal.querySelector(".moments-modal__panel")?.classList.remove("is-event-detail");
    activeGalleryPhotos = [];
    activeGalleryIndex = 0;
    activeGalleryEvent = null;
    if (eventBackButton) eventBackButton.hidden = true;
    if (eventGallery) eventGallery.hidden = true;
    if (galleryMeta) galleryMeta.hidden = true;
    if (eventsHeading) eventsHeading.hidden = false;
    if (modalEvents) modalEvents.hidden = false;
    if (modalFooter) modalFooter.hidden = false;

    if (modalEyebrow) modalEyebrow.textContent = month.eyebrow;
    if (modalTitle) modalTitle.textContent = month.title;
    if (modalIntro) modalIntro.textContent = month.intro;
    if (modalImage) {
      modalImage.src = month.image;
      modalImage.alt = month.alt;
      modalImage.style.objectPosition = "center center";
    }
    if (modalNote) modalNote.textContent = "";
    if (modalCredit) {
      modalCredit.hidden = true;
      modalCredit.replaceChildren();
    }
    buildEvents(month);
    updateNavButtons(month);
  };

  const openModal = (monthKey) => {
    lastFocusedEl = document.activeElement;
    renderMonth(monthKey);
    lockScroll();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => modal.querySelector(".moments-modal__close")?.focus({ preventScroll: true }));
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    unlockScroll();
    lastFocusedEl?.focus?.({ preventScroll: true });
  };

  openers.forEach((opener) => {
    opener.addEventListener("click", () => {
      const key = opener.getAttribute("data-moment-open") || MOMENTS_MONTHS[0].key;
      openModal(key);
    });
  });

  closers.forEach((closer) => closer.addEventListener("click", closeModal));

  prevButton?.addEventListener("click", () => {
    const key = prevButton.dataset.targetMonth;
    if (key) renderMonth(key);
  });

  nextButton?.addEventListener("click", () => {
    const key = nextButton.dataset.targetMonth;
    if (key) renderMonth(key);
  });

  document.addEventListener("keydown", (event) => {
    if (!modal.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key === "ArrowLeft" && prevButton?.dataset.targetMonth) {
      event.preventDefault();
      renderMonth(prevButton.dataset.targetMonth);
    }
    if (event.key === "ArrowRight" && nextButton?.dataset.targetMonth) {
      event.preventDefault();
      renderMonth(nextButton.dataset.targetMonth);
    }
  });
})();
