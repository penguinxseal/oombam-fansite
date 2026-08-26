document.addEventListener("DOMContentLoaded", () => {

  const scenes =
    document.querySelectorAll(".scene");

  const encounter =
    document.querySelector(".scene-encounter");



  /* =====================================================
     SCENE REVEAL
     ===================================================== */

  const sceneObserver =
    new IntersectionObserver(

      (entries) => {

        entries.forEach((entry) => {

          if (!entry.isIntersecting) {
            return;
          }


          entry.target.classList.add(
            "is-visible"
          );


          const sceneName =
            entry.target.dataset.scene;


          if (sceneName) {

            document.body.dataset.activeScene =
              sceneName;

          }

        });

      },

      {
        threshold: 0.42
      }

    );


  scenes.forEach((scene) => {
    sceneObserver.observe(scene);
  });



  /* =====================================================
     SCROLL PROGRESS
     PENGUIN + SEAL APPROACH EACH OTHER
     ===================================================== */

  function updateEncounter() {

    if (!encounter) {
      return;
    }


    const rect =
      encounter.getBoundingClientRect();


    const viewportHeight =
      window.innerHeight;


    const start =
      viewportHeight;


    const end =
      -rect.height * 0.15;


    const progress =
      Math.min(
        1,
        Math.max(
          0,
          (start - rect.top) /
          (start - end)
        )
      );


    /*
      They move toward the center as
      the visitor scrolls through Scene 02.
    */

    const movement =
      progress * 58;


    encounter.style.setProperty(
      "--penguin-shift",
      `${movement}px`
    );


    encounter.style.setProperty(
      "--seal-shift",
      `${-movement}px`
    );

  }



  /* =====================================================
     AMBIENT CURSOR MOVEMENT
     DESKTOP ONLY
     ===================================================== */

  const ambientBlue =
    document.querySelector(".ambient-blue");

  const ambientPink =
    document.querySelector(".ambient-pink");


  const canHover =
    window.matchMedia(
      "(hover: hover)"
    ).matches;


  const reducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  if (
    canHover &&
    !reducedMotion
  ) {

    window.addEventListener(
      "mousemove",
      (event) => {

        const x =
          event.clientX /
          window.innerWidth -
          0.5;


        const y =
          event.clientY /
          window.innerHeight -
          0.5;


        if (ambientBlue) {

          ambientBlue.style.marginLeft =
            `${x * 16}px`;

          ambientBlue.style.marginTop =
            `${y * 12}px`;

        }


        if (ambientPink) {

          ambientPink.style.marginRight =
            `${x * -16}px`;

          ambientPink.style.marginBottom =
            `${y * -12}px`;

        }

      }
    );

  }



  /* =====================================================
     REQUEST ANIMATION FRAME
     ===================================================== */

  let ticking = false;


  function onScroll() {

    if (!ticking) {

      window.requestAnimationFrame(() => {

        updateEncounter();

        ticking = false;

      });


      ticking = true;

    }

  }


  window.addEventListener(
    "scroll",
    onScroll,
    {
      passive: true
    }
  );


  window.addEventListener(
    "resize",
    updateEncounter
  );


  updateEncounter();



  /* =====================================================
     INITIAL SCENE
     ===================================================== */

  document.body.dataset.activeScene =
    "intro";

});
