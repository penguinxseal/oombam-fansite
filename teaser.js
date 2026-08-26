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


    /*
      Very subtle depth movement after
      the characters have settled.
    */

    window.addEventListener(
      "mousemove",
      (event) => {

        const x =
          (
            event.clientX /
            window.innerWidth -
            0.5
          ) * 5;


        const y =
          (
            event.clientY /
            window.innerHeight -
            0.5
          ) * 4;


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
