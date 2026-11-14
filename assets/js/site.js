// Night Stocktake site: links from config.js, the sticker wall slapped onto the hero (like the game's intro), reveal on
// scroll, corner stickers, lightbox, lazy trailer, copy buttons. Respects prefers-reduced-motion.
(function () {
  const C = window.NS_CONFIG || {};
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement.dataset.root || "";

  // ---- links: data-link="discord|steam|press|youtube|tiktok|x"; empty -> "SOON"
  const map = { discord: C.discordUrl, steam: C.steamUrl, youtube: C.youtube, tiktok: C.tiktok, x: C.x,
    email: C.pressEmail ? "mailto:" + C.pressEmail : "" };
  document.querySelectorAll("[data-link]").forEach((a) => {
    const url = map[a.dataset.link];
    if (url) { a.href = url; if (!url.startsWith("mailto:")) { a.target = "_blank"; a.rel = "noopener"; } }
    else { a.classList.add("soon"); a.removeAttribute("href"); if (!a.classList.contains("btn")) return; const t = document.createElement("span"); t.className = "tag"; t.textContent = "SOON"; a.appendChild(t); }
  });
  document.querySelectorAll("[data-email]").forEach((e) => { e.textContent = C.pressEmail || "coming soon - ask on our Discord"; });

  // ---- hero: stickers slapped in a spiral towards the title, the page kicks on every slap, then the title plate slams
  const hero = document.querySelector(".hero");
  const wall = document.querySelector(".hero .wall");
  const plate = document.querySelector(".plate");
  if (hero && wall) {
    let seed = 20261114;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const W = () => wall.clientWidth, H = () => wall.clientHeight;
    const pts = [];
    let ang = rnd() * Math.PI * 2, rad = 1;
    const kinds = Array.from({ length: 85 }, (_, i) => i).sort(() => rnd() - 0.5);
    let k = 0;
    while (rad > 0.42 && pts.length < 70) {
      const size = (90 + rnd() * 70) * Math.min(1, Math.max(0.55, wall.clientWidth / 1300));
      const x = 50 + Math.cos(ang) * 52 * rad, y = 50 + Math.sin(ang) * 52 * rad;
      pts.push({ x, y, size, rot: -28 + rnd() * 56, kind: kinds[k++ % kinds.length] });
      ang += 0.42 / Math.max(rad, 0.3);
      rad -= 0.0105;
    }
    const pad = (n) => String(n).padStart(2, "0");
    let t = reduce ? 0 : 250;
    pts.forEach((p, i) => {
      const img = document.createElement("img");
      img.src = root + "assets/img/stickers/s" + pad(p.kind) + ".webp";
      img.alt = ""; img.className = "slap"; img.loading = "eager";
      img.style.left = p.x + "%"; img.style.top = p.y + "%";
      img.style.setProperty("--s", p.size + "px"); img.style.setProperty("--r", p.rot + "deg");
      wall.appendChild(img);
      const go = () => { img.classList.add("in"); if (!reduce && i % 2 === 0) { hero.classList.remove("shake"); void hero.offsetWidth; hero.classList.add("shake"); } };
      if (reduce) go(); else setTimeout(go, t);
      t += Math.max(26, 85 - i * 1.2);
    });
    if (plate) setTimeout(() => { plate.classList.add("in"); if (!reduce) { hero.classList.remove("shake"); void hero.offsetWidth; hero.classList.add("shake"); } }, reduce ? 0 : t + 250);
  }

  // ---- reveal on scroll + corner stickers
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); } }), { threshold: 0.18 });
  document.querySelectorAll(".reveal, .corner-sticker").forEach((el) => io.observe(el));

  // ---- trailer: thumbnail first, the YouTube player only on click
  document.querySelectorAll(".trailer").forEach((tr) => {
    const id = C.trailerYouTubeId;
    const label = tr.querySelector(".play div");
    if (!id) { if (label) label.textContent = "TRAILER SOON"; tr.style.cursor = "default"; return; }
    tr.addEventListener("click", () => {
      const f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true; f.title = "Night Stocktake trailer";
      tr.appendChild(f);
    }, { once: true });
  });

  // ---- lightbox
  const lb = document.querySelector(".lightbox");
  if (lb) {
    const big = lb.querySelector("img");
    document.querySelectorAll(".gallery img").forEach((im) => im.addEventListener("click", () => { big.src = im.src; big.alt = im.alt; lb.classList.add("on"); }));
    lb.addEventListener("click", () => lb.classList.remove("on"));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") lb.classList.remove("on"); });
  }

  // ---- copy buttons (press page)
  const toast = document.createElement("div"); toast.className = "toast"; toast.textContent = "COPIED"; document.body.appendChild(toast);
  document.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", () => {
    const src = document.querySelector(b.dataset.copy);
    if (!src) return;
    navigator.clipboard.writeText(src.innerText.trim()).then(() => { toast.classList.add("on"); setTimeout(() => toast.classList.remove("on"), 1200); });
  }));

  // ---- Steam widget once the page is public
  const sw = document.querySelector("#steam-widget");
  if (sw && C.steamAppId) sw.innerHTML = '<iframe src="https://store.steampowered.com/widget/' + C.steamAppId + '/" frameborder="0" width="646" height="190" style="max-width:100%"></iframe>';
})();
