# Vlad Bucur — personal site

A static portfolio site (plain HTML, CSS, and a little vanilla JS). No build step, no dependencies.

```
index.html                    Home: profile header, résumé column, portfolio sidebar
404.html                      Not-found page (self-contained; links home with "/")
assets/css/style.css          All styles: tokens, light/dark themes, layout, components
assets/js/projects-data.js    The project list (window.PROJECTS): edit this to add projects
assets/js/portfolio.js        Builds the portfolio sidebar from projects-data.js
assets/js/main.js             Theme toggle, keyboard access to the scrolling columns
assets/img/favicon.svg        VB monogram favicon
assets/img/profile.jpg        Headshot
projects/_template/           Project page template; copy it for each project
.nojekyll                     Tells GitHub Pages to serve files as-is
```

## Preview locally

From the repository folder:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` directly works for a quick look, but the project cards link to folders (`projects/<slug>/`), which need the local server. The 404 page only behaves correctly once deployed.

## Layout

- **Large screens** (at least 64em wide *and* 36em tall, about 1024 × 576 px): a one-screen "app shell". The profile header runs across the top; below it, the main column (left, about 70%) and the Portfolio sidebar (right, about 30%) scroll independently. The page itself does not scroll.
- **Smaller or shorter windows**: an ordinary scrolling page in the order header, main column, portfolio.
- **Profile header** (every page): round portrait, name, tagline, GitHub and LinkedIn links, theme toggle. On the home page the name is the `<h1>`; on project pages it links home.
- **Main column**: on the home page, 01 About, 02 Experience and 03 Education (timelines), then the footer. On a project page, the case study.
- **Portfolio sidebar** (every page): generated from `assets/js/projects-data.js`. It shows filter chips (one per category, once there are two or more), a "Pinned" group, then one group per category. On a project page, that project's card is highlighted and scrolled into view. While the list is empty it shows a "First write-ups coming soon" panel.

## Replace the photo

1. Save a headshot as `assets/img/profile.jpg`. It is shown as a small circle, so a square crop centred on your face, at least 400 × 400 px, works best; keep it under about 250 KB. The name must be exactly `profile.jpg`, all lowercase: GitHub Pages is case-sensitive but macOS is not, so `profile.JPG` looks fine locally and then shows the monogram once deployed.
2. Strip location data before committing. In Photos, use **File → Export** with "Location Information" unticked; or in Preview, **Tools → Show Inspector → (i) → GPS → Remove Location Info**. `mdimport -t -d3 assets/img/profile.jpg 2>&1 | grep -iE 'latitude|longitude'` should print nothing (unlike `mdls`, this reads the file itself rather than the Spotlight index).
3. Check the framing. The circle shows the whole square image, so crop it with your face in the middle. For a wider shot instead, raise `--portrait-zoom` (e.g. 1.8) and aim it with `--portrait-focus` on `.portrait` in `assets/css/style.css`. If the file is missing, the "VB" monogram shows instead, with no broken-image icon.

To fine-tune the crop, adjust `--portrait-zoom` (1 = no zoom) and `--portrait-focus` (the point the zoom centres on). A square of at least 400 × 400 px stays sharp on high-DPI screens.

## Add a project

Each project needs a page and one entry in the data file. The sidebar on every page updates from the data file automatically.

1. **Create the page.** Copy `projects/_template/` to `projects/<slug>/`, for example `projects/cloud-log-pipeline/`. Use only lowercase letters and digits in the slug, with single hyphens between words (no leading, trailing, or double hyphens). In the copy:
   - set `data-project="<slug>"` on `<body>` (leave `data-root="../../"` as it is);
   - replace every `[bracketed]` placeholder: the `<title>`, the meta descriptions, the slug in the canonical and `og:url` links, the category line, title, subtitle, the GitHub repo name and demo link, the Year / Type / Status facts, and each section;
   - delete the `<meta name="robots" content="noindex">` line;
   - remove any button or section the project doesn't need (section numbers update automatically);
   - for screenshots, put the files in the same folder and swap the placeholder box for an `<img>` (an example is in the comment next to it). Strip location data as for the photo, and crop or blur hostnames, IP addresses, usernames, and internal URLs.
2. **Add the entry to `assets/js/projects-data.js`**, at the top of `window.PROJECTS` (newest first), separated from the next entry by a comma:

   ```js
   {
     slug: "cloud-log-pipeline",
     title: "Cloud log pipeline",
     summary: "Centralised, tamper-evident logging for a small cloud estate.",
     category: "Cloud security",
     tags: ["AWS", "Terraform", "Python"],
     year: 2026,
     image: "projects/cloud-log-pipeline/cover.jpg",
     pinned: true
   },
   ```

   | Field | | |
   |---|---|---|
   | `slug` | required | Folder name under `projects/`; must match the page's `data-project`. |
   | `title` | required | Card title; use the same title as the page. |
   | `summary` | required | One short line under the title. |
   | `category` | required | Each distinct category automatically becomes a filter chip and a group in the "All" view. Reuse the exact same wording for projects that belong together. |
   | `tags` | required | 2–4 short labels (only the first four are shown). |
   | `year` | required | Shown on the card. |
   | `image` | optional | Cover image, path from the site root. Without one, the card draws a placeholder with the project's initials. |
   | `pinned` | optional | `true` lists the project under "Pinned" at the top of the "All" view instead of under its category. |

   Entries with a missing title or an invalid slug are skipped (the browser console says which one).
3. **Optional cover image.** Save it as `projects/<slug>/cover.jpg`, 16:10, about 1200 × 750 px, with metadata stripped (check: `mdimport -t -d3 projects/<slug>/cover.jpg 2>&1 | grep -iE 'latitude|longitude'` should print nothing (unlike `mdls`, this reads the file itself rather than the Spotlight index)).
4. **Check for leftover placeholders.** This should print nothing:

   ```sh
   grep -n '\[' projects/<slug>/index.html
   ```

   Then preview locally and click the new card.

Keep all links relative (no leading `/`) so the site works under any base path.

## Deploy on GitHub Pages

1. Create a public repository named `corpus777.github.io` (all lowercase, as GitHub requires for user sites), served at `https://corpus777.github.io/`.
2. Commit these files to the repository root and push to the `main` branch.
3. In the repository, go to **Settings → Pages**, set **Source** to "Deploy from a branch", choose `main` and `/ (root)`, and save.
4. The site goes live within a minute or two. Every push to `main` redeploys it.

