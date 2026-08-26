document.addEventListener("DOMContentLoaded", () => {
  const teaser = document.querySelector(".teaser");

  if (!teaser) return;

  window.addEventListener("mousemove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 12;
    const y = (event.clientY / window.innerHeight - 0.5) * 12;

    teaser.style.setProperty("--move-x", `${x}px`);
    teaser.style.setProperty("--move-y", `${y}px`);
  });
});
