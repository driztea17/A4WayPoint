// Home page: entrance reveals and the journey line that fills as you scroll.

import { motionReady, revealOnScroll } from "./motion.js";

function initJourney() {
  const journey = document.querySelector("[data-journey]");
  if (!journey || !motionReady() || !window.ScrollTrigger) return;

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  const fill = journey.querySelector(".journey-fill");
  const points = Array.from(journey.querySelectorAll(".waypoint"));
  const wide = window.matchMedia("(min-width: 1100px)");
  const last = points.length - 1;

  journey.classList.add("is-animated");

  const render = (progress) => {
    const axis = wide.matches ? "scaleX" : "scaleY";
    fill.style.transform = `${axis}(${progress})`;
    points.forEach((point, index) => {
      point.classList.toggle("is-reached", progress >= index / last - 0.001);
    });
  };

  const state = { progress: 0 };
  render(0);

  gsap.to(state, {
    progress: 1,
    duration: 1.8,
    ease: "power2.inOut",
    onUpdate: () => render(state.progress),
    scrollTrigger: { trigger: journey, start: "top 70%", once: true }
  });

  wide.addEventListener("change", () => render(state.progress));
}

// A missing team photo falls back to the initials behind it.
function initTeamPhotos() {
  document.querySelectorAll("[data-team-photo]").forEach((img) => {
    const fail = () => img.remove();
    if (img.complete && img.naturalWidth === 0) fail();
    else img.addEventListener("error", fail, { once: true });
  });
}

initTeamPhotos();
revealOnScroll();
initJourney();
