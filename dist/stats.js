const $ = (id) => document.getElementById(id);
let view = "user",
  data,
  query,
  controller;
const number = (v) => Number(v).toLocaleString();
function el(tag, text, className) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
}
function link(text, href) {
  const e = el("a", text);
  e.href = href;
  return e;
}
function card(label, value) {
  const e = el("div", undefined, "stats-card");
  e.append(el("strong", value), el("span", label));
  return e;
}
function verificationBadge(reason) {
  const reasons = { "scratch-team": "Scratch Team (Scratch API)", followers: "More than 1,000 followers", community: "Community selection" };
  if (!reasons[reason]) return null;
  const badge = el("span", "✓", "website-verified");
  badge.title = `BetterScratch verified · ${reasons[reason]}. This is a BetterScratch badge, not official Scratch verification.`;
  badge.setAttribute("aria-label", badge.title);
  return badge;
}
function profileLink(name, url, reason) {
  const a = link(
    name,
    `https://scratch.mit.edu/users/${encodeURIComponent(name)}/`,
  );
  a.className = "stats-profile-identity";
  if (
    typeof url === "string" &&
    /^https:\/\/cdn2\.scratch\.mit\.edu\/get_image\/user\/[1-9]\d*_90x90\.png$/.test(
      url,
    )
  ) {
    const img = el("img");
    img.src = url;
    img.alt = "";
    img.width = 40;
    img.height = 40;
    img.className = "stats-avatar";
    img.loading = "lazy";
    img.addEventListener("error", () => {
      img.hidden = true;
    });
    a.prepend(img);
  }
  const badge = verificationBadge(reason || (["-technify-", "viralgoose"].includes(name.toLowerCase()) ? "community" : null));
  if (badge) a.append(badge);
  return a;
}
function render() {
  const root = $("stats-results");
  root.replaceChildren();
  if (!data) return;
  if (data.kind === "user") {
    const h = el("h2");
    h.append(profileLink(data.username, data.avatarUrl, data.verificationReason));
    root.append(h);
    const joined = new Date(data.joined);
    const meta = [
      data.country,
      data.joined && !Number.isNaN(joined.getTime())
        ? `Joined ${joined.toLocaleDateString()}`
        : "",
    ]
      .filter(Boolean)
      .join(" · ");
    root.append(el("p", meta, "coverage"));
    const cards = el("div", undefined, "stats-cards");
    const rows = data.projects;
    cards.append(
      card(
        data.projectsComplete
          ? "Returned public projects"
          : "Public projects in sample",
        number(rows.length),
      ),
      card(
        "Followers",
        number(data.followers) + (data.followersComplete ? "" : "+"),
      ),
      ...[
        ["Views", "views"],
        ["Loves", "loves"],
        ["Favorites", "favorites"],
      ].map(([label, key]) =>
        card(
          `${label} across loaded projects`,
          number(rows.reduce((n, p) => n + p[key], 0)),
        ),
      ),
    );
    root.append(cards);
    root.append(
      el(
        "p",
        data.projectsComplete
          ? "Stats cover the returned public projects."
          : "Stats cover the first 40 returned projects, not this account’s lifetime totals.",
        "coverage",
      ),
    );
  } else
    root.append(
      el(
        "h2",
        data.mode === "trending" ? "Trending projects" : "Popular projects",
      ),
    );
  root.append(
    el(
      "p",
      `Checked ${new Date(data.checkedAt).toLocaleString()} · ${data.projects.length} projects · Order applies to this list only`,
      "coverage",
    ),
  );
  const rows = [...data.projects],
    sort = $("sort").value;
  if (sort !== "scratch") rows.sort((a, b) => b[sort] - a[sort] || a.id - b.id);
  if (!rows.length) {
    root.append(el("p", "No public projects were returned."));
    return;
  }
  const wrap = el("div", undefined, "table-scroll"),
    table = el("table"),
    head = el("thead"),
    heading = el("tr");
  for (const title of [
    "Rank in list",
    "Project",
    "Creator",
    "Views",
    "Loves",
    "Favorites",
  ]) {
    const th = el("th", title);
    th.scope = "col";
    heading.append(th);
  }
  head.append(heading);
  table.append(head);
  const body = el("tbody");
  rows.forEach((p, i) => {
    const row = el("tr");
    row.append(el("td", String(i + 1)));
    const project = el("td"),
      creator = el("td");
    project.append(link(p.title, `https://scratch.mit.edu/projects/${p.id}/`));
    creator.append(profileLink(p.author, p.avatarUrl));
    row.append(
      project,
      creator,
      ...[p.views, p.loves, p.favorites].map((v) => el("td", number(v))),
    );
    body.append(row);
  });
  table.append(body);
  wrap.append(table);
  root.append(wrap);
}
async function load(params) {
  controller?.abort();
  const active = new AbortController();
  controller = active;
  query = params;
  data = undefined;
  render();
  $("stats-results").setAttribute("aria-busy", "true");
  $("stats-status").hidden = false;
  $("stats-status").textContent = "Loading from Scratch…";
  $("retry").hidden = true;
  try {
    const r = await fetch(`/api/stats?${new URLSearchParams(params)}`, {
      signal: active.signal,
      credentials: "omit",
    });
    let result;
    try {
      result = await r.json();
    } catch {
      throw new Error(
        "The stats API isn’t running here. Use the website’s local dev server or deploy it to Vercel.",
      );
    }
    if (!r.ok)
      throw new Error(result.error || "Scratch stats are unavailable.");
    if (controller !== active) return;
    data = result;
    $("stats-status").hidden = true;
    render();
  } catch (e) {
    if (controller !== active || e.name === "AbortError") return;
    $("stats-status").textContent = e.message;
    $("retry").hidden = false;
  } finally {
    if (controller === active)
      $("stats-results").setAttribute("aria-busy", "false");
  }
}
$("user-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = $("username").value.trim();
  if (!/^[\w-]{1,30}$/.test(username)) return;
  load({ kind: "user", username });
});
for (const button of document.querySelectorAll("[data-view]"))
  button.addEventListener("click", () => {
    if (view === button.dataset.view) return;
    controller?.abort();
    controller = undefined;
    view = button.dataset.view;
    data = undefined;
    query = undefined;
    render();
    $("stats-results").setAttribute("aria-busy", "false");
    $("retry").hidden = true;
    for (const b of document.querySelectorAll("[data-view]"))
      b.setAttribute("aria-pressed", String(b === button));
    $("user-form").hidden = view !== "user";
    $("feed-controls").hidden = view !== "explore";
    if (view === "explore") load({ kind: "explore", mode: $("feed").value });
    else {
      $("stats-status").hidden = false;
      $("stats-status").textContent = "Enter a username to see public stats.";
    }
  });
$("feed").addEventListener("change", () =>
  load({ kind: "explore", mode: $("feed").value }),
);
$("sort").addEventListener("change", render);
$("retry").addEventListener("click", () => {
  if (query) load(query);
});