`404.html` assumes the site is served from the domain root, as it is for a user site. If you deploy to a project site instead (`username.github.io/repo/`), change its three root-absolute paths (the favicon `href` and both `href="/"` home links) so they start with `/repo/`.

## Editing notes

- Colors, type scale, spacing, and radii are CSS custom properties at the top of `style.css`. Dark-mode values appear twice (explicit toggle and system preference), so change both blocks together. The two background colours are also hard-coded in `THEME_COLORS` in `main.js`, the `<meta name="theme-color">` tags on every page (including `404.html`), `404.html`'s inline CSS, and `assets/img/favicon.svg`; find every copy with `grep -rn '#F6F3EC\|#131210' .`.
- The app-shell breakpoint is the `@media screen and (min-width: 64em) and (min-height: 36em)` block in section 4 of `style.css`.
- The profile header and sidebar markup is repeated on every page (there is no build step). If you change a profile link, update every page plus `GITHUB_URL` in `assets/js/portfolio.js` and the JSON-LD `sameAs` list in `index.html`; `grep -rn 'Corpus777\|vladbucur1' .` finds every copy.
- Experience and Education are plain HTML in `index.html`. To add an entry, copy a `<li class="timeline__item">` block and move `timeline__item--current` to the present role.
- Class names follow `block__element--modifier`; state classes start with `is-`.
- The theme choice is saved in `localStorage` under the key `theme`.
