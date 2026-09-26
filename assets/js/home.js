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

// Hero ring: the tool cards sit on a 3D cylinder that turns slowly, like a
// carousel seen from the front. The ring holds as many cards (repeating the
// set) as fit its radius with a small gap. GSAP turns it; without GSAP or with
// reduced motion it stands still. It slows on hover and pauses when off screen.
const CARD_PITCH = 184; // average card width plus the gap, before --card-scale

function initRing() {
  const stage = document.querySelector("[data-arc]");
  const ring = stage?.querySelector("[data-ring]");
  if (!ring) return;

  const originals = Array.from(ring.children);
  const state = { rot: 0 };

  const apply = () => {
    ring.style.transform = `translateZ(calc(var(--R) * -1)) rotateY(${state.rot}deg)`;
  };
  // The district card starts facing front, the others around it.
  const build = () => {
    // --R can be a clamp(), so measure it through a probe element.
    const probe = document.createElement("i");
    probe.style.cssText = "position:absolute;visibility:hidden;width:var(--R)";
    stage.appendChild(probe);
    const radius = probe.offsetWidth || 600;
    probe.remove();
    const scale = parseFloat(getComputedStyle(stage).getPropertyValue("--card-scale")) || 1;
    const n = originals.length;
    let count = Math.max(n, Math.floor((2 * Math.PI * radius) / (CARD_PITCH * scale)));
    if (count % n === 1) count -= 1;
    // Full sets repeat in order; a part set at the end takes the last cards of
    // the set, so no card sits next to its own copy where the ring closes.
    const tail = count % n;
    const full = count - tail;
    const pick = (i) => (i < full ? i % n : n - tail + (i - full));
    ring.replaceChildren(...Array.from({ length: count }, (_, i) => (i < n ? originals[i] : originals[pick(i)].cloneNode(true))));
    Array.from(ring.children).forEach((card, i) => {
      card.style.transform = `rotateY(${(i * 360) / count}deg) translateZ(var(--R)) scale(var(--card-scale))`;
    });
    apply();
  };
  build();
  stage.classList.add("is-placed");

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });

  if (!motionReady()) return;
  const { gsap } = window;
  const spin = gsap.to(state, { rot: "-=360", duration: 100, ease: "none", repeat: -1, onUpdate: apply });

  const speed = (to) => gsap.to(spin, { timeScale: to, duration: 0.8, ease: "power2.out", overwrite: true });
  stage.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && speed(0.12));
  stage.addEventListener("pointerleave", () => speed(1));

  new IntersectionObserver(([entry]) => (entry.isIntersecting ? spin.play() : spin.pause())).observe(stage);
  document.addEventListener("visibilitychange", () => (document.hidden ? spin.pause() : spin.play()));
}

initSkyPhoto();
initRing();
initTeamPhotos();
revealOnScroll();
initJourney();
initUfo();
