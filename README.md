# Vlad Bucur — personal site

A static portfolio site (plain HTML, CSS, and a little vanilla JS). No build step, no dependencies.

```
index.html                  Home page: hero, About, Experience, Education, Projects, Contact
404.html                    Not-found page (self-contained; links home with "/")
assets/css/style.css        All styles: tokens, light/dark themes, components
assets/js/main.js           Theme toggle, mobile menu, nav highlight
assets/img/favicon.svg      VB monogram favicon
assets/img/profile.jpg      Your headshot (add this yourself, see below)
projects/_template/         Case-study page template; copy it for each project
.nojekyll                   Tells GitHub Pages to serve files as-is
```

## Preview locally

```sh
cd path/to/this/folder
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` directly works for a quick look, but folder links such as `projects/<slug>/` need the local server. The 404 page only behaves correctly once deployed.

## Add your photo

1. Save a portrait-oriented headshot as `assets/img/profile.jpg`. A 4:5 crop around 960 × 1200 px works well; keep it under ~250 KB. The name must be exactly `profile.jpg`, all lowercase: GitHub Pages is case-sensitive but macOS is not, so `profile.JPG` looks fine locally and then shows the monogram once deployed.
2. Strip location data before committing. In Photos, use **File → Export** with "Location Information" unticked; or in Preview, **Tools → Show Inspector → (i) → GPS → Remove Location Info**. `mdls -name kMDItemLatitude assets/img/profile.jpg` should print `(null)`.
3. That's it. The hero shows the photo in the arched frame. Until the file exists, the "VB" monogram shows instead, with no broken-image icon.

To adjust the crop focus, edit `object-position` on `.portrait__img` in `assets/css/style.css`.

## Add a project

1. **Create the case-study page.** Copy `projects/_template/` to `projects/<slug>/` (for example `projects/my-first-project/`). In the copy:
   - replace everything in `[square brackets]`, including the `<title>` and meta description;
   - delete the `<meta name="robots" content="noindex">` line;
   - put screenshots in the same folder and swap the placeholder box for an `<img>` (an example is in the comment). Strip location data from images as for the photo, and crop or blur hostnames, IP addresses, usernames, and internal URLs.
2. **Add the card on the home page.** In `index.html`, find `#projects`. Inside `<div class="project-grid">` there is a commented-out `project-card` block. Copy the `<article>` (between the START and END markers) and paste it right after the comment's closing `-->`, above any existing cards (newest first). Replace every `[bracketed]` placeholder: the number (No. 01, 02, …), year, title, summary, 2–4 tags, and links. Point the title and Write-up links at `projects/<slug>/`. Delete any link you don't need.
3. The "First write-ups coming soon" box hides itself as soon as one card exists. You can also delete it.

Use only lowercase letters, digits, and hyphens in slugs and file names, and match them exactly in links. Keep all links relative (no leading `/`) so the site works under any base path. To catch leftover placeholders (skipping the commented template card), run:

```sh
awk '/START project card/,/END project card/{next} /(>|"|\/)\[/{print FILENAME":"FNR": "$0}' index.html projects/<slug>/index.html
```

It should print nothing (the case-study template's own instruction comment aside).

## Deploy on GitHub Pages

1. Create a public repository named `corpus777.github.io` (all lowercase, as GitHub requires for user sites), served at `https://corpus777.github.io/`.
2. Commit these files to the repository root and push to the `main` branch.
3. In the repository, go to **Settings → Pages**, set **Source** to "Deploy from a branch", choose `main` and `/ (root)`, and save.
4. The site goes live within a minute or two. Every push to `main` redeploys it.

`404.html` assumes the site is served from the domain root, as it is for a user site. If you deploy to a project site instead (`username.github.io/repo/`), change its three root-absolute paths (the favicon `href` and both `href="/"` home links) so they start with `/repo/`.

## Editing notes

- Colors, type scale, spacing, and radii are CSS custom properties at the top of `style.css`. Dark-mode values appear twice (explicit toggle and system preference), so change both blocks together, plus the copy in `404.html` and `THEME_COLORS` in `main.js`.
- Class names follow `block__element--modifier`; state classes start with `is-`.
- The theme choice is saved in `localStorage` under the key `theme`.
