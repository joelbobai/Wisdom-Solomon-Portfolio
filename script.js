(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const preloader = document.getElementById("preloader");
  let preloaderHidden = false;

  const hidePreloader = () => {
    if (preloaderHidden) return;
    preloaderHidden = true;
    body.classList.add("is-loaded");
    root.classList.remove("is-loading");
    if (preloader) {
      preloader.classList.add("is-done");
      window.setTimeout(() => preloader.remove(), 1000);
    }
  };

  const startPreloaderTimer = () => {
    const remaining = Math.max(0, 780 - performance.now());
    window.setTimeout(hidePreloader, remaining);
  };

  if (document.readyState === "complete") {
    startPreloaderTimer();
  } else {
    window.addEventListener("load", startPreloaderTimer, { once: true });
  }
  window.setTimeout(hidePreloader, 3600);

  const header = document.getElementById("siteHeader");
  const progress = document.getElementById("scrollProgress");
  let scrollTicking = false;

  const updateScrollState = () => {
    const y = window.scrollY || window.pageYOffset || 0;
    if (header) header.classList.toggle("is-scrolled", y > 24);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
      progress.style.transform = "scaleX(" + ratio + ")";
    }
    scrollTicking = false;
  };

  const requestScrollUpdate = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollState);
  };

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  updateScrollState();

  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileLinks = mobileMenu ? Array.from(mobileMenu.querySelectorAll("a")) : [];
  let menuOpen = false;

  if (menuToggle && mobileMenu) {
    mobileMenu.inert = true;

    const setMenu = (open, restoreFocus) => {
      if (open === menuOpen) return;
      menuOpen = open;
      menuToggle.classList.toggle("is-active", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobileMenu.setAttribute("aria-hidden", String(!open));
      body.classList.toggle("menu-open", open);
      mobileMenu.inert = !open;

      if (open) {
        window.setTimeout(() => {
          const firstLink = mobileMenu.querySelector("a");
          if (firstLink && menuOpen) firstLink.focus({ preventScroll: true });
        }, 430);
      } else if (restoreFocus) {
        menuToggle.focus({ preventScroll: true });
      }
    };

    menuToggle.addEventListener("click", () => setMenu(!menuOpen, false));
    mobileLinks.forEach((link) => {
      link.addEventListener("click", () => setMenu(false, false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuOpen) setMenu(false, true);
    });

    const desktopQuery = window.matchMedia("(min-width: 981px)");
    const handleDesktopChange = (event) => {
      if (event.matches && menuOpen) setMenu(false, false);
    };

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", handleDesktopChange);
    } else if (typeof desktopQuery.addListener === "function") {
      desktopQuery.addListener(handleDesktopChange);
    }
  }

  const revealElements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  const timeline = document.getElementById("timeline");
  if (timeline && "IntersectionObserver" in window) {
    const timelineObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          timeline.classList.add("is-visible");
          observer.disconnect();
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -10% 0px" }
    );
    timelineObserver.observe(timeline);
  } else if (timeline) {
    timeline.classList.add("is-visible");
  }

  const counters = document.querySelectorAll("[data-count]");

  const animateCounter = (element) => {
    const target = Number.parseInt(element.dataset.count || "0", 10);
    if (!Number.isFinite(target)) return;

    if (reducedMotion.matches) {
      element.textContent = String(target);
      return;
    }

    const duration = 1500;
    let startTime = null;

    const tick = (now) => {
      if (startTime === null) startTime = now;
      const elapsed = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      element.textContent = String(Math.round(target * eased));
      if (elapsed < 1) window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  };

  if (counters.length) {
    if ("IntersectionObserver" in window && !reducedMotion.matches) {
      const counterObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.5 }
      );

      counters.forEach((counter) => counterObserver.observe(counter));
    } else {
      counters.forEach((counter) => {
        counter.textContent = String(counter.dataset.count || "0");
      });
    }
  }

  const navLinks = Array.from(
    document.querySelectorAll('.nav a[href^="#"], .mobile-menu nav a[href^="#"]')
  );
  const sections = Array.from(document.querySelectorAll("main section[id]"));

  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  if ("IntersectionObserver" in window && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveLink(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -52% 0px", threshold: 0 }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  const toast = document.getElementById("toast");
  let toastTimer = 0;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2500);
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      // Fallback below.
    }

    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.top = "-9999px";
    helper.style.opacity = "0";
    body.appendChild(helper);
    helper.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    helper.remove();
    return copied;
  };

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.dataset.copy || "";
      const copied = await copyToClipboard(text);

      if (copied) {
        button.classList.add("is-copied");
        window.setTimeout(() => button.classList.remove("is-copied"), 2000);
        showToast("Email copied to clipboard");
      } else {
        showToast("Select the email address to copy it");
      }
    });
  });

  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      const data = new FormData(contactForm);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const message = String(data.get("message") || "").trim();

      const subject = encodeURIComponent("Portfolio enquiry from " + name);
      const bodyText = encodeURIComponent(
        message + "\n\n— " + name + "\n" + email
      );

      window.location.href =
        "mailto:wisdomsolomon57@gmail.com?subject=" + subject + "&body=" + bodyText;
      showToast("Opening your email app…");
    });
  }

  if (finePointer.matches && !reducedMotion.matches) {
    const cursorDot = document.getElementById("cursorDot");
    const cursorRing = document.getElementById("cursorRing");

    if (cursorDot && cursorRing) {
      body.classList.add("has-custom-cursor");

      const interactiveSelector =
        "a, button, .chip, .expertise-card, .earlier-item, .stat, .portrait-frame, input, textarea, select";
      let mouseX = -100;
      let mouseY = -100;
      let ringX = -100;
      let ringY = -100;
      let cursorActive = false;
      let hovering = false;

      const renderCursor = () => {
        ringX += (mouseX - ringX) * 0.16;
        ringY += (mouseY - ringY) * 0.16;
        cursorRing.style.transform =
          "translate3d(" + ringX + "px, " + ringY + "px, 0)";
        window.requestAnimationFrame(renderCursor);
      };

      document.addEventListener(
        "pointermove",
        (event) => {
          mouseX = event.clientX;
          mouseY = event.clientY;

          if (!cursorActive) {
            cursorActive = true;
            cursorDot.classList.add("is-active");
            cursorRing.classList.add("is-active");
            ringX = mouseX;
            ringY = mouseY;
          }

          cursorDot.style.transform =
            "translate3d(" + mouseX + "px, " + mouseY + "px, 0)";

          const isOverInteractive = Boolean(
            event.target.closest(interactiveSelector)
          );
          if (isOverInteractive !== hovering) {
            hovering = isOverInteractive;
            cursorRing.classList.toggle("is-hover", hovering);
          }

          const isOverField = Boolean(
            event.target.closest("input, textarea, select")
          );
          cursorDot.classList.toggle("is-hidden", isOverField);
          cursorRing.classList.toggle("is-hidden", isOverField);
        },
        { passive: true }
      );

      window.addEventListener("mouseout", (event) => {
        if (event.relatedTarget) return;
        cursorDot.classList.remove("is-active");
        cursorRing.classList.remove("is-active");
      });

      window.requestAnimationFrame(renderCursor);

      document.querySelectorAll(".magnetic").forEach((element) => {
        element.addEventListener("pointermove", (event) => {
          const rect = element.getBoundingClientRect();
          const x = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
          const y = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
          const strength = 10;
          element.style.transform =
            "translate3d(" + x * strength + "px, " + y * strength + "px, 0)";
        });

        element.addEventListener("pointerleave", () => {
          element.style.transform = "";
        });
      });

      const hero = document.querySelector(".hero");
      const portraitFrame = document.getElementById("portraitFrame");

      if (hero && portraitFrame) {
        hero.addEventListener(
          "pointermove",
          (event) => {
            const rect = hero.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            portraitFrame.style.transform =
              "translate3d(" + x * 14 + "px, " + y * 14 + "px, 0)";
          },
          { passive: true }
        );

        hero.addEventListener("pointerleave", () => {
          portraitFrame.style.transform = "";
        });
      }
    }
  }

  const handleReducedMotionChange = () => {
    if (reducedMotion.matches) {
      navLinks.forEach((link) => link.classList.remove("is-active"));
      counters.forEach((counter) => {
        counter.textContent = String(counter.dataset.count || "0");
      });
      const timelineEl = document.getElementById("timeline");
      if (timelineEl) timelineEl.classList.add("is-visible");
      revealElements.forEach((element) => element.classList.add("is-visible"));
    }
  };

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", handleReducedMotionChange);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(handleReducedMotionChange);
  }
})();
