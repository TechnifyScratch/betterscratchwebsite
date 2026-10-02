import {filterThumbnails} from '../lib/thumbnail-filter.js';
// Fixed public Scratch feeds, with a rolling five-year creation-date window.
export function recentProjects(raw, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 5);
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  return raw.flatMap(p => {
    const created = Date.parse(p?.history?.created);
    if (!Number.isSafeInteger(p?.id) || p.id < 1 || typeof p.title !== 'string' ||
      !/^[\w-]{1,30}$/.test(p.author?.username || '') || !Number.isFinite(created) ||
      created < cutoff.getTime() || created > now.getTime() || seen.has(p.id)) return [];
    seen.add(p.id);
    return [{id:p.id,title:p.title.slice(0,200),author:p.author.username,created:new Date(created).toISOString()}];
  });
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method !== 'GET') { res.setHeader('Allow','GET'); return res.status(405).json({error:'Use GET.'}); }
  try {
    const deadline = Date.now() + 8500;
    // A bounded set of cacheable batches samples different public feed pages.
    const url = new URL(req.url, 'https://betterscratch.org');
    const seed = Number(url.searchParams.get('batch') || 0);
    if (!Number.isInteger(seed) || seed < 0 || seed > 15) return res.status(400).json({error:'Invalid gallery batch.'});
    const topics = ['game','animation','art','platformer','music','puzzle','space','cat','pen','3d','story','maze','clicker','adventure','drawing','racing'];
    const paths = [
      ...['trending','popular'].map(mode => `/explore/projects?limit=40&offset=0&language=en&mode=${mode}&q=%2A`),
      ...[0,1,2,3].map(i => `/search/projects?limit=40&offset=0&language=en&mode=recent&q=${topics[(seed+i*3)%topics.length]}`),
      '/users/viralgoose/projects?limit=40&offset=0',
      '/users/-Technify-/projects?limit=40&offset=0'
    ];
    const feeds = await Promise.all(paths.map(async path => {
      try {
        const response = await fetch(`https://api.scratch.mit.edu${path}`, {credentials:'omit',redirect:'error',signal:AbortSignal.timeout(6000)});
        if (!response.ok) return [];
        const raw = await response.json();
        if (!Array.isArray(raw) || raw.length > 40) return [];
        const owner = path.startsWith('/users/') ? path.split('/')[2] : null;
        return owner ? raw.map(p => ({...p,author:{...p.author,username:owner}})) : raw;
      } catch { return []; }
    }));
    const featured = recentProjects(feeds.slice(-2).flat());
    const all = recentProjects(feeds.flat());
    // Rotate the candidate order per cacheable batch, including one eligible project per developer.
    const ordered = [...featured, ...all.filter(p => !featured.some(f => f.id===p.id))];
    const projects = await filterThumbnails(ordered,deadline);
    if (projects.length < 54) throw new Error('Scratch feeds unavailable');
    res.setHeader('Cache-Control','public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({projects,featured:featured.map(p=>p.id)});
  } catch { return res.status(502).json({error:'Scratch projects are unavailable right now. Try again shortly.'}); }
}
