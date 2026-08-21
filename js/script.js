"use strict";

/* =========================================================
   GLOBAL ELEMENTS
========================================================= */

const body = document.body;

const siteHeader =
  document.getElementById("siteHeader");

const menuToggle =
  document.getElementById("menuToggle");

const mobileMenu =
  document.getElementById("mobileMenu");

const themeToggle =
  document.getElementById("themeToggle");


/* =========================================================
   STICKY HEADER
========================================================= */

function updateHeader() {

  if (!siteHeader) {
    return;
  }

  siteHeader.classList.toggle(
    "is-scrolled",
    window.scrollY > 40
  );
}


window.addEventListener(
  "scroll",
  updateHeader,
  { passive: true }
);


updateHeader();


/* =========================================================
   MOBILE MENU
========================================================= */

function openMenu() {

  if (!mobileMenu || !menuToggle) {
    return;
  }

  mobileMenu.classList.add("is-open");
  menuToggle.classList.add("is-active");

  mobileMenu.setAttribute(
    "aria-hidden",
    "false"
  );

  menuToggle.setAttribute(
    "aria-expanded",
    "true"
  );

  menuToggle.setAttribute(
    "aria-label",
    "Close navigation menu"
  );

  body.classList.add("menu-open");
}


function closeMenu() {

  if (!mobileMenu || !menuToggle) {
    return;
  }

  mobileMenu.classList.remove("is-open");
  menuToggle.classList.remove("is-active");

  mobileMenu.setAttribute(
    "aria-hidden",
    "true"
  );

  menuToggle.setAttribute(
    "aria-expanded",
    "false"
  );

  menuToggle.setAttribute(
    "aria-label",
    "Open navigation menu"
  );

  body.classList.remove("menu-open");
}


function toggleMenu() {

  if (!mobileMenu) {
    return;
  }

  if (
    mobileMenu.classList.contains(
      "is-open"
    )
  ) {

    closeMenu();

  } else {

    openMenu();

  }
}


if (menuToggle) {

  menuToggle.addEventListener(
    "click",
    toggleMenu
  );
}


/* =========================================================
   CLOSE MOBILE MENU
========================================================= */

if (mobileMenu) {

  mobileMenu.addEventListener(
    "click",
    (event) => {

      if (event.target === mobileMenu) {
        closeMenu();
      }

    }
  );


  mobileMenu
    .querySelectorAll("a")
    .forEach((link) => {

      link.addEventListener(
        "click",
        closeMenu
      );

    });
}


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Escape") {
      closeMenu();
    }

  }
);


/* =========================================================
   SMOOTH SCROLL
========================================================= */

document
  .querySelectorAll('a[href^="#"]')
  .forEach((link) => {

    link.addEventListener(
      "click",
      (event) => {

        const targetId =
          link.getAttribute("href");

        if (
          !targetId ||
          targetId === "#"
        ) {
          return;
        }

        const target =
          document.querySelector(
            targetId
          );

        if (!target) {
          return;
        }

        event.preventDefault();


        const headerHeight =
          siteHeader
            ? siteHeader.offsetHeight
            : 0;


        const destination =
          target
            .getBoundingClientRect()
            .top
          +
          window.scrollY
          -
          headerHeight;


        window.scrollTo({
          top: destination,
          behavior: "smooth"
        });


        closeMenu();

      }
    );

  });


/* =========================================================
   DARK MODE
========================================================= */

const themeStorageKey =
  "oombam-theme";


function updateThemeButton() {

  if (!themeToggle) {
    return;
  }

  const darkMode =
    body.classList.contains(
      "dark-theme"
    );

  themeToggle.setAttribute(
    "aria-label",
    darkMode
      ? "Switch to light theme"
      : "Switch to dark theme"
  );
}


function loadTheme() {

  try {

    const savedTheme =
      localStorage.getItem(
        themeStorageKey
      );

    if (savedTheme === "dark") {

      body.classList.add(
        "dark-theme"
      );

    } else if (
      savedTheme === "light"
    ) {

      body.classList.remove(
        "dark-theme"
      );

    }

  } catch (error) {

    console.warn(
      "Unable to load theme preference.",
      error
    );

  }

  updateThemeButton();
}


function toggleTheme() {

  body.classList.toggle(
    "dark-theme"
  );

  const darkMode =
    body.classList.contains(
      "dark-theme"
    );

  try {

    localStorage.setItem(
      themeStorageKey,
      darkMode
        ? "dark"
        : "light"
    );

  } catch (error) {

    console.warn(
      "Unable to save theme preference.",
      error
    );

  }

  updateThemeButton();
}


if (themeToggle) {

  themeToggle.addEventListener(
    "click",
    toggleTheme
  );
}


loadTheme();


/* =========================================================
   RESPONSIVE MENU RESET
========================================================= */

