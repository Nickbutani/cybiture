document.documentElement.classList.add("has-js");

const revealItems = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll(".count");
const mobileStickyCta = document.querySelector(".mobile-sticky-cta");
const contactSection = document.querySelector("#contact");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let contactInView = false;

if (mobileStickyCta) {
  document.body.classList.add("has-sticky-cta");
}

const formatCounter = (value) => String(Math.round(value));

const animateCounter = (counter) => {
  if (counter.dataset.counted === "true") return;
  counter.dataset.counted = "true";

  const target = Number(counter.dataset.target);

  if (prefersReducedMotion || Number.isNaN(target)) {
    counter.textContent = formatCounter(target || 0);
    return;
  }

  const duration = 1000;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = formatCounter(target * eased);

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};

const updateMobileCta = () => {
  if (!mobileStickyCta) return;

  const shouldShow = window.innerWidth <= 768 && window.scrollY > 420 && !contactInView;
  mobileStickyCta.classList.toggle("is-visible", shouldShow);
};

window.addEventListener("scroll", updateMobileCta, { passive: true });
window.addEventListener("resize", updateMobileCta);

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
  counters.forEach(animateCounter);
  updateMobileCta();
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.14 },
  );

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.8 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
  counters.forEach((counter) => counterObserver.observe(counter));

  if (contactSection) {
    const contactObserver = new IntersectionObserver(
      (entries) => {
        contactInView = entries.some((entry) => entry.isIntersecting);
        updateMobileCta();
      },
      { threshold: 0.08 },
    );

    contactObserver.observe(contactSection);
  }

  updateMobileCta();
}
