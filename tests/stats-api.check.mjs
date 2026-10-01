import { test } from "node:test";
import assert from "node:assert/strict";
import handler from "../api/stats.js";
function response() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(v) {
      this.statusCode = v;
      return this;
    },
    json(v) {
      this.body = v;
      return this;
    },
  };
}
const project = {
  id: 12,
  title: "Project",
  author: { username: "someone" },
  stats: { views: 100, loves: 12, favorites: 8 },
};
test("rejects arbitrary modes, invalid usernames, and write requests without fetching", async () => {
  const old = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error("Unexpected request");
  };
  try {
    for (const req of [
      { method: "POST", url: "/api/stats?kind=explore" },
      { method: "GET", url: "/api/stats?kind=explore&mode=bad" },
      { method: "GET", url: "/api/stats?kind=user&username=../private" },
      { method: "GET", url: "/api/stats?kind=other" },
    ]) {
      const res = response();
      await handler(req, res);
      assert.ok([400, 405].includes(res.statusCode));
      assert.equal(res.headers["Cache-Control"], "no-store");
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = old;
  }
});
test("projects are safely projected and CDN cached; duplicates and invalid rows are skipped", async () => {
  const old = globalThis.fetch;
  let url;
  globalThis.fetch = async (u, options) => {
    url = u;
    assert.equal(options.credentials, "omit");
    return new Response(
      JSON.stringify([
        project,
        project,
        { ...project, id: -1 },
        { ...project, id: 13, stats: { views: -1, loves: 0, favorites: 0 } },
      ]),
    );
  };
  try {
    const res = response();
    await handler(
      { method: "GET", url: "/api/stats?kind=explore&mode=popular" },
      res,
    );
    assert.equal(res.statusCode, 200);
    assert.match(url, /^https:\/\/api.scratch.mit.edu\/explore\/projects\?/);
    assert.match(url, /mode=popular/);
    assert.equal(res.body.projects.length, 1);
    assert.deepEqual(Object.keys(res.body.projects[0]), [
      "id",
      "title",
      "author",
      "avatarUrl",
      "views",
      "loves",
      "favorites",
    ]);
    assert.match(res.headers["Cache-Control"], /s-maxage=300/);
  } finally {
    globalThis.fetch = old;
  }
});
test("profile sampling reports follower lower bounds without implying global ranks", async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async (u) =>
    new Response(
      JSON.stringify(
        u.includes("/projects?")
          ? [{ ...project, author: { id: 10 } }]
          : u.includes("/followers?")
            ? Array.from({ length: 40 }, (_, i) => ({
                id: i + 1,
                username: `user${i}`,
              }))
            : {
                username: "someone",
                id: 10,
                profile: { country: "United Kingdom" },
                history: { joined: "2020-01-01" },
              },
      ),
    );
  try {
    const res = response();
    await handler(
      { method: "GET", url: "/api/stats?kind=user&username=someone" },
      res,
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.followers, 40);
    assert.equal(res.body.followersComplete, false);
    assert.equal(res.body.projectsComplete, true);
    assert.equal(res.body.country, "United Kingdom");
    assert.equal(res.body.avatarUrl, "https://cdn2.scratch.mit.edu/get_image/user/10_90x90.png");
    assert.equal(res.body.projects[0].author, "someone");
    assert.equal(res.body.rank, undefined);
  } finally {
    globalThis.fetch = old;
  }
});
test("upstream rate limits produce recoverable uncached errors", async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async () => new Response("", { status: 429 });
  try {
    const res = response();
    await handler({ method: "GET", url: "/api/stats?kind=explore" }, res);
    assert.equal(res.statusCode, 503);
    assert.match(res.body.error, /busy/);
    assert.equal(res.headers["Cache-Control"], "no-store");
  } finally {
    globalThis.fetch = old;
  }
});
test("verification matches extension eligibility and requires a 1001st follower", async () => {
  const old = globalThis.fetch;
  try {
    for (const scenario of [
      { name: "-Technify-", reason: "community", count: 0 },
      { name: "teamuser", team: true, reason: "scratch-team", count: 0 },
      { name: "creator", reason: "followers", count: 40, threshold: true },
      { name: "creator", reason: null, count: 40, threshold: false },
    ]) {
      globalThis.fetch = async (url) => new Response(JSON.stringify(
        url.includes("/projects?") ? [] : url.includes("offset=1000") ? (scenario.threshold ? [{ id: 2, username: "follower" }] : []) : url.includes("/followers?") ? Array.from({ length: scenario.count }, (_, i) => ({ id: i + 1, username: "follower" })) : { id: 10, username: scenario.name, scratchteam: scenario.team === true }
      ), { status: 200 });
      const res = response();
      await handler({ method: "GET", url: `/api/stats?kind=user&username=${scenario.name}` }, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.verificationReason, scenario.reason);
    }
  } finally { globalThis.fetch = old; }
});
