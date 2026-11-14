// Site languages (same six as the game). The English text of every text node / alt / title is the key; the
// dictionaries live in assets/js/i18n/<lang>.js (built by Tools/site_i18n.py). Choice: ?lang= > saved > browser > en.
(function () {
  const LANGS = [["en", "EN", "English"], ["zh-Hans", "中文", "简体中文"], ["ru", "RU", "Русский"],
    ["pt-BR", "PT", "Português (BR)"], ["es", "ES", "Español"], ["de", "DE", "Deutsch"]];
  const root = document.documentElement.dataset.root || "";
  const codes = LANGS.map((l) => l[0]);
  const store = { get() { try { return localStorage.getItem("ns-lang"); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem("ns-lang", v); } catch (e) { /* private mode */ } } };

  function fromTag(tag) {
    const t = (tag || "").toLowerCase();
    if (t.startsWith("zh")) return "zh-Hans";
    if (t.startsWith("ru") || t.startsWith("be") || t.startsWith("kk")) return "ru";
    if (t.startsWith("pt")) return "pt-BR";
    if (t.startsWith("es")) return "es";
    if (t.startsWith("de")) return "de";
    if (t.startsWith("en")) return "en";
    return null;
  }
  function pick() {
    const q = new URLSearchParams(location.search).get("lang");
    if (q && codes.includes(q)) return q;
    const s = store.get();
    if (s && codes.includes(s)) return s;
    for (const l of navigator.languages || [navigator.language]) { const c = fromTag(l); if (c) return c; }
    return "en";
  }

  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const texts = [];   // [node, english]
  const attrs = [];   // [element, attribute, english]
  let meta = null, title = document.title;
  function collect() {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement && /^(SCRIPT|STYLE|NOSCRIPT)$/.test(n.parentElement.tagName)) || !/[A-Za-z]{2}/.test(n.nodeValue)
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    for (let n = w.nextNode(); n; n = w.nextNode()) texts.push([n, n.nodeValue]);
    document.querySelectorAll("[alt],[title],[aria-label]").forEach((el) => ["alt", "title", "aria-label"].forEach((a) => {
      if (el.hasAttribute(a) && /[A-Za-z]{2}/.test(el.getAttribute(a))) attrs.push([el, a, el.getAttribute(a)]);
    }));
    meta = document.querySelector('meta[name="description"]');
    if (meta) meta.dataset.en = meta.content;
  }
  function apply(lang, dict) {
    const T = (s) => (dict && dict[norm(s)]) || null;
    for (const [n, en] of texts) {
      const tr = T(en);
      n.nodeValue = tr ? en.match(/^\s*/)[0] + tr + en.match(/\s*$/)[0] : en;
    }
    for (const [el, a, en] of attrs) el.setAttribute(a, T(en) || en);
    document.title = T(title) || title;
    if (meta) meta.content = T(meta.dataset.en) || meta.dataset.en;
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
    window.NS_T = (s) => T(s) || s;
  }
  function load(lang) {
    if (lang === "en") { apply("en", null); return; }
    const have = window.NS_I18N && window.NS_I18N[lang];
    if (have) { apply(lang, have); return; }
    const s = document.createElement("script");
    s.src = root + "assets/js/i18n/" + lang + ".js";
    s.onload = () => apply(lang, (window.NS_I18N || {})[lang]);
    s.onerror = () => apply("en", null);
    document.head.appendChild(s);
  }

  // The switcher: a small terminal-style select in the header (and the footer on narrow screens).
  function switcher(lang) {
    const host = document.querySelector("header.top .wrap");
    if (!host) return;
    const sel = document.createElement("select");
    sel.className = "lang";
    sel.setAttribute("aria-label", "Language");
    for (const [c, short, name] of LANGS) {
      const o = document.createElement("option");
      o.value = c; o.textContent = short + "  " + name; o.lang = c;
      if (c === lang) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener("change", () => {
      store.set(sel.value);
      const u = new URL(location.href); u.searchParams.set("lang", sel.value); history.replaceState(null, "", u);
      load(sel.value);
    });
    const after = host.querySelector(".btn");
    host.insertBefore(sel, after || null);
  }

  const lang = pick();
  collect();
  switcher(lang);
  load(lang);
})();