window.addEventListener(
  "resize",
  () => {

    if (window.innerWidth > 1100) {
      closeMenu();
    }

  }
);


/* =========================================================
   OOMBAM — SHANGHAI PRIVATE EVENT
   LIVE COUNTDOWN
========================================================= */

const SHANGHAI_EVENT_TARGET =
  "2026-08-15T00:00:00+08:00";

const eventCountdown =
  document.getElementById("eventCountdown");

const countdownDays =
  document.getElementById("countdownDays");

const countdownHours =
  document.getElementById("countdownHours");

const countdownMinutes =
  document.getElementById("countdownMinutes");

const countdownSeconds =
  document.getElementById("countdownSeconds");

const countdownStatus =
  document.getElementById("countdownStatus");

let countdownTimer = null;

function formatCountdownNumber(value) {
  return String(value).padStart(2, "0");
}

function displayCountdown(
  days,
  hours,
  minutes,
  seconds
) {

  if (countdownDays) {
    countdownDays.textContent =
      formatCountdownNumber(days);
  }

  if (countdownHours) {
    countdownHours.textContent =
      formatCountdownNumber(hours);
  }

  if (countdownMinutes) {
    countdownMinutes.textContent =
      formatCountdownNumber(minutes);
  }

  if (countdownSeconds) {
    countdownSeconds.textContent =
      formatCountdownNumber(seconds);
  }

}

function updateEventCountdown() {

  if (
    !eventCountdown ||
    !countdownDays ||
    !countdownHours ||
    !countdownMinutes ||
    !countdownSeconds
  ) {
    return;
  }

  const targetTime =
    new Date(
      SHANGHAI_EVENT_TARGET
    ).getTime();

  const currentTime =
    Date.now();

  const remaining =
    targetTime - currentTime;

  if (remaining <= 0) {

    displayCountdown(
      0,
      0,
      0,
      0
    );

    if (countdownStatus) {
      countdownStatus.textContent =
        "OOMBAM • Shanghai Private Event";
    }

    clearInterval(countdownTimer);

    return;
  }

  const SECOND = 1000;
  const MINUTE = SECOND * 60;
  const HOUR = MINUTE * 60;
  const DAY = HOUR * 24;

  const days =
    Math.floor(remaining / DAY);

  const hours =
    Math.floor(
      (remaining % DAY) / HOUR
    );

  const minutes =
    Math.floor(
      (remaining % HOUR) / MINUTE
    );

  const seconds =
    Math.floor(
      (remaining % MINUTE) / SECOND
    );

  displayCountdown(
    days,
    hours,
    minutes,
    seconds
  );

  if (countdownStatus) {
    countdownStatus.textContent =
      "Shanghai Private Event • August 15, 2026 • Shanghai, China";
  }

}

if (eventCountdown) {

  updateEventCountdown();

  countdownTimer =
    window.setInterval(
      updateEventCountdown,
      1000
    );

}



/* =========================================================
   SITE SEARCH
========================================================= */

const searchToggle =
  document.getElementById("searchToggle");

const siteSearch =
  document.getElementById("siteSearch");

const searchClose =
  document.getElementById("searchClose");

const siteSearchInput =
  document.getElementById("siteSearchInput");

const siteSearchResults =
  document.getElementById("siteSearchResults");


const searchablePages = [
  {
    category: "Welcome",
    title: "Welcome to OomBam",
    keywords: "home welcome landing oom bam fansite",
    href: "#home"
  },
  {
    category: "Our Story",
    title: "Our Journey, Our Memories",
    keywords: "story journey memories oom bam",
    href: "#about"
  },
  {
    category: "Profile",
    title: "Oom Eisaya",
    keywords: "oom eisaya profile",
    href: "oom.html"
  },
  {
    category: "Profile",
    title: "Bam Saralee",
    keywords: "bam saralee profile",
    href: "bam.html"
  },
  {
    category: "Moments",
    title: "Beautiful Moments We Cherish",
    keywords: "moments memories behind little things sunset",
    href: "#moments"
  },
  {
    category: "Media",
    title: "Fulfill — The Series",
    keywords: "fulfill series behind scenes special content teasers",
    href: "just-the-two-of-us.html"
  },
  {
    category: "Media",
    title: "OomBam Videos & Interviews",
    keywords: "interviews official clips appearances videos youtube",
    href: "#media"
  },
  {
    category: "Media",
    title: "Our Soundtrack",
    keywords: "music soundtrack fulfill ost listen",
    href: "#media"
  },
  {
    category: "Community",
    title: "Blossoms",
    keywords: "community blossoms letters fans projects garden",
    href: "community.html"
  },
  {
    category: "Updates",
    title: "What's Next & Latest Updates",
    keywords: "updates news event schedule latest shanghai",
    href: "#updates"
  }
];


