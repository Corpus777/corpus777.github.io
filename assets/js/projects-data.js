/* ==========================================================================
   PROJECT DATA — the single source of truth for the "Portfolio" sidebar.
   Every page loads this file, then assets/js/portfolio.js renders the cards,
   the filter chips, and the current-project highlight from it. Adding a
   project = one entry here + one page under projects/<slug>/ (see README.md).

   RULES
   - Newest first: add new entries at the TOP of the array.
   - slug is the folder name under projects/ and must match exactly:
     lowercase letters, digits and single hyphens between words ("cloud-log-pipeline").
     The card links to projects/<slug>/, and that page's
     <body data-project="<slug>"> marks the card as the current page.
   - Separate entries with commas. Plain strings only (no HTML).

   FIELDS
     slug      required  Folder name under projects/ (see above).
     title     required  Card title; use the same title as the project page.
     summary   required  One short line shown under the title.
     category  required  e.g. "Cloud security". Every distinct category becomes
                         a filter chip automatically (chips appear once there
                         are 2+ categories) and a group in the "All" view.
     tags      required  2–4 short labels, e.g. ["AWS", "Terraform", "Python"].
                         Only the first 4 are shown.
     year      required  e.g. 2026 (shown on the card).
     image     optional  Cover image, path relative to the SITE ROOT, e.g.
                         "projects/cloud-log-pipeline/cover.jpg" (16:10,
                         ~1200 x 750, location data stripped). Without one,
                         the card shows a drawn placeholder with initials.
     pinned    optional  true = listed under "Pinned" at the top of the "All"
                         view (instead of under its category). Leave it out
                         otherwise.

   EXAMPLE ENTRY (copy it inside the brackets below and fill it in)

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

   While the array is empty the sidebar shows a "First write-ups coming soon"
   panel instead.
   ========================================================================== */

window.PROJECTS = [];
