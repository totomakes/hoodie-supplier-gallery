/* Hoodie Supplier Gallery — filters & render */
(function () {
  const data = GALLERY_DATA;
  const suppliers = data.suppliers || [];
  const specialists = data.stanley_stella_specialists || [];
  const recs = data.recommendations || {};

  let activeFilter = "all";

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isLargeJumbo(s) {
    const t = (s.max_back_print || "").toLowerCase();
    const hasJumbo = /\bjumbo\b/.test(t) && !/\bnot\s+jumbo\b/.test(t);
    return (
      hasJumbo ||
      /24\s*[""″]?\s*[×x]\s*24/.test(t) ||
      /\bxxl\b/.test(t) ||
      /38\s*[×x]\s*46/.test(t) ||
      /36\s*[×x]\s*47/.test(t) ||
      /15[.\d]*\s*[×x]\s*18/.test(t) ||
      /~?\s*16\s*[×x]\s*18/.test(t) ||
      /380\s*[×x]\s*480/.test(t)
    );
  }

  function isTrueScreen(s) {
    const methods = (s.print_methods || []).join(" ").toLowerCase();
    return (
      s.category === "screen-print-fulfillment" ||
      methods.includes("screen print") ||
      methods.includes("bulk screen")
    );
  }

  function isPod(s) {
    return s.category === "pod" || s.category === "hybrid";
  }

  function matchesFilter(s, filter) {
    if (filter === "all") return true;
    if (filter === "stanley-stella") return !!s.stanley_stella;
    if (filter === "large-jumbo") return isLargeJumbo(s);
    if (filter === "true-screen") return isTrueScreen(s);
    if (filter === "pod") return isPod(s);
    return true;
  }

  function placeholderSVG() {
    return `<div class="placeholder" aria-hidden="true">
      <svg viewBox="0 0 64 64"><path d="M18 22h28v28H18z" stroke-linejoin="round"/><path d="M22 18h8v6h-8zm12 0h8v6h-8M24 36c4 6 12 6 16 0" stroke-linecap="round"/></svg>
      <span>No preview</span>
    </div>`;
  }

  function mediaHTML(s) {
    const urls = s.image_urls || [];
    if (!urls.length) {
      return `<div class="card-media">${placeholderSVG()}
        <div class="score-badge">${esc(s.rank_score)}<small>/10</small></div>
      </div>`;
    }
    const main = urls[0];
    const thumbs =
      urls.length > 1
        ? `<div class="thumbs" role="tablist">${urls
            .map(
              (u, i) =>
                `<button type="button" class="${i === 0 ? "active" : ""}" data-src="${esc(u)}" aria-label="Image ${i + 1}">
              <img src="${esc(u)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">
            </button>`
            )
            .join("")}</div>`
        : "";
    return `<div class="card-media">
      <img class="main-img" src="${esc(main)}" alt="${esc(s.name)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
      ${thumbs}
      <div class="score-badge">${esc(s.rank_score)}<small>/10</small></div>
    </div>`;
  }

  function cardHTML(s, opts = {}) {
    const discontinued =
      opts.discontinued ||
      (s.id && String(s.id).includes("discontinued")) ||
      /discontinued/i.test(s.name || "");
    const pros = (s.pros || []).slice(0, 2);
    const cons = (s.cons || []).slice(0, 1);
    const sources = (s.source_urls || []).slice(0, 2);

    const badges = [];
    if (s.stanley_stella) badges.push('<span class="badge ss">S/S</span>');
    if (s.category)
      badges.push(`<span class="badge cat">${esc(s.category)}</span>`);
    if (discontinued)
      badges.push('<span class="badge discontinued">Discontinued</span>');

    return `<article class="card ${discontinued ? "discontinued-card" : ""}" data-id="${esc(s.id)}">
      ${mediaHTML(s)}
      <div class="card-body">
        <div class="card-top">
          <h3>${esc(s.name)}</h3>
          <div class="badges">${badges.join("")}</div>
        </div>
        <div class="print-size">
          <div class="label">Max back print</div>
          <div class="value">${esc(s.max_back_print)}</div>
        </div>
        <div class="best-for">
          <strong>Best for</strong>
          ${esc(s.best_for)}
        </div>
        <ul class="pros-cons">
          ${pros.map((p) => `<li class="pro">${esc(p)}</li>`).join("")}
          ${cons.map((c) => `<li class="con">${esc(c)}</li>`).join("")}
        </ul>
        <div class="card-links">
          ${
            s.website
              ? `<a href="${esc(s.website)}" target="_blank" rel="noopener noreferrer">Website ↗</a>`
              : ""
          }
          ${sources
            .map(
              (u, i) =>
                `<a class="src" href="${esc(u)}" target="_blank" rel="noopener noreferrer">Source ${i + 1}</a>`
            )
            .join("")}
        </div>
      </div>
    </article>`;
  }

  function bindMedia(root) {
    $$(".card-media", root).forEach((media) => {
      const main = $(".main-img", media);
      if (!main) return;
      $$(".thumbs button", media).forEach((btn) => {
        btn.addEventListener("click", () => {
          const src = btn.getAttribute("data-src");
          if (src) main.src = src;
          $$(".thumbs button", media).forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });
    });
  }

  function renderMain() {
    const grid = $("#supplier-grid");
    const countEl = $("#visible-count");
    const ranked = suppliers
      .filter((s) => s.rank_score >= 3)
      .filter((s) => matchesFilter(s, activeFilter))
      .sort((a, b) => b.rank_score - a.rank_score || a.name.localeCompare(b.name));

    if (!ranked.length) {
      grid.innerHTML = `<div class="empty">No suppliers match this filter.</div>`;
    } else {
      grid.innerHTML = ranked.map((s) => cardHTML(s)).join("");
      bindMedia(grid);
    }
    countEl.innerHTML = `<strong>${ranked.length}</strong> shown · sorted by rank`;
  }

  function renderSpecialists() {
    const grid = $("#ss-grid");
    const sorted = [...specialists].sort(
      (a, b) => b.rank_score - a.rank_score || a.name.localeCompare(b.name)
    );
    grid.innerHTML = sorted
      .map((s) =>
        cardHTML(s, {
          discontinued:
            /discontinued/i.test(s.name || "") ||
            String(s.id || "").includes("discontinued"),
        })
      )
      .join("");
    bindMedia(grid);
  }

  function renderRecs() {
    const el = $("#recs");
    el.innerHTML = `
      <div class="rec-block featured">
        <h3>Best overall</h3>
        <p>${esc(recs.best_overall)}</p>
      </div>
      <div class="rec-block">
        <h3>Best Stanley/Stella</h3>
        <p>${esc(recs.best_stanley_stella)}</p>
      </div>
      <div class="rec-block">
        <h3>Best true large screen</h3>
        <p>${esc(recs.best_true_large_screen)}</p>
      </div>
      <div class="rec-block">
        <h3>Runner-ups</h3>
        <ul>${(recs.runner_ups || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      </div>
      <div class="rec-block avoid">
        <h3>Do not prioritize</h3>
        <ul>${(recs.do_not_prioritize_for_this_use_case || [])
          .map((x) => `<li>${esc(x)}</li>`)
          .join("")}</ul>
      </div>`;
  }

  function renderLow() {
    const list = $("#low-list");
    const low = suppliers
      .filter((s) => s.rank_score < 3)
      .sort((a, b) => b.rank_score - a.rank_score);
    $("#low-count").textContent = low.length;
    list.innerHTML = low
      .map(
        (s) => `<div class="low-item">
        <span class="name">${esc(s.name)}</span>
        <span class="score">${esc(s.rank_score)}/10</span>
        <span class="why">${esc(s.best_for)}</span>
      </div>`
      )
      .join("");
  }

  function renderHero() {
    $("#research-date").textContent = data.research_date || "";
    $("#use-case").textContent = data.target_use_case || "";
    // Condensed reality check — first ~2 sentences / key facts
    const reality = data.oversized_print_reality || "";
    const condensed = reality.split(/(?<=\.)\s+/).slice(0, 3).join(" ");
    $("#reality-text").textContent = condensed;
  }

  function renderNotes() {
    const ul = $("#notes-list");
    ul.innerHTML = (data.notes || []).map((n) => `<li>${esc(n)}</li>`).join("");
  }

  function initFilters() {
    $$(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        activeFilter = chip.dataset.filter;
        $$(".chip").forEach((c) => c.classList.toggle("active", c === chip));
        renderMain();
      });
    });
  }

  function init() {
    renderHero();
    initFilters();
    renderMain();
    renderSpecialists();
    renderRecs();
    renderLow();
    renderNotes();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