function renderSearchResults(query = "") {

  if (!siteSearchResults) {
    return;
  }

  const normalized =
    query.trim().toLowerCase();

  const matches =
    searchablePages.filter((item) => {

      if (!normalized) {
        return true;
      }

      return (
        item.title.toLowerCase().includes(normalized) ||
        item.category.toLowerCase().includes(normalized) ||
        item.keywords.toLowerCase().includes(normalized)
      );
    });


  if (!matches.length) {

    siteSearchResults.innerHTML =
      '<p class="site-search-empty">No matching pages or sections found.</p>';

    return;
  }


  siteSearchResults.innerHTML =
    matches
      .map((item) => `
        <a class="site-search-result" href="${item.href}">
          <div>
            <span>${item.category}</span>
            <strong>${item.title}</strong>
          </div>
          <em>→</em>
        </a>
      `)
      .join("");
}


function openSearch() {

  if (!siteSearch) {
    return;
  }

  siteSearch.classList.add("is-open");
  siteSearch.setAttribute("aria-hidden", "false");

  if (searchToggle) {
    searchToggle.setAttribute("aria-expanded", "true");
  }

  body.classList.add("search-open");

  renderSearchResults("");

  window.setTimeout(() => {
    siteSearchInput?.focus();
  }, 80);
}


function closeSearch() {

  if (!siteSearch) {
    return;
  }

  siteSearch.classList.remove("is-open");
  siteSearch.setAttribute("aria-hidden", "true");

  if (searchToggle) {
    searchToggle.setAttribute("aria-expanded", "false");
  }

  body.classList.remove("search-open");

  if (siteSearchInput) {
    siteSearchInput.value = "";
  }
}


searchToggle?.addEventListener(
  "click",
  openSearch
);


searchClose?.addEventListener(
  "click",
  closeSearch
);


siteSearch
  ?.querySelector("[data-search-close]")
  ?.addEventListener(
    "click",
    closeSearch
  );


siteSearchInput?.addEventListener(
  "input",
  (event) => {
    renderSearchResults(event.target.value);
  }
);


siteSearchResults?.addEventListener(
  "click",
  (event) => {

    const link =
      event.target.closest("a");

    if (link) {
      closeSearch();
    }
  }
);


document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape" &&
      siteSearch?.classList.contains("is-open")
    ) {
      closeSearch();
    }
  }
);



/* =========================================================
   OUR SOUNDTRACK — YOUTUBE MINI PLAYER
   Robust loader for the Media soundtrack card
========================================================= */

const OOMBAM_SOUNDTRACK = [
  "RHnPq3Z0A8c",
  "CKclkO6HHrY"
];

let oombamYouTubePlayer = null;
let oombamYouTubePlayerStarted = false;


function initOomBamYouTubePlayer() {

  const playerTarget =
    document.getElementById(
      "oombamYouTubePlayer"
    );

  if (
    !playerTarget ||
    oombamYouTubePlayerStarted ||
    !window.YT ||
    !window.YT.Player
  ) {
    return;
  }

  oombamYouTubePlayerStarted = true;

  oombamYouTubePlayer =
    new window.YT.Player(
      "oombamYouTubePlayer",
      {
        width: "100%",
        height: "100%",

        videoId:
          OOMBAM_SOUNDTRACK[0],

        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
          origin:
            window.location.origin
        },

        events: {

          onReady: (event) => {

            event.target.cuePlaylist({
              playlist:
                OOMBAM_SOUNDTRACK,
              index: 0
            });

            event.target.setLoop(true);
          },


          onStateChange: (event) => {

            if (
              event.data ===
                window.YT.PlayerState.ENDED
            ) {

              /*
                Keep the two-track playlist
                moving continuously.
              */

              event.target.nextVideo();
            }
          }

        }
      }
    );
}


/*
  The YouTube iframe API calls this
  global callback after it is ready.
*/

window.onYouTubeIframeAPIReady =
  function () {
    initOomBamYouTubePlayer();
  };


function loadOomBamYouTubeAPI() {

  const playerTarget =
    document.getElementById(
      "oombamYouTubePlayer"
    );

  if (!playerTarget) {
    return;
  }


  /*
    API may already be available from
    a browser cache or another embed.
  */

  if (
    window.YT &&
    window.YT.Player
  ) {

    initOomBamYouTubePlayer();

    return;
  }


  /*
    Prevent duplicate API scripts.
  */

  if (
    document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    )
  ) {
    return;
  }


  const youtubeApiScript =
    document.createElement("script");

  youtubeApiScript.src =
    "https://www.youtube.com/iframe_api";

  youtubeApiScript.async = true;

  document.head.appendChild(
    youtubeApiScript
  );
}


loadOomBamYouTubeAPI();

