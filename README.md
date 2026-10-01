# BetterScratch website

A website for BetterScratch with static pages and a small cached Vercel stats API. No database, third-party paid service, API key, or dependency installation is required. Use a free Vercel Hobby account for personal/non-commercial hosting. Hobby usage caps can make the site unavailable; do not upgrade to Pro or add paid services if you want to avoid charges.

## Edit and preview

- Page content: `dist/index.html`
- Stats: `dist/stats.html`, `dist/stats.js`, and `api/stats.js`
- Developer page: `dist/about.html`
- Documentation: `dist/docs.html`
- Reference documentation downloads: `dist/docs/`
- Styling: `dist/styles.css`
- Images and branding: `dist/assets/`

From this `website` folder, run:

```sh
npm run dev
```

Then open http://127.0.0.1:4173.

The three **Add to Chrome** links currently open https://chromewebstore.google.com/ as requested. Replace the `href` on each `.install-link` and update the listing-coming-soon copy when a listing is available.

## Push to GitHub

This `website` folder already has its own Git repository. Create an empty repository on GitHub (without a README, license, or gitignore), then run these commands from this folder. Replace `YOUR_USERNAME` and `YOUR_REPOSITORY` with your GitHub details:

```sh
git add .
git commit -m "Prepare BetterScratch website for Vercel"
git branch -M main
git remote add origin https://github.com/TechnifyScratch/betterscratchwebsite.git
git push -u origin main
```

If you have already configured an `origin`, check `git remote -v` and use that remote, or update it with `git remote set-url origin YOUR_REPOSITORY_URL`.

For later changes:

```sh
git add .
git commit -m "Update BetterScratch website"
git push
```

## Host on Vercel

1. In Vercel, choose **Add New → Project** and import your GitHub repository.
2. For a repository containing just this folder's contents, leave **Root Directory** at the repository root. If the site lives inside a larger repository, select **website** as the Root Directory.
3. Use **Other** as the framework preset. `vercel.json` sets the output directory to **dist** and skips installation and building.
4. Click **Deploy**. Vercel supplies a URL; you can add a custom domain in the project's settings.

Once GitHub is connected, pushing changes to your production branch updates the site through Vercel.

Documentation: https://vercel.com/docs/project-configuration/vercel-json

## Assets and hosting

The logo is user supplied. The homepage includes an interactive appearance preview. The orange logo is used for the header, footer, and favicon. Feature descriptions are based on the extension source and repository documentation. The website has no tracking, external fonts, animations, or third-party dependencies. Stats use the public Scratch API through one Vercel function with a five-minute CDN cache and an eight-second timeout. Requests are on demand, with no polling or background indexing. Country and global user leaderboards are intentionally omitted.

`.openai/hosting.json` records the earlier Sites preview and is not required by Vercel. `.vercelignore` excludes that metadata from Vercel uploads. The website's files use relative asset paths and work independently on either host.

## Stats API

Use Node.js 22 or later for local development. `npm run dev` serves static pages and the stats route. A plain Python static server cannot serve the API. `npm test` checks endpoint validation, data projection, caching headers, and error handling. Vercel automatically deploys `api/stats.js` alongside `dist`.

The API accepts only `kind=user&username=...` or `kind=explore&mode=trending|popular`. It reads fixed public Scratch endpoints and sends no account cookies. Displayed ranks apply only to the loaded project list. Profile engagement covers up to 40 projects; follower counts above the sample are lower bounds.

Vercel Hobby pricing and limits: https://vercel.com/docs/plans/hobby
