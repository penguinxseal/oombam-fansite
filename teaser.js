document.addEventListener("DOMContentLoaded", () => {

  const teaser = document.querySelector(".teaser");

  if (!teaser) return;


  const reducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  if (reducedMotion) return;


  /* =====================================================
     VERY SUBTLE CURSOR PARALLAX
     ===================================================== */

  window.addEventListener("mousemove", (event) => {

    const x =
      (event.clientX / window.innerWidth - 0.5) * 10;

    const y =
      (event.clientY / window.innerHeight - 0.5) * 10;


    teaser.style.setProperty(
      "--mouse-x",
      `${x}px`
    );

    teaser.style.setProperty(
      "--mouse-y",
      `${y}px`
    );

  });


  /* Return to neutral when cursor leaves */

  document.addEventListener("mouseleave", () => {

    teaser.style.setProperty(
      "--mouse-x",
      "0px"
    );

    teaser.style.setProperty(
      "--mouse-y",
      "0px"
    );

  });

});
