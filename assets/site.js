/* Omnity Hub. Draws both pages from assets/data.js. */
(() => {
  "use strict";

  const { games, discord, logo } = window.OMNITY;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // localStorage keeps a viewer's settings; private mode just means they do not persist.
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* not persisted */ }
    },
  };

  const live = games.filter((g) => g.status === "live").sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  const soon = games.filter((g) => g.status !== "live");
  const flagship = live.find((g) => g.featured) || live[0];
  const featuresOf = (g) => Object.values(g.features || {}).flat();
  const tone = (g) => (games.indexOf(g) % 8) + 1;
  const pageOf = (g) => `script.html?id=${encodeURIComponent(g.id)}`;
  const ext = 'target="_blank" rel="noopener"';
  const compact = new Intl.NumberFormat("en", { notation: "compact", maximumSignificantDigits: 3 });

  // Live player counts and thumbnails from Roblox. Roblox's own API refuses
  // browsers, so this goes through RoProxy. universeId -> { playing, thumb }
  const roblox = {};
  const redraws = [];

  const svg = (body, fill) =>
    `<svg viewBox="0 0 24 24" ${fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'} aria-hidden="true">${body}</svg>`;
  const ICON = {
    copy: svg('<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    back: svg('<path d="M14.5 18l-6-6 6-6"/>'),
    out: svg('<path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 18.5v-12A1.5 1.5 0 0 1 5.5 5H10"/>'),
    search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>'),
    expand: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    discord: svg('<path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.27 18.27 0 0 0-5.49 0 12.6 12.6 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.88 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.05 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-1.99a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1-.01-.13l.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01l.37.29a.08.08 0 0 1-.01.13 12.3 12.3 0 0 1-1.87.89.08.08 0 0 0-.04.11c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .09.03 19.84 19.84 0 0 0 6-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.09-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.15-1.09-2.15-2.42s.95-2.42 2.15-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42z"/>', true),
    Combat: svg('<circle cx="12" cy="12" r="7"/><path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5"/>'),
    Movement: svg('<path d="M3 8h10a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7"/>'),
    ESP: svg('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>'),
    Visuals: svg('<path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/><path d="M18.5 16v4M16.5 18h4"/>'),
    Menu: svg('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  };

  /* ---------- shared bits ---------- */

  // Colours the loader line. <wbr> before the URL gives narrow screens a clean place to wrap.
  function lua(src) {
    return src
      .split(/("[^"]*")/)
      .map((part, i) =>
        i % 2
          ? `<wbr><span class="t-str">${esc(part)}</span>`
          : esc(part).replace(/\b(loadstring|game)\b/g, '<span class="t-kw">$1</span>').replace(/:(\w+)/g, ':<span class="t-fn">$1</span>'),
      )
      .join("");
  }

  const copyButton = (g, label = "Copy script", size = "") =>
    `<button class="btn btn-primary copy ${size}" type="button" data-copy="${esc(g.id)}">` +
    `<span class="idle">${ICON.copy}${label}</span>` +
    `<span class="done" aria-hidden="true">${ICON.check}Copied</span>` +
    `<span class="bubble" aria-hidden="true">Paste it in your executor</span></button>`;

  const discordButton = (label, size = "btn-sm") =>
    `<a class="btn ${size}" href="${esc(discord)}" ${ext}>${ICON.discord}${label}</a>`;

  const pictureOf = (g) => g.image || roblox[g.universeId]?.thumb || "";
  const playingOf = (g) => roblox[g.universeId]?.playing;
  const playingText = (g) => (Number.isFinite(playingOf(g)) ? `${compact.format(playingOf(g))} playing` : "");

  // A drawn cover sits underneath; the picture fades in over it once it has loaded.
  const cover = (g, eager = false) => {
    const src = pictureOf(g);
    const img = src
      ? `<img src="${esc(src)}" alt="" width="1280" height="720" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" onload="this.classList.add('is-in')" onerror="this.remove()">`
      : "";
    return `<div class="cover tone-${tone(g)}" data-genre="${esc(g.genre)}"><span class="cover-name" aria-hidden="true">${esc(g.game)}</span>${img}</div>`;
  };

  // Game pictures open the quick look; a "Quick look" pill pops up on hover.
  const coverButton = (g) =>
    `<button class="tile-cover" type="button" data-peek="${esc(g.id)}" aria-label="Quick look at ${esc(g.game)}">${cover(g)}` +
    `<span class="peek-pill" aria-hidden="true">${ICON.expand}Quick look</span></button>`;

  const robloxButton = (g) =>
    g.placeId ? `<a class="btn btn-sm" href="https://www.roblox.com/games/${Number(g.placeId)}" ${ext}>Open on Roblox ${ICON.out}</a>` : "";

  function say(message) {
    const el = $("#announce");
    if (!el) return;
    el.textContent = "";
    requestAnimationFrame(() => (el.textContent = message));
  }

  function toast(message) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function copyByHand(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.append(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    area.remove();
    return ok;
  }

  async function copy(text, button) {
    let ok = true;
    try { await navigator.clipboard.writeText(text); } catch { ok = copyByHand(text); }
    if (!ok) return toast("Copy was blocked. Select the line and copy it yourself.");
    say("Script copied. Paste it into your executor.");

    // Keep the bubble on screen when the button sits near an edge.
    const bubble = $(".bubble", button);
    const box = button.getBoundingClientRect();
    const half = bubble.offsetWidth / 2;
    const mid = box.left + box.width / 2;
    const shift = Math.min(0, innerWidth - 12 - (mid + half)) + Math.max(0, 12 - (mid - half));
    bubble.style.setProperty("--shift", `${Math.round(shift)}px`);

    button.classList.remove("is-done");
    void button.offsetWidth; // restart the pop when copying twice in a row
    button.classList.add("is-done");
    clearTimeout(button.doneTimer);
    button.doneTimer = setTimeout(() => button.classList.remove("is-done"), 1900);
  }

  document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-copy]");
    if (!button) return;
    const g = games.find((x) => x.id === button.dataset.copy);
    if (g?.load) copy(g.load, button);
  });

  /* ---------- looks: six themes and a custom colour ---------- */

  const LOOKS = ["Red and blue", "Ember and teal", "Rose and ice", "Gold and cobalt", "Coral and mint", "Silver"];
  const currentLook = () => String(store.get("omnity:look", "1"));

  function looks(name, withCustom) {
    const cur = currentLook();
    const presets = LOOKS.map(
      (label, i) =>
        `<label class="swatch" style="--sa: var(--look${i + 1}a); --sb: var(--look${i + 1}b)" title="${label}">` +
        `<input type="radio" name="look-${name}" value="${i + 1}" data-look ${cur === String(i + 1) ? "checked" : ""}><span class="sr">${label}</span></label>`,
    ).join("");
    const custom = withCustom
      ? `<input class="color" type="color" data-look-custom value="${cur.startsWith("#") ? cur : "#4a7bff"}" aria-label="Custom accent colour" title="Custom colour">`
      : "";
    return `<span class="looks" role="radiogroup" aria-label="Theme">${presets}${custom}</span>`;
  }

  function applyLook(value) {
    const root = document.documentElement;
    if (value.startsWith("#")) {
      root.dataset.look = "custom";
      root.style.setProperty("--a", value);
      root.style.setProperty("--b", value);
    } else {
      root.style.removeProperty("--a");
      root.style.removeProperty("--b");
      root.dataset.look = value;
    }
    store.set("omnity:look", value);
    $$("[data-look]").forEach((r) => (r.checked = r.value === value));
    if (value.startsWith("#")) $$("[data-look-custom]").forEach((c) => (c.value = value));
  }

  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-look]")) applyLook(e.target.value);
  });
  document.addEventListener("input", (e) => {
    if (e.target.matches("[data-look-custom]")) applyLook(e.target.value);
  });

  /* ---------- the menu, rebuilt ---------- */

  // How each MM2 feature is drawn. Anything not listed is a toggle.
  const CONTROL = {
    "Knife Throw": ["button", "Throw"],
    "Grab Gun": ["button", "Grab"],
    "Fling Murderer": ["button", "Fling"],
    "Fling Sheriff": ["button", "Fling"],
    Flick: ["button", "Flick"],
    Keybinds: ["key", "Q"],
    "Gold Bomb Jump": ["button", "Jump"],
    "Normal Bomb Jump": ["button", "Jump"],
    "Adjustable Glitch Speed": ["range", 1, 10, 6, ""],
    "Stretched Resolution": ["range", 50, 100, 80, "%"],
    "Velocity Cap": ["range", 16, 100, 50, ""],
    "Role Filter": ["choice", "All", "Murderer", "Sheriff"],
    "Custom Role Colours": ["roles"],
    "Skybox Presets": ["choice", "Default", "Night", "Dusk"],
    "Custom Skybox ID": ["text"],
    "Crosshair Presets": ["choice", "Dot", "Cross", "Ring"],
    "Custom Crosshair ID": ["text"],
    "FOV Slider": ["range", 70, 120, 90, ""],
    "6 Themes": ["themes"],
    "Custom Accent Colour": ["accent"],
    "Infinite Yield Loader": ["button", "Load"],
  };
  const ON_AT_START = new Set(["Auto Shoot Murderer", "Ping Prediction", "Role ESP", "Dropped Gun ESP", "Auto-Saved Settings", "Live Players, Ping & FPS"]);
  const ROLES = [["Murderer", "#ff3b4e"], ["Sheriff", "#3f7bff"], ["Innocent", "#45d98e"]];

  function row(f, saved) {
    const id = "f-" + slug(f);
    const [type, ...opt] = CONTROL[f] || ["toggle"];
    const v = saved[f];
    const name = `<span class="row-name" id="${id}-l">${esc(f)}</span>`;
    switch (type) {
      case "button":
        return `<div class="row">${name}<button class="btn btn-xs" type="button" aria-label="${esc(f)}">${opt[0]}</button></div>`;
      case "key":
        return `<div class="row">${name}<button class="key" type="button" data-f="${esc(f)}" aria-describedby="${id}-l" title="Click, then press a key">${esc(v ?? opt[0])}</button></div>`;
      case "range": {
        const [min, max, start, unit] = opt;
        const val = v ?? start;
        return `<div class="row"><label class="row-name" for="${id}">${esc(f)}</label><span class="range"><input type="range" id="${id}" data-f="${esc(f)}" data-unit="${unit}" min="${min}" max="${max}" value="${val}"><output for="${id}">${val}${unit}</output></span></div>`;
      }
      case "choice": {
        const cur = v ?? opt[0];
        const items = opt.map((o) => `<label><input type="radio" name="${id}" value="${esc(o)}" data-f="${esc(f)}" ${o === cur ? "checked" : ""}><span>${esc(o)}</span></label>`).join("");
        return `<div class="row">${name}<span class="seg" role="radiogroup" aria-labelledby="${id}-l">${items}</span></div>`;
      }
      case "text":
        return `<div class="row"><label class="row-name" for="${id}">${esc(f)}</label><input class="field" id="${id}" name="${id}" data-f="${esc(f)}" placeholder="rbxassetid://" value="${esc(v ?? "")}" spellcheck="false" autocomplete="off"></div>`;
      case "roles": {
        const pickers = ROLES.map(([role, hex]) => `<input class="color" type="color" data-f="${esc(f)}" data-role="${role}" value="${esc(saved[`${f}:${role}`] ?? hex)}" aria-label="${role} colour" title="${role}">`).join("");
        return `<div class="row">${name}<span class="roles">${pickers}</span></div>`;
      }
      case "themes":
        return `<div class="row row-wrap">${name}${looks("menu", false)}</div>`;
      case "accent": {
        const cur = currentLook();
        return `<div class="row"><label class="row-name" for="${id}">${esc(f)}</label><input class="color" type="color" id="${id}" data-look-custom value="${cur.startsWith("#") ? cur : "#4a7bff"}"></div>`;
      }
      default:
        return `<label class="row" for="${id}"><span class="row-name">${esc(f)}</span><input class="switch" type="checkbox" role="switch" id="${id}" data-f="${esc(f)}" ${(v ?? ON_AT_START.has(f)) ? "checked" : ""}></label>`;
    }
  }

  function renderMenu() {
    const win = $("#menu");
    if (!win) return;
    const g = flagship;
    if (!g?.features) return win.closest("section")?.remove();

    const saved = store.get("omnity:menu", {});
    const groups = Object.entries(g.features);
    win.innerHTML =
      `<div class="win-head"><img src="${esc(logo)}" alt="" width="26" height="26">` +
      `<div class="win-title">Omnity Hub<small>${esc(g.game)}</small></div>` +
      `<span class="win-count">${featuresOf(g).length} features</span></div>` +
      `<div class="win-body"><div class="tabs" role="tablist" aria-label="${esc(g.game)} menu">` +
      groups.map(([tab, list], i) =>
        `<button class="tab" type="button" role="tab" id="tab-${i}" aria-controls="panel-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${ICON[tab] || ICON.Menu}<span>${esc(tab)}</span><span class="n">${list.length}</span></button>`,
      ).join("") +
      `</div>` +
      groups.map(([, list], i) =>
        `<div class="panel" role="tabpanel" id="panel-${i}" aria-labelledby="tab-${i}" tabindex="0" ${i ? "hidden" : ""}>${list.map((f) => row(f, saved)).join("")}</div>`,
      ).join("") +
      `</div>`;

    const tabs = $$(".tab", win);
    const select = (i, focus) => {
      tabs.forEach((t, j) => {
        t.setAttribute("aria-selected", String(i === j));
        t.tabIndex = i === j ? 0 : -1;
        $(`#panel-${j}`, win).hidden = i !== j;
      });
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", (e) => {
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (step) { e.preventDefault(); select((i + step + tabs.length) % tabs.length, true); }
        if (e.key === "Home") { e.preventDefault(); select(0, true); }
        if (e.key === "End") { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });

    const save = (key, value) => { saved[key] = value; store.set("omnity:menu", saved); };
    win.addEventListener("input", (e) => {
      const t = e.target;
      const f = t.dataset.f;
      if (!f) return;
      if (t.type === "checkbox") save(f, t.checked);
      else if (t.type === "range") { t.nextElementSibling.textContent = t.value + t.dataset.unit; save(f, Number(t.value)); }
      else if (t.type === "color") save(`${f}:${t.dataset.role}`, t.value);
      else save(f, t.value);
    });

    // Keybinds: click the key, then press the one you want. Escape keeps the old one.
    win.addEventListener("click", (e) => {
      const key = e.target.closest(".key");
      if (!key || key.classList.contains("is-listening")) return;
      const before = key.textContent;
      key.classList.add("is-listening");
      key.textContent = "Press a key";
      const stop = (label) => {
        key.textContent = label;
        key.classList.remove("is-listening");
        key.removeEventListener("keydown", pick);
        key.removeEventListener("blur", cancel);
      };
      const cancel = () => stop(before);
      const pick = (ev) => {
        if (ev.key === "Tab") return cancel();
        ev.preventDefault();
        if (ev.key === "Escape") return cancel();
        const label = ev.key === " " ? "Space" : ev.key.length === 1 ? ev.key.toUpperCase() : ev.key;
        stop(label);
        save(key.dataset.f, label);
      };
      key.addEventListener("keydown", pick);
      key.addEventListener("blur", cancel);
    });

    const looksBox = $("#looks");
    if (looksBox) looksBox.innerHTML = looks("showcase", true);
  }

  /* ---------- catalog ---------- */

  const metaLine = (g, isLive) => {
    const count = playingText(g);
    const dot = isLive ? '<span class="dot" aria-hidden="true"></span>' : "";
    return `<p class="tile-meta">${dot}${count || (isLive ? "Live" : esc(g.genre))}</p>`;
  };

  function liveTile(g, hits) {
    const href = pageOf(g);
    const hitsLine = hits.length ? `<p class="tile-hits">Has ${hits.map((h) => `<b>${esc(h)}</b>`).join(", ")}</p>` : "";
    const picture = coverButton(g);
    const name = `<h3 class="tile-name"><a href="${href}">${esc(g.game)}</a></h3>`;

    if (g.featured) {
      const action = g.load ? copyButton(g, "Copy script", "btn-sm") : discordButton("Get it on Discord");
      return (
        `<article class="tile tile-feature">${picture}<div class="tile-body">` +
        `<div>${name}${metaLine(g, true)}</div>${hitsLine}` +
        `<div class="tile-acts">${action}<a class="btn btn-sm" href="${href}">View script</a></div>` +
        `</div></article>`
      );
    }
    const action = g.load ? copyButton(g, "Copy", "btn-sm") : discordButton("Discord");
    return `<article class="tile">${picture}<div class="tile-row"><div class="tile-text">${name}${metaLine(g, true)}</div>${action}</div>${hitsLine}</article>`;
  }

  const soonTile = (g) =>
    `<article class="tile tile-soon">${coverButton(g)}<div class="tile-text"><h3 class="tile-name">${esc(g.game)}</h3>${metaLine(g, false)}</div></article>`;

  const askTile = () =>
    `<a class="ask" href="${esc(discord)}" ${ext}><strong>More games on the way</strong>` +
    `<span class="ask-p">Tell us which one you want next.</span><span class="ask-cta">${ICON.discord}Request a game</span></a>`;

  function renderCatalog() {
    const input = $("#q");
    const liveBox = $("#live");
    if (!input || !liveBox) return;

    const draw = () => {
      const raw = input.value.trim();
      const q = raw.toLowerCase();
      // null means no match; an array lists the features that matched
      const match = (g) => {
        if (!q) return [];
        const hits = featuresOf(g).filter((f) => f.toLowerCase().includes(q));
        const own = [g.game, g.genre, g.title].join(" ").toLowerCase().includes(q);
        return own || hits.length ? hits : null;
      };
      const L = live.map((g) => [g, match(g)]).filter(([, h]) => h);
      const S = soon.map((g) => [g, match(g)]).filter(([, h]) => h);

      liveBox.innerHTML = L.map(([g, h]) => liveTile(g, h)).join("");
      // The featured tile soaks up whatever the others leave over, so no row ends on a lone tile.
      const rest = L.filter(([g]) => !g.featured).length;
      const featured = L.some(([g]) => g.featured);
      liveBox.dataset.rest = featured ? String(rest % 4) : "none";
      liveBox.dataset.odd = featured ? String(rest % 2) : "none";

      $("#soon").innerHTML = S.map(([g]) => soonTile(g)).join("") + (S.length ? askTile() : "");
      $("#live-n").textContent = L.length;
      $("#soon-n").textContent = S.length;
      $("#live-group").hidden = !L.length;
      $("#soon-group").hidden = !S.length;

      const empty = $("#empty");
      empty.hidden = L.length + S.length > 0;
      if (!empty.hidden) {
        empty.innerHTML = `Nothing matches <strong>${esc(raw)}</strong> yet. <a href="${esc(discord)}" ${ext}>Request it in the Discord</a> and the most requested games get built next.`;
      }
    };

    // The search lives in the URL, so a search like ?q=esp can be shared.
    const sync = () => {
      const url = new URL(location.href);
      if (input.value.trim()) url.searchParams.set("q", input.value.trim());
      else url.searchParams.delete("q");
      history.replaceState(null, "", url);
    };
    input.addEventListener("input", () => { draw(); sync(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && input.value) { input.value = ""; draw(); sync(); }
    });
    input.form?.addEventListener("submit", (e) => {
      e.preventDefault();
      $("#scripts").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
    input.value = new URLSearchParams(location.search).get("q") || "";
    draw();
    redraws.push(draw);

    const note = $("#live-note");
    if (note) redraws.push(() => (note.hidden = !Object.keys(roblox).length));
  }

  /* ---------- quick look ---------- */

  const peek = $("#peek");
  let peeking = null;

  const peekMeta = (g) =>
    (g.status === "live" ? '<span><i class="dot" aria-hidden="true"></i>Live</span>' : '<span><i class="soon-dot" aria-hidden="true"></i>Coming soon</span>') +
    (playingText(g) ? `<span>${playingText(g)}</span>` : "") +
    "<span>Keyless</span>" +
    (g.status === "live" ? "<span>Works on mobile</span>" : "");

  function peekHTML(g) {
    const isLive = g.status === "live";
    const groups = Object.entries(g.features || {});
    const n = featuresOf(g).length;

    let main;
    if (!isLive) {
      main =
        `<p class="peek-text">${esc(g.game)} is on the list. Want it sooner? The most requested games get built next.</p>` +
        `<div class="peek-acts">${discordButton("Request it on Discord", "btn-sm btn-primary")}${robloxButton(g)}</div>`;
    } else {
      const line = g.load
        ? `<div class="loader"><pre class="code" translate="no"><code>${lua(g.load)}</code></pre>${copyButton(g, "Copy")}</div>`
        : `<p class="peek-text">Get the ${esc(g.game)} loader from the Discord. It is one line, and there is no key.</p>`;
      const list = n
        ? `<div class="peek-feats">${groups.map(([tab, items]) => `<div><h3>${esc(tab)}<span>${items.length}</span></h3><ul>${items.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>`).join("")}</div>`
        : "";
      main =
        line + list +
        `<div class="peek-acts">${g.load ? "" : discordButton("Get it on Discord", "btn-sm btn-primary")}` +
        `<a class="btn btn-sm" href="${pageOf(g)}">View full page</a>${robloxButton(g)}</div>`;
    }

    return (
      `<div class="peek-card">` +
      `<button class="peek-close" type="button" data-close aria-label="Close">${ICON.close}</button>` +
      `<div class="peek-cover">${cover(g, true)}</div>` +
      `<div class="peek-body"><header>` +
      `<h2 class="peek-title" id="peek-title">${esc(g.game)}</h2><p class="peek-meta">${peekMeta(g)}</p>` +
      (g.title ? `<p class="peek-sub">${esc(g.title)}</p>` : "") +
      `</header>${main}</div></div>`
    );
  }

  function openPeek(id, remember = true) {
    const g = games.find((x) => x.id === id);
    if (!peek || !g) return;
    peeking = g;
    peek.innerHTML = peekHTML(g);
    peek.classList.remove("is-closing");
    if (!peek.open) peek.showModal();
    if (remember) history.replaceState(null, "", `#${g.id}`); // the link opens straight to it
  }

  // Drops the #game from the address once the quick look is gone.
  function forget() {
    peeking = null;
    if (games.some((g) => `#${g.id}` === location.hash)) history.replaceState(null, "", location.pathname + location.search);
  }

  function closePeek() {
    if (!peek?.open || peek.classList.contains("is-closing")) return;
    const done = () => { peek.classList.remove("is-closing"); peek.close(); forget(); };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
    peek.classList.add("is-closing"); // plays the drop-away, then closes
    setTimeout(done, 180);
  }

  if (peek) {
    document.addEventListener("click", (e) => {
      const opener = e.target.closest("[data-peek]");
      if (opener) openPeek(opener.dataset.peek);
    });
    // a click on the dimmed backdrop lands on the dialog itself
    peek.addEventListener("click", (e) => {
      if (e.target === peek || e.target.closest("[data-close]")) closePeek();
    });
    peek.addEventListener("cancel", (e) => { e.preventDefault(); closePeek(); });
    peek.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); closePeek(); } });
    peek.addEventListener("close", forget); // native closes too; the event can lag in a hidden tab
    // counts and thumbnails can land while it is open
    redraws.push(() => {
      if (!peek.open || !peeking) return;
      $(".peek-meta", peek).innerHTML = peekMeta(peeking);
      if (!peeking.image) $(".peek-cover", peek).innerHTML = cover(peeking, true);
    });
  }

  /* ---------- script page ---------- */

  function renderDetail() {
    const root = $("#detail");
    if (!root) return;
    const back = `<a class="back" href="index.html#scripts">${ICON.back}All scripts</a>`;
    const g = games.find((x) => x.id === new URLSearchParams(location.search).get("id"));

    if (!g) {
      document.title = "Script not found | Omnity Hub";
      root.innerHTML = `${back}<header class="d-head"><h1 class="display">No script here</h1><p class="d-title">That link does not match a game on Omnity. Pick one from the list.</p></header><a class="btn btn-primary" href="index.html#scripts">Browse scripts</a>`;
      return;
    }

    const isLive = g.status === "live";
    const groups = Object.entries(g.features || {});
    const n = featuresOf(g).length;
    document.title = `${g.game} Script${g.title ? ` | ${g.title}` : ""} | Omnity Hub`;
    $('meta[name="description"]')?.setAttribute("content", g.blurb || `${g.game} script on Omnity Hub. Free, keyless, works on mobile.`);

    const script = !isLive
      ? `<section class="d-block"><h2>In the works</h2><p class="d-text">${esc(g.game)} is on the list. Want it sooner? Say so in the Discord. The most requested games get built next.</p><a class="btn btn-primary" href="${esc(discord)}" ${ext}>${ICON.discord}Request it on Discord</a></section>`
      : g.load
        ? `<section class="d-block"><h2>Script</h2><div class="loader"><pre class="code" translate="no"><code>${lua(g.load)}</code></pre>${copyButton(g, "Copy")}</div>` +
          `<ol class="run"><li>Copy the line above.</li><li>Join ${esc(g.game)} and open your executor.</li><li>Paste the line and press Execute.</li><li>The menu opens in the corner. Turn on what you want, it remembers.</li></ol></section>`
        : `<section class="d-block"><h2>Script</h2><p class="d-text">Get the ${esc(g.game)} loader from the Discord. It is one line, and there is no key.</p><a class="btn btn-primary" href="${esc(discord)}" ${ext}>${ICON.discord}Get it on Discord</a></section>`;

    const feats = !isLive
      ? ""
      : n
        ? `<section class="d-block"><div class="d-block-head"><h2>Features <span>${n}</span></h2>` +
          `<label class="search"><span class="sr">Filter features</span>${ICON.search}<input id="fq" name="fq" type="search" placeholder="Filter features…" autocomplete="off" spellcheck="false"></label></div>` +
          `<div class="feats">${groups.map(([tab, list]) => `<div class="feat-group"><h3>${esc(tab)}<span>${list.length}</span></h3><ul>${list.map((f) => `<li data-name="${esc(f)}">${esc(f)}</li>`).join("")}</ul></div>`).join("")}</div>` +
          `<p class="d-text" id="fq-empty" hidden></p></section>`
        : `<section class="d-block"><h2>Features</h2><p class="d-text">The feature list for ${esc(g.game)} is on its way to this page.</p></section>`;

    const initials = g.game.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 3).toUpperCase();
    const side = () =>
      `<section class="side-card">` +
      `<div class="game-id">${g.icon ? `<img src="${esc(g.icon)}" alt="" width="54" height="54">` : `<span class="glyph tone-${tone(g)}" aria-hidden="true">${esc(initials)}</span>`}<div><strong>${esc(g.game)}</strong><span>${esc(g.genre)}</span></div></div>` +
      `<dl class="dl"><dt>Status</dt><dd>${isLive ? "Live" : "Coming soon"}</dd>` +
      (playingText(g) ? `<dt>On Roblox now</dt><dd>${playingText(g)}</dd>` : "") +
      (n ? `<dt>Features</dt><dd>${n}</dd>` : "") +
      `<dt>Key</dt><dd>None</dd><dt>Mobile</dt><dd>${isLive ? "Supported" : "Planned"}</dd>` +
      (g.placeId ? `<dt>Place ID</dt><dd>${Number(g.placeId)}</dd>` : "") +
      `</dl>` +
      (isLive ? `<p class="side-note">Works with any executor that supports loadstring and HTTP requests.</p>` : "") +
      `<div class="side-acts">` +
      (g.placeId ? `<a class="btn btn-sm" href="https://www.roblox.com/games/${Number(g.placeId)}" ${ext}>Open on Roblox ${ICON.out}</a>` : "") +
      `<a class="btn btn-sm" href="${esc(discord)}" ${ext}>${ICON.discord}Discord</a></div>` +
      `</section>`;

    root.innerHTML =
      back +
      `<header class="d-head"><h1 class="display">${esc(g.game)}</h1>${g.title ? `<p class="d-title">${esc(g.title)}</p>` : ""}` +
      `<p class="d-status">${isLive ? '<span><i class="dot" aria-hidden="true"></i>Live</span><span>Keyless</span><span>Works on mobile</span>' : '<span><i class="soon-dot" aria-hidden="true"></i>Coming soon</span><span>Keyless</span>'}</p></header>` +
      `<div class="d-grid"><div class="d-main"><div id="d-cover">${cover(g, true)}</div>${script}` +
      (g.blurb ? `<section class="d-block"><h2>About</h2><p class="d-text">${esc(g.blurb)}</p></section>` : "") +
      `${feats}</div><aside class="d-side" id="d-side">${side()}</aside></div>`;

    // Live numbers and the Roblox thumbnail arrive after the page draws.
    redraws.push(() => {
      $("#d-side").innerHTML = side();
      if (!g.image) $("#d-cover").innerHTML = cover(g, true);
    });

    const fq = $("#fq");
    if (!fq) return;
    const items = $$(".feat-group li", root);
    fq.addEventListener("input", () => {
      const q = fq.value.trim().toLowerCase();
      let shown = 0;
      items.forEach((li) => {
        const name = li.dataset.name;
        const at = name.toLowerCase().indexOf(q);
        li.hidden = q !== "" && at < 0;
        li.innerHTML = q && at >= 0 ? `${esc(name.slice(0, at))}<mark>${esc(name.slice(at, at + q.length))}</mark>${esc(name.slice(at + q.length))}` : esc(name);
        if (!li.hidden) shown++;
      });
      $$(".feat-group", root).forEach((group) => (group.hidden = !$$("li:not([hidden])", group).length));
      const none = $("#fq-empty");
      none.hidden = shown > 0;
      if (!shown) none.textContent = `No feature matches “${fq.value.trim()}”.`;
    });
    fq.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && fq.value) { fq.value = ""; fq.dispatchEvent(new Event("input")); }
    });
  }

  /* ---------- live data ---------- */

  // One batched call for counts and one for thumbnails, cached for five minutes
  // per visitor. If RoProxy is down the page keeps its drawn covers and no counts.
  async function loadRoblox() {
    const ids = games.map((g) => g.universeId).filter(Number.isInteger);
    if (!ids.length) return;
    try {
      const cached = JSON.parse(sessionStorage.getItem("omnity:roblox") || "null");
      if (cached && Date.now() - cached.at < 5 * 60 * 1000) {
        Object.assign(roblox, cached.data);
        return redraws.forEach((fn) => fn());
      }
    } catch { /* no session storage: just fetch */ }

    const list = ids.join(",");
    const get = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const [info, thumbs] = await Promise.all([
      get(`https://games.roproxy.com/v1/games?universeIds=${list}`),
      get(`https://thumbnails.roproxy.com/v1/games/multiget/thumbnails?universeIds=${list}&countPerUniverse=1&defaults=true&size=768x432&format=Webp&isCircular=false`),
    ]);
    for (const d of info?.data || []) {
      if (Number.isFinite(d.playing)) (roblox[d.id] ||= {}).playing = d.playing;
    }
    for (const t of thumbs?.data || []) {
      const shot = t.thumbnails?.[0];
      // only accept pictures served from Roblox's own CDN
      if (shot?.state === "Completed" && /^https:\/\/[a-z0-9.-]+\.rbxcdn\.com\//.test(shot.imageUrl)) {
        (roblox[t.universeId] ||= {}).thumb = shot.imageUrl;
      }
    }
    if (!Object.keys(roblox).length) return;
    try { sessionStorage.setItem("omnity:roblox", JSON.stringify({ at: Date.now(), data: roblox })); } catch { /* fine */ }
    redraws.forEach((fn) => fn());
  }

  /* ---------- page chrome ---------- */

  function chrome() {
    $$("[data-discord]").forEach((a) => (a.href = discord));
    $$("[data-discord-text]").forEach((a) => (a.textContent = discord.replace(/^https?:\/\//, "")));

    const bar = $(".bar");
    const onScroll = () => bar?.classList.toggle("is-stuck", scrollY > 8);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Mobile menu: native popover, with a class fallback for older browsers.
    const pop = $("#navpop");
    const toggle = $(".menu-btn");
    if (pop && toggle && !("popover" in HTMLElement.prototype)) {
      toggle.removeAttribute("popovertarget");
      toggle.addEventListener("click", () => pop.classList.toggle("is-open"));
    }
    $$("#navpop a").forEach((a) =>
      a.addEventListener("click", () => {
        pop.classList.remove("is-open");
        if (pop.matches?.(":popover-open")) pop.hidePopover();
      }),
    );

    // "/" jumps to search, unless you are typing somewhere already.
    addEventListener("keydown", (e) => {
      if (e.defaultPrevented || e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.activeElement?.matches("input, textarea, select, [contenteditable]")) return;
      const field = $("#q") || $("#fq");
      if (!field) return;
      e.preventDefault();
      field.focus();
    });
  }

  // Live member count, shown only when Discord answers.
  async function discordCount() {
    const el = $("#discord-count");
    if (!el) return;
    const code = discord.replace(/\/+$/, "").split("/").pop();
    try {
      const res = await fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.approximate_member_count) return;
      const fmt = new Intl.NumberFormat("en");
      el.textContent = `${fmt.format(data.approximate_member_count)} members, ${fmt.format(data.approximate_presence_count)} online right now.`;
      el.hidden = false;
    } catch { /* offline or blocked: the count just stays hidden */ }
  }

  chrome();
  renderMenu();
  renderCatalog();
  renderDetail();
  // A link like index.html#mm2 opens that game's quick look, on load or later.
  const followHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (games.some((g) => g.id === id)) openPeek(id, false);
    else closePeek();
  };
  followHash();
  addEventListener("hashchange", followHash);
  loadRoblox();
  discordCount();
})();
