(function () {
  "use strict";

  // Small helpers
  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1. Mobile menu toggle (also closes on link click and Escape key)
  function initMenu() {
    const menuBtn = $("#menu-btn");
    const navLinks = $("#nav-links");
    if (!menuBtn || !navLinks) return;
    function setOpen(open) {
      navLinks.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    }
    menuBtn.addEventListener("click", () => setOpen(!navLinks.classList.contains("open")));
    navLinks.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("open")) {
        setOpen(false);
        menuBtn.focus();
      }
    });
  }

  // 3. Typing effect in the hero terminal
  function initTyping() {
    const el = $("#typed");
    if (!el || reducedMotion) return;
    const text = el.dataset.text || el.textContent;
    let i = 0;
    el.textContent = "";
    (function type() {
      el.textContent = text.slice(0, i++);
      if (i <= text.length) setTimeout(type, 55);
    })();
  }

  // 4. Highlight the nav link of the section on screen
  function initActiveNav() {
    const sections = $$("main section[id]");
    const links = $$("#nav-links a");
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          const active = link.getAttribute("href") === "#" + entry.target.id;
          link.classList.toggle("active", active);
          if (active) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach((section) => observer.observe(section));
  }

  // 5. Scroll progress bar and 6. back-to-top button
  function initScroll() {
    const bar = $("#progress");
    const topBtn = $("#top-btn");
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
      if (topBtn) topBtn.style.display = window.scrollY > 400 ? "block" : "none";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    if (topBtn) {
      topBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
      });
    }
  }

  // 7. Project filter by topic, with a screen reader announcement
  function initFilter() {
    const buttons = $$(".filter");
    const projects = $$(".project");
    const status = $("#filter-status");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const topic = btn.dataset.filter;
        let shown = 0;
        buttons.forEach((b) => {
          const on = b === btn;
          b.classList.toggle("active", on);
          b.setAttribute("aria-pressed", String(on));
        });
        projects.forEach((project) => {
          const match = topic === "all" || project.dataset.category.split(" ").includes(topic);
          project.hidden = !match;
          if (match) shown++;
        });
        if (status) status.textContent = "Showing " + shown + " of " + projects.length + " projects.";
      });
    });
  }

  // 8. Screenshot lightbox using the native dialog element
  function initLightbox() {
    const dialog = $("#lightbox");
    const img = $("#lightbox-img");
    const closeBtn = $("#lightbox-close");
    if (!dialog || !img || typeof dialog.showModal !== "function") return;
    $$(".shot").forEach((shot) => {
      shot.addEventListener("click", () => {
        const thumb = $("img", shot);
        img.src = shot.dataset.full || thumb.src;
        img.alt = thumb.alt;
        dialog.showModal();
      });
    });
    closeBtn.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  }

  // 9. Copy email button with clipboard fallback message
  function initCopyEmail() {
    const copyBtn = $("#copy-btn");
    const emailLink = $("#email-link");
    if (!copyBtn || !emailLink) return;
    function flash(text) {
      copyBtn.textContent = text;
      setTimeout(() => { copyBtn.textContent = "Copy email"; }, 2000);
    }
    copyBtn.addEventListener("click", () => {
      if (!navigator.clipboard) { flash("Copy not supported"); return; }
      navigator.clipboard.writeText(emailLink.textContent.trim())
        .then(() => flash("Copied!"))
        .catch(() => flash("Copy failed"));
    });
  }

  // 10. Contact form validation with per-field errors
  // 11. Live character counter for the message box
  function initForm() {
    const form = $("#form");
    const status = $("#status");
    const message = $("#message");
    const count = $("#count");
    if (!form || !status) return;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const rules = {
      name: (v) => (v.length < 2 ? "Enter your name (at least 2 characters)." : ""),
      email: (v) => (!emailPattern.test(v) ? "Enter a valid email address, like name@example.com." : ""),
      message: (v) => (v.length < 10 ? "Write a message of at least 10 characters." : "")
    };
    function setError(id, text) {
      const field = document.getElementById(id);
      const out = document.getElementById(id + "-err");
      if (out) out.textContent = text;
      field.setAttribute("aria-invalid", text ? "true" : "false");
    }
    function updateCount() {
      if (count && message) count.textContent = message.value.length + " / " + message.maxLength;
    }
    if (message) message.addEventListener("input", updateCount);
    Object.keys(rules).forEach((id) => {
      const field = document.getElementById(id);
      if (field) field.addEventListener("blur", () => setError(id, rules[id](field.value.trim())));
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      let firstInvalid = null;
      Object.keys(rules).forEach((id) => {
        const field = document.getElementById(id);
        const error = rules[id](field.value.trim());
        setError(id, error);
        if (error && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        status.textContent = "Please fix the highlighted fields.";
        status.className = "error";
        firstInvalid.focus();
        return;
      }
      status.textContent = "Thank you, " + $("#name").value.trim() + ". Your message has been received.";
      status.className = "success";
      form.reset();
      updateCount();
    });
  }

  // 12. Footer year
  function initYear() {
    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();
  }

  // Start every feature separately so one failure cannot stop the rest
  [initMenu, initTyping, initActiveNav, initScroll, initFilter,
   initLightbox, initCopyEmail, initForm, initYear].forEach((init) => {
    try { init(); } catch (err) { /* keep the page working */ }
  });
})();
