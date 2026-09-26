// Light entrance motion with GSAP. Content is visible by default: if GSAP fails
// to load, or the visitor prefers reduced motion, nothing is hidden.

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function motionReady() {
  return !reduced && typeof window.gsap !== "undefined";
}

/** Fades up elements marked [data-reveal] as they enter the viewport. */
export function revealOnScroll(root = document) {
  if (!motionReady()) return;
  const { gsap } = window;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  root.querySelectorAll("[data-reveal]").forEach((group) => {
    const targets = group.dataset.reveal === "children" ? Array.from(group.children) : [group];
    gsap.from(targets, {
      opacity: 0,
      y: 14,
      duration: 0.6,
      ease: "expo.out",
      stagger: 0.06,
      clearProps: "opacity,transform",
      scrollTrigger: window.ScrollTrigger ? { trigger: group, start: "top 88%", once: true } : undefined
    });
  });
}

/** Short fade for content injected after a data load. */
export function revealItems(nodes) {
  if (!motionReady() || !nodes.length) return;
  window.gsap.from(nodes, {
    opacity: 0,
    y: 8,
    duration: 0.4,
    ease: "expo.out",
    stagger: 0.03,
    clearProps: "opacity,transform"
  });
}
