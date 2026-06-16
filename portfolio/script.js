/* ============================================================
   BURN Portfolio — interactions & animations
   ============================================================ */
(() => {
  "use strict";
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = {
    x: innerWidth * .5,
    y: innerHeight * .35,
    tx: innerWidth * .5,
    ty: innerHeight * .35,
    active: false
  };

  /* ---------- interactive background variables ---------- */
  (function interactiveBg() {
    if (reduce) return;
    const root = document.documentElement;
    const onMove = e => {
      pointer.tx = e.clientX;
      pointer.ty = e.clientY;
      pointer.active = true;
    };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerleave", () => { pointer.active = false; }, { passive: true });
    function frame() {
      pointer.x += (pointer.tx - pointer.x) * .08;
      pointer.y += (pointer.ty - pointer.y) * .08;
      const px = pointer.x / Math.max(1, innerWidth);
      const py = pointer.y / Math.max(1, innerHeight);
      const dx = px - .5;
      const dy = py - .5;
      root.style.setProperty("--mx", (px * 100).toFixed(2) + "%");
      root.style.setProperty("--my", (py * 100).toFixed(2) + "%");
      root.style.setProperty("--bg-x", (-dx * 26).toFixed(2) + "px");
      root.style.setProperty("--bg-y", (-dy * 22).toFixed(2) + "px");
      root.style.setProperty("--grid-x", (dx * 22).toFixed(2) + "px");
      root.style.setProperty("--grid-y", (dy * 18).toFixed(2) + "px");
      root.style.setProperty("--hero-x", (dx * 18).toFixed(2) + "px");
      root.style.setProperty("--hero-y", (dy * 14).toFixed(2) + "px");
      requestAnimationFrame(frame);
    }
    function scrollVars() {
      root.style.setProperty("--scroll-shift", (scrollY * -.035).toFixed(2) + "px");
    }
    addEventListener("scroll", scrollVars, { passive: true });
    addEventListener("resize", () => {
      pointer.tx = innerWidth * .5;
      pointer.ty = innerHeight * .35;
    });
    scrollVars();
    requestAnimationFrame(frame);
  })();

  /* ---------- starfield canvas ---------- */
  (function stars() {
    const c = $("#stars"); if (!c) return;
    const ctx = c.getContext("2d");
    let w, h, pts = [];
    function size() {
      w = c.width  = innerWidth;
      h = c.height = innerHeight;
      const n = Math.min(120, Math.floor(w * h / 14000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.6 + .3,
        a: Math.random() * .6 + .2,
        tw: Math.random() * .02 + .004,
        vx: (Math.random() - .5) * .12, vy: (Math.random() - .5) * .12,
        ph: Math.random() * Math.PI * 2
      }));
    }
    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 15000 && d2 > .01) {
            const force = (1 - d2 / 15000) * .055;
            p.vx += dx * force / Math.sqrt(d2);
            p.vy += dy * force / Math.sqrt(d2);
          }
        }
        p.vx *= .992;
        p.vy *= .992;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        const a = p.a * (0.5 + 0.5 * Math.sin(t * p.tw + p.ph));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = `rgba(120,220,245,${a})`;
        ctx.fill();
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.strokeStyle = `rgba(34,211,238,${(1 - d / 120) * .18})`;
            ctx.lineWidth = .6;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(frame);
    }
    size(); addEventListener("resize", size);
    if (!reduce) requestAnimationFrame(frame);
  })();

  /* ---------- i18n: TH / EN language toggle ---------- */
  (function i18n() {
    const seg = $$(".lang-seg button");
    const cap = s => s[0].toUpperCase() + s.slice(1);
    function apply(lang) {
      document.documentElement.setAttribute("lang", lang);
      $$("[data-th][data-en]").forEach(el => { el.innerHTML = el.dataset[lang]; });
      const inp = $("#ai-input");
      if (inp && inp.dataset["ph" + cap(lang)]) inp.placeholder = inp.dataset["ph" + cap(lang)];
      const typed = $(".typed");
      if (typed && typed.dataset["words" + cap(lang)]) typed.dataset.words = typed.dataset["words" + cap(lang)];
      seg.forEach(b => b.classList.toggle("on", b.dataset.lang === lang));
      try { localStorage.setItem("burn-lang", lang); } catch (e) {}
    }
    seg.forEach(b => b.addEventListener("click", () => apply(b.dataset.lang)));
    let saved = "en";
    try { saved = localStorage.getItem("burn-lang") || "en"; } catch (e) {}
    apply(saved);
  })();

  /* ---------- theme: light / dark toggle ---------- */
  (function theme() {
    const btn = $("#themeBtn");
    function set(t) {
      document.documentElement.setAttribute("data-theme", t);
      try { localStorage.setItem("burn-theme", t); } catch (e) {}
    }
    btn && btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      document.documentElement.classList.add("theming");
      set(next);
      setTimeout(() => document.documentElement.classList.remove("theming"), 520);
    });
  })();

  /* ---------- typing effect (language-aware) ---------- */
  (function typing() {
    const el = $(".typed"); if (!el) return;
    let phrases = el.dataset.words.split("|");
    let pi = 0, ci = 0, del = false;
    function tick() {
      const word = phrases[pi] || "";
      ci += del ? -1 : 1;
      el.textContent = word.slice(0, Math.max(0, ci));
      let wait = del ? 45 : 80;
      if (!del && ci === word.length) { wait = 1800; del = true; }
      else if (del && ci <= 0) {
        del = false; ci = 0;
        phrases = el.dataset.words.split("|");      // re-read in case language changed
        pi = (pi + 1) % phrases.length; wait = 350;
      }
      setTimeout(tick, wait);
    }
    if (reduce) { el.textContent = phrases[0]; return; }
    tick();
  })();

  /* ---------- scroll reveal (rect-based — IO unreliable in preview) ---------- */
  const revealEls = $$(".reveal, .tl-item");
  function revealCheck() {
    const trig = innerHeight * 0.9;
    for (const el of revealEls) {
      if (el.classList.contains("in")) continue;
      if (el.getBoundingClientRect().top < trig) el.classList.add("in");
    }
  }

  /* ---------- timeline spine fill ---------- */
  (function spine() {
    const fill = $(".tl-spine .fill"), tl = $(".timeline");
    if (!fill || !tl) return;
    function upd() {
      const r = tl.getBoundingClientRect();
      const vh = innerHeight;
      const total = r.height;
      const prog = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / total));
      fill.style.height = (prog * 100) + "%";
    }
    addEventListener("scroll", upd, { passive: true });
    addEventListener("resize", upd); upd();
  })();

  /* ---------- count up stats (rect-based) ---------- */
  const countEls = $$("[data-count]");
  const counted = new Set();
  function countCheck() {
    for (const el of countEls) {
      if (counted.has(el)) continue;
      if (el.getBoundingClientRect().top > innerHeight * 0.92) continue;
      counted.add(el);
      const end = +el.dataset.count, suf = el.dataset.suffix || "";
      if (reduce) { el.textContent = end + suf; continue; }
      const dur = 1400; let t0;
      (function step(ts) {
        if (!t0) t0 = ts;
        const p = Math.min(1, (ts - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased) + suf;
        if (p < 1) requestAnimationFrame(step);
      })();
    }
  }

  /* ---------- master scroll engine ---------- */
  function onScroll() { revealCheck(); countCheck(); }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  // run now + a few delayed passes so first paint / font load reveals above-the-fold
  onScroll();
  requestAnimationFrame(onScroll);
  [100, 350, 800].forEach(t => setTimeout(onScroll, t));

  /* ---------- projects slider ---------- */
  (function projects() {
    const dots = $$(".proj-dot");
    const slides = $$(".proj-slide");
    const prog = $(".proj-prog i");
    if (!slides.length) return;
    let idx = 0, timer;
    function go(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("on", k === idx));
      dots.forEach((d, k) => d.classList.toggle("on", k === idx));
      if (prog) prog.style.width = ((idx + 1) / slides.length * 100) + "%";
    }
    dots.forEach((d, k) => d.addEventListener("click", () => { go(k); restart(); }));
    function restart() { clearInterval(timer); if (!reduce) timer = setInterval(() => go(idx + 1), 5200); }
    go(0); restart();
  })();

  /* ---------- in-card image carousels ---------- */
  $$("[data-carousel]").forEach(car => {
    const track = $(".cc-track", car);
    const imgs = $$(".cc-track > img", car);
    if (!track || imgs.length < 2) return;
    const dotsWrap = $(".cc-dots", car);
    const labelEl = $(".cc-label", car);
    const labels = car.dataset.labels ? car.dataset.labels.split("|") : [];
    let i = 0, timer;
    imgs.forEach((_, k) => {
      const b = document.createElement("button");
      if (k === 0) b.className = "on";
      b.setAttribute("aria-label", "Go to slide " + (k + 1));
      b.addEventListener("click", () => { go(k); restart(); });
      dotsWrap && dotsWrap.appendChild(b);
    });
    const dots = dotsWrap ? $$("button", dotsWrap) : [];
    function go(n) {
      i = (n + imgs.length) % imgs.length;
      track.style.transform = `translateX(-${i * 100}%)`;
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
      if (labelEl && labels[i]) labelEl.textContent = labels[i];
    }
    function restart() { clearInterval(timer); if (!reduce) timer = setInterval(() => go(i + 1), 3800); }
    const prev = $(".cc-nav.prev", car), next = $(".cc-nav.next", car);
    prev && prev.addEventListener("click", () => { go(i - 1); restart(); });
    next && next.addEventListener("click", () => { go(i + 1); restart(); });
    car.addEventListener("mouseenter", () => clearInterval(timer));
    car.addEventListener("mouseleave", restart);
    go(0); restart();
  });

  /* ---------- local pointer highlights ---------- */
  if (!reduce) $$(".stat, .tl-card, .tech-pill, .edu-card").forEach(el => {
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--local-x", ((e.clientX - r.left) / r.width * 100).toFixed(2) + "%");
      el.style.setProperty("--local-y", ((e.clientY - r.top) / r.height * 100).toFixed(2) + "%");
    }, { passive: true });
  });

  /* ---------- magnetic buttons ---------- */
  if (!reduce) $$(".btn, .icon-btn").forEach(b => {
    b.addEventListener("mousemove", e => {
      const r = b.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      b.style.transform = `translate(${x * .18}px, ${y * .28 - 3}px)`;
    });
    b.addEventListener("mouseleave", () => b.style.transform = "");
  });

  /* ---------- scroll progress + dock active ---------- */
  (function nav() {
    const bar = $(".scroll-prog");
    const links = $$(".dock a[data-sec]");
    const secs = links.map(a => $("#" + a.dataset.sec)).filter(Boolean);
    function upd() {
      const st = scrollY, dh = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.width = (dh > 0 ? st / dh * 100 : 0) + "%";
      let cur = secs[0];
      for (const s of secs) if (s.offsetTop - 200 <= st) cur = s;
      links.forEach(a => a.classList.toggle("on", cur && a.dataset.sec === cur.id));
    }
    addEventListener("scroll", upd, { passive: true }); upd();
  })();

  /* ---------- tilt on project device ---------- */
  if (!reduce) $$(".show-visual").forEach(vis => {
    const dev = $(".device-wrap", vis);
    if (!dev) return;
    vis.addEventListener("mousemove", e => {
      const r = vis.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      dev.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
    });
    vis.addEventListener("mouseleave", () => dev.style.transform = "");
  });

  /* ============================================================
     AI CHAT — "Ask AI about Burn" powered by Claude
     ============================================================ */
  (function aiChat() {
    const fab   = $("#ai-fab");
    const panel = $("#ai-panel");
    const close = $("#ai-close");
    const log   = $("#ai-log");
    const form  = $("#ai-form");
    const input = $("#ai-input");
    const chips = $$(".ai-chip");
    if (!fab || !panel) return;

    const SYSTEM = `You are Burn's friendly portfolio assistant. Burn (full name: Thanantron Jittrapirom) is a Senior Software Engineer with 7+ years of experience building web and mobile apps. Facts about Burn:
- Current: Senior Software Engineer at Aware Corporation Ltd. (onsite at AIS), May 2023–present. Develops the myAIS 2.0 app in Flutter using clean-code & event-driven architecture, owns payment & billing features, builds UI with Atomic Design, manages state with Bloc, and does unit & functional testing.
- Lead Frontend Developer at THE CENTURY KING CO., LTD (Sep 2022–May 2023): team & project management, built Artisgo (a wellness & health booking app) in Flutter, built a React.js back-office to manage Artisgo data, deployed to App Store & Google Play.
- Frontend Developer at WESERVE PLATFORM (Jan 2019–Sep 2022): WESERVE food-delivery & messenger platform as frontend + mobile dev using Flutter and Vue.js, with real-time tracking on Google Maps.
- Network Engineer Internship at CAT Telecom (Oct–Dec 2018): onsite WLAN/LAN configuration and network device installation.
- Education: Bachelor's degree, Prince of Songkla University, Phuket Campus (2014–2018); Muang Suratthani School (2008–2014).
- Skills: Flutter, Dart, Vue.js, Nuxt.js, React, Next.js, TypeScript, JavaScript, HTML, CSS, Tailwind CSS, Node.js, MongoDB, MySQL, Ant Design, Firebase, AWS, GCP, Cloudflare, Netlify, Git, Xcode, Android Studio, Jira, Figma.
- AI tools: uses Claude, ChatGPT, GitHub Copilot and Cursor in his development workflow.
- Based in Phuket, Thailand. Email: thanantron@gmail.com.
Answer warmly and concisely (2-4 sentences). Reply in the same language the visitor uses (Thai or English). If asked something unknown, say you'll pass it to Burn. Never invent contact details.`;

    let history = [];
    let open = false;

    function toggle(state) {
      open = state ?? !open;
      panel.classList.toggle("on", open);
      fab.classList.toggle("active", open);
      if (open) setTimeout(() => input.focus(), 300);
      if (open && !log.dataset.greeted) {
        log.dataset.greeted = "1";
        addMsg("ai", "สวัสดีครับ! 👋 ผมเป็นผู้ช่วย AI ของ Burn ถามอะไรเกี่ยวกับประสบการณ์ ทักษะ หรือโปรเจกต์ของเขาได้เลยครับ");
      }
    }
    fab.addEventListener("click", () => toggle());
    close.addEventListener("click", () => toggle(false));

    function addMsg(who, text) {
      const el = document.createElement("div");
      el.className = "ai-msg " + who;
      el.innerHTML = `<div class="ai-bubble"></div>`;
      el.querySelector(".ai-bubble").textContent = text;
      log.appendChild(el);
      log.scrollTop = log.scrollHeight;
      return el;
    }
    function typingMsg() {
      const el = document.createElement("div");
      el.className = "ai-msg ai";
      el.innerHTML = `<div class="ai-bubble ai-typing"><span></span><span></span><span></span></div>`;
      log.appendChild(el); log.scrollTop = log.scrollHeight;
      return el;
    }

    function localReply(q) {
      const text = q.toLowerCase();
      const thai = /[\u0E00-\u0E7F]/.test(q);
      if (text.includes("myais") || q.includes("มายเอไอเอส")) {
        return thai
          ? "Burn ทำงานกับ myAIS 2.0 ในบทบาท Senior Software Engineer โดยใช้ Flutter, clean-code architecture, Bloc และดูแลฟีเจอร์ payment/billing รวมถึง unit และ functional testing ครับ"
          : "Burn works on myAIS 2.0 as a Senior Software Engineer, building Flutter features with clean-code architecture, Bloc state management, payment and billing flows, plus unit and functional testing.";
      }
      if (text.includes("skill") || q.includes("สกิล")) {
        return thai
          ? "สกิลหลักของ Burn คือ Flutter, Dart, Vue.js, Nuxt.js, React, Next.js, TypeScript, Node.js, Firebase, AWS, GCP และเครื่องมือ AI อย่าง Claude, ChatGPT, Copilot และ Cursor ครับ"
          : "Burn's core stack includes Flutter, Dart, Vue.js, Nuxt.js, React, Next.js, TypeScript, Node.js, Firebase, AWS, GCP, and AI tools such as Claude, ChatGPT, Copilot, and Cursor.";
      }
      if (text.includes("project") || text.includes("portfolio") || q.includes("โปรเจกต์")) {
        return thai
          ? "โปรเจกต์เด่นมี ALTUS Penthouse, Trading Journal, myAIS, Weserve และ Weserve Go โดยเน้นเว็บ/โมบายที่ใช้งานจริง มี motion และ UX ที่เป็นระบบครับ"
          : "Featured projects include ALTUS Penthouse, Trading Journal, myAIS, Weserve, and Weserve Go, with a focus on real-world web and mobile products, motion, and structured UX.";
      }
      return thai
        ? "Burn เป็น Senior Software Engineer ในภูเก็ต มีประสบการณ์ 7+ ปีด้านเว็บและโมบาย โดยเชี่ยวชาญ Flutter, Vue.js, Nuxt.js และ system design ครับ ติดต่อได้ที่ thanantron@gmail.com"
        : "Burn is a Phuket-based Senior Software Engineer with 7+ years of web and mobile experience, specializing in Flutter, Vue.js, Nuxt.js, and system design. You can reach him at thanantron@gmail.com.";
    }

    async function ask(q) {
      addMsg("user", q);
      history.push({ role: "user", content: q });
      const t = typingMsg();
      try {
        if (!window.claude || typeof window.claude.complete !== "function") {
          await new Promise(resolve => setTimeout(resolve, 320));
          throw new Error("Claude bridge unavailable");
        }
        const reply = await window.claude.complete({
          messages: [{ role: "user", content: SYSTEM + "\n\nConversation so far:\n" +
            history.map(m => (m.role === "user" ? "Visitor: " : "Assistant: ") + m.content).join("\n") +
            "\n\nReply to the last visitor message now." }]
        });
        t.remove();
        const clean = (reply || "").trim() || "ขออภัยครับ ลองถามใหม่อีกครั้งได้ไหมครับ";
        addMsg("ai", clean);
        history.push({ role: "assistant", content: clean });
      } catch (err) {
        t.remove();
        const clean = localReply(q);
        addMsg("ai", clean);
        history.push({ role: "assistant", content: clean });
      }
    }

    form.addEventListener("submit", e => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      input.value = "";
      ask(q);
    });
    chips.forEach(c => c.addEventListener("click", () => { toggle(true); ask(c.textContent.trim()); }));
  })();
})();
