# Deployment Instructions

The site is **ready to deploy**. All 22 implementation commits are in the local `main` branch. The push from this session failed due to network restrictions — please push manually from your machine.

## Steps

### 1. Push to main

From `D:\Projects\DesignPatterns\` (or wherever your local clone lives):

```bash
git push origin main
```

Expected: pushes ~22 commits. The Actions workflow `.github/workflows/deploy.yml` will trigger.

### 2. Configure repository settings (one-time)

Open `https://github.com/Moon-Knight1/DesignPatterns/settings/pages`:
- **Source:** select **"GitHub Actions"** (NOT "Deploy from a branch")

Open `https://github.com/Moon-Knight1/DesignPatterns/settings/actions`:
- **Workflow permissions:** select **"Read and write permissions"**
- **Allow GitHub Actions to create and approve pull requests:** check this

### 3. Watch the deploy

Open `https://github.com/Moon-Knight1/DesignPatterns/actions` — the "Deploy to GitHub Pages" workflow should appear within ~10 seconds of the push, run for ~2 minutes, and turn green.

### 4. Verify the live site

Open `https://moon-knight1.github.io/DesignPatterns/`:
- Home renders with hero, 22 cards in 3 sections, progress demo, CTA
- Click any card → navigates to its detail page (`/#/pattern/<slug>`)
- Detail page renders markdown with images
- TOC works (click heading → smooth scroll)
- Prev/next nav works
- Visit `https://moon-knight1.github.io/DesignPatterns/#/about` → about page
- Reload on `https://moon-knight1.github.io/DesignPatterns/#/pattern/observer` → still loads (hash mode survives)
- Visit `https://moon-knight1.github.io/DesignPatterns/#/pattern/singleton` → no "上一篇" card
- Visit `https://moon-knight1.github.io/DesignPatterns/#/pattern/visitor` → no "下一篇" card
- Visit `https://moon-knight1.github.io/DesignPatterns/#/pattern/notreal` → "未找到该模式" message

### 5. Verify SEO metadata

In DevTools on a pattern detail page, inspect `<head>`:
- `<title>` shows the pattern name
- `<meta name="description">` shows the pattern summary
- `<meta property="og:title">` and `og:description` present

### 6. If the deploy fails

If the workflow failed:
1. Read the failed step's log in the Actions tab.
2. Most common cause: permissions (revisit Step 2).
3. Second most common: build error (run `npm run build` locally to reproduce).
4. Fix, commit, push — workflow re-runs automatically.
