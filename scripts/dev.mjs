import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import handler from "../api/stats.js";
import communityHandler from "../api/community.js";
import galleryHandler from "../api/gallery.js";
const root = resolve(import.meta.dirname, "../dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (["/api/stats", "/api/community", "/api/gallery"].includes(url.pathname)) {
    res.status = (status) => {
      res.statusCode = status;
      return res;
    };
    res.json = (data) => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
      return res;
    };
    return (url.pathname === "/api/gallery" ? galleryHandler : url.pathname === "/api/community" ? communityHandler : handler)(req, res);
  }
  try {
    const file = resolve(
      root,
      "." +
        decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname),
    );
    if (!file.startsWith(root + sep)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
    });
    res.end(data);
  } catch {
    if ((req.headers.accept || "").includes("text/html")) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(await readFile(resolve(root, "404.html")));
    } else { res.writeHead(404); res.end("Not found"); }
  }
});
server.listen(4173, "127.0.0.1", () =>
  console.log("BetterScratch website: http://127.0.0.1:4173/"),
);
