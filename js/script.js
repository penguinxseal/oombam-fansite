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
   OOMBAM — Saturday, August 15, 2026
  Main Event: 1:00 PM Beijing Time
  China = UTC+8
========================================================= */

/*
  Saturday, August 8, 2026
  Main Show: 6:00 PM Thailand Time
  Thailand = UTC+7
*/

const WEIBO_GALA_TARGET =
  "2026-08-15T13:00:00+08:00";


const eventCountdown =
  document.getElementById(
    "eventCountdown"
  );

const countdownDays =
  document.getElementById(
    "countdownDays"
  );

const countdownHours =
  document.getElementById(
    "countdownHours"
  );

const countdownMinutes =
  document.getElementById(
    "countdownMinutes"
  );

const countdownSeconds =
  document.getElementById(
    "countdownSeconds"
  );

const countdownStatus =
  document.getElementById(
    "countdownStatus"
  );


let countdownTimer = null;


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatCountdownNumber(
  value
) {

  return String(value).padStart(
    2,
    "0"
  );
}


/* =========================================================
   DISPLAY COUNTDOWN
========================================================= */

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


/* =========================================================
   UPDATE COUNTDOWN
========================================================= */

function updateEventCountdown() {

  if (
    !eventCountdown ||
    !countdownDays ||
    !countdownHours ||
    !countdownMinutes ||
    !countdownSeconds
  ) {

    console.warn(
      "Countdown elements were not found."
    );

    return;
  }


  /*
    Keep HTML synchronized with
    the correct event time.
  */

  eventCountdown.setAttribute(
    "data-event-date",
    WEIBO_GALA_TARGET
  );


  const targetTime =
    new Date(
      WEIBO_GALA_TARGET
    ).getTime();


  const currentTime =
    Date.now();


  if (Number.isNaN(targetTime)) {

    console.error(
      "Invalid Weibo Gala event date."
    );

    return;
  }


  const remaining =
    targetTime - currentTime;


  /* EVENT HAS STARTED */

  if (remaining <= 0) {

    displayCountdown(
      0,
      0,
      0,
      0
    );


    if (countdownStatus) {

      countdownStatus.textContent =
        "OOMBAM • Shanghai Private Event ✨";

    }


    if (countdownTimer) {

      window.clearInterval(
        countdownTimer
      );

      countdownTimer = null;

    }

    return;
  }


  const SECOND =
    1000;

  const MINUTE =
    SECOND * 60;

  const HOUR =
    MINUTE * 60;

  const DAY =
    HOUR * 24;


  const days =
    Math.floor(
      remaining / DAY
    );


  const hours =
    Math.floor(
      (remaining % DAY) /
      HOUR
    );


  const minutes =
    Math.floor(
      (remaining % HOUR) /
      MINUTE
    );


  const seconds =
    Math.floor(
      (remaining % MINUTE) /
      SECOND
    );


  displayCountdown(
    days,
    hours,
    minutes,
    seconds
  );


  if (countdownStatus) {

    countdownStatus.textContent =
      "Shanghai Private Event • August 15, 2026 • 1:00 PM Beijing Time";

  }

}


/* =========================================================
   START COUNTDOWN
========================================================= */

if (eventCountdown) {

  /*
    Run immediately so the
    -- placeholders disappear.
  */

  updateEventCountdown();


  /*
    Update once every second.
  */

  countdownTimer =
    window.setInterval(
      updateEventCountdown,
      1000
    );

} 
