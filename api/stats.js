// Only fixed public Scratch endpoints. No credentials, arbitrary URLs, or database.
const avatar = (id) =>
  Number.isSafeInteger(id) && id > 0
    ? `https://cdn2.scratch.mit.edu/get_image/user/${id}_90x90.png`
    : null;
const communityAccounts = new Set(["viralgoose", "-technify-"]);
const USERNAME = /^[\w-]{1,30}$/;
const counts = (p) =>
  ["views", "loves", "favorites"].every(
    (k) => Number.isSafeInteger(p.stats?.[k]) && p.stats[k] >= 0,
  );
export function projectRows(raw, owner = "", ownerId) {
  if (!Array.isArray(raw) || raw.length > 40)
    throw new Error("Unsupported project data.");
  const seen = new Set();
  return raw.flatMap((p) => {
    if (
      !p ||
      !Number.isSafeInteger(p.id) ||
      p.id < 1 ||
      typeof p.title !== "string" ||
      !USERNAME.test(p.author?.username ?? owner) ||
      !counts(p) ||
      seen.has(p.id)
    )
      return [];
    seen.add(p.id);
    return [
      {
        id: p.id,
        title: p.title,
        author: p.author?.username ?? owner,
        avatarUrl: avatar(p.author?.id ?? ownerId),
        views: p.stats.views,
        loves: p.stats.loves,
        favorites: p.stats.favorites,
      },
    ];
  });
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Use GET." });
  }
  const url = new URL(req.url, "https://betterscratch.invalid");
  const kind = url.searchParams.get("kind");
  const mode = url.searchParams.get("mode") || "trending";
  const username = url.searchParams.get("username") || "";
  if (
    !["user", "explore"].includes(kind) ||
    (kind === "user" && !USERNAME.test(username)) ||
    (kind === "explore" && !["trending", "popular"].includes(mode))
  )
    return res
      .status(400)
      .json({ error: "Choose a valid username or project feed." });
  const signal = AbortSignal.timeout(8000);
  async function read(path) {
    const r = await fetch(`https://api.scratch.mit.edu${path}`, {
      credentials: "omit",
      redirect: "error",
      signal,
    });
    if (!r.ok) {
      const e = new Error(
        r.status === 404
          ? "Scratch couldn’t find that account."
          : r.status === 429
            ? "Scratch is busy. Try again in a minute."
            : "Scratch stats are unavailable right now.",
      );
      e.status = r.status === 404 ? 404 : 503;
      throw e;
    }
    return r.json();
  }
  try {
    let data;
    if (kind === "explore") {
      const raw = await read(
        `/explore/projects?limit=40&offset=0&language=en&mode=${mode}&q=%2A`,
      );
      data = { kind, mode, projects: projectRows(raw), checkedAt: Date.now() };
    } else {
      const name = username.toLowerCase();
      const [user, raw, followers] = await Promise.all([
        read(`/users/${name}`),
        read(`/users/${name}/projects?limit=40&offset=0`),
        read(`/users/${name}/followers?limit=40&offset=0`),
      ]);
      if (
        !user ||
        !USERNAME.test(user.username ?? "") ||
        user.username.toLowerCase() !== name ||
        !Array.isArray(followers) ||
        followers.length > 40 ||
        !followers.every(
          (f) =>
            f &&
            Number.isSafeInteger(f.id) &&
            f.id > 0 &&
            USERNAME.test(f.username ?? ""),
        )
      )
        throw new Error("Unsupported profile data.");
      let verificationReason = communityAccounts.has(name) ? "community" : user.scratchteam === true ? "scratch-team" : null;
      if (!verificationReason && followers.length === 40) {
        // Offset 1000 proves there is a 1001st follower, matching the extension.
        try {
          const threshold = await read(`/users/${name}/followers?limit=1&offset=1000`);
          if (Array.isArray(threshold) && threshold.length === 1 && Number.isSafeInteger(threshold[0]?.id) && threshold[0].id > 0 && USERNAME.test(threshold[0].username ?? "")) verificationReason = "followers";
        } catch { /* Missing verification data must not prevent profile stats. */ }
      }
      const projects = projectRows(raw, user.username, user.id);
      data = {
        kind,
        username: user.username,
        avatarUrl: avatar(user.id),
        verificationReason,
        country:
          typeof user.profile?.country === "string" ? user.profile.country : "",
        joined:
          typeof user.history?.joined === "string" ? user.history.joined : null,
        projects,
        projectsComplete: raw.length < 40,
        followers: followers.length,
        followersComplete: followers.length < 40,
        checkedAt: Date.now(),
      };
    }
    res.setHeader(
      "Cache-Control",
      "public, max-age=30, s-maxage=300, stale-while-revalidate=600",
    );
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.status || 503).json({
      error: e.status
        ? e.message
        : "Scratch stats are unavailable right now. Please try again.",
    });
  }
}
