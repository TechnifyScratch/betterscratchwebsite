export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const response = await fetch("https://scratch.mit.edu/statistics/data/daily/", { signal: AbortSignal.timeout(8000), redirect: "error" });
    if (!response.ok) throw new Error("Source unavailable");
    const data = await response.json();
    if (!Number.isSafeInteger(data.USER_COUNT) || data.USER_COUNT < 0 || !Number.isFinite(data._TS) || data._TS <= 0 || data._TS * 1000 > Date.now()) throw new Error("Invalid statistics");
    const publishedAt = new Date(data._TS * 1000).toISOString();
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
    return res.status(200).json({ registeredAccounts: data.USER_COUNT, publishedAt });
  } catch {
    return res.status(503).json({ error: "Scratch statistics are unavailable." });
  }
}
