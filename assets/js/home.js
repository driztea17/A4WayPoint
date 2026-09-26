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

// A small astronaut in a UFO flies in right after load, from a random side,
// and invites members to try Shuffle. Hidden again for the visit once closed.
const UFO_KEY = "a4wp:ufo:hidden";

function initUfo() {
  try {
    if (sessionStorage.getItem(UFO_KEY)) return;
  } catch {
    /* storage blocked: still show it */
  }

  const side = Math.random() < 0.5 ? "left" : "right";
  const delay = 100;

  const wrap = document.createElement("div");
  wrap.className = `ufo is-${side}`;
  wrap.innerHTML = `
    <a class="ufo-link" href="shuffle.html" aria-label="Try something new: open Shuffle">
      <span class="ufo-bubble" aria-hidden="true">Try something new!</span>
      <img class="ufo-art" src="assets/img/ufo-astronaut.svg" alt="" width="200" height="180">
    </a>
    <button type="button" class="ufo-close" aria-label="Hide the astronaut">
      <svg class="icon" aria-hidden="true" focusable="false"><use href="assets/img/icons.svg#i-x"></use></svg>
    </button>`;

  const hide = (remember) => {
    wrap.classList.remove("is-in");
    wrap.classList.add("is-out");
    setTimeout(() => wrap.remove(), 700);
    if (remember) {
      try {
        sessionStorage.setItem(UFO_KEY, "1");
      } catch {
        /* nothing to remember */
      }
    }
  };

  wrap.querySelector(".ufo-close").addEventListener("click", () => hide(true));
  wrap.querySelector(".ufo-link").addEventListener("click", () => {
    try {
      sessionStorage.setItem(UFO_KEY, "1");
    } catch {
      /* fine */
    }
  });

  setTimeout(() => {
    document.body.append(wrap);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add("is-in")));
    // It flies off on its own after a while, and may come back on the next visit.
    setTimeout(() => wrap.isConnected && hide(false), 30000);
  }, delay);
}

// Optional photo sky: shown only when assets/img/hero-sky.jpg exists.
function initSkyPhoto() {
  const img = document.querySelector("[data-sky-photo]");
  if (!img) return;
  const show = () => {
    img.hidden = false;
    img.closest("[data-sky]").classList.add("has-photo");
  };
  if (img.complete && img.naturalWidth > 0) show();
  else {
    img.addEventListener("load", show, { once: true });
    img.addEventListener("error", () => img.remove(), { once: true });
  }
}

initSkyPhoto();
initTeamPhotos();
revealOnScroll();
initJourney();
initUfo();
