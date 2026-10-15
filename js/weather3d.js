
document.addEventListener("DOMContentLoaded", () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (document.querySelector(".weather-decoration")) return;

  const decoration = document.createElement("div");
  decoration.className = "weather-decoration";
  decoration.setAttribute("aria-hidden", "true");

  Object.assign(decoration.style, {
    position: "fixed",
    top: "90px",
    right: "-55px",
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,211,117,.13), rgba(255,211,117,0) 70%)",
    pointerEvents: "none",
    zIndex: "-1"
  });

  document.body.appendChild(decoration);
});
