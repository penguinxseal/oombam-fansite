document.addEventListener(
  "DOMContentLoaded",
  () => {

    const teaser =
      document.querySelector(".teaser");


    if (!teaser) {
      return;
    }


    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;


    const canHover =
      window.matchMedia(
        "(hover: hover)"
      ).matches;


    if (
      reducedMotion ||
      !canHover
    ) {
      return;
    }



    /* =====================================================
       VERY SUBTLE DESKTOP PARALLAX
       ===================================================== */

    window.addEventListener(
      "mousemove",
      (event) => {

        const normalizedX =
          event.clientX /
          window.innerWidth -
          0.5;


        const normalizedY =
          event.clientY /
          window.innerHeight -
          0.5;


        const x =
          normalizedX * 8;


        const y =
          normalizedY * 6;


        teaser.style.setProperty(
          "--mouse-x",
          `${x}px`
        );


        teaser.style.setProperty(
          "--mouse-y",
          `${y}px`
        );

      }
    );



    document.addEventListener(
      "mouseleave",
      () => {

        teaser.style.setProperty(
          "--mouse-x",
          "0px"
        );


        teaser.style.setProperty(
          "--mouse-y",
          "0px"
        );

      }
    );

  }
);

