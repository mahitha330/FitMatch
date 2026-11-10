# FitMatch

FitMatch is a static, four-page outfit styling website. It runs in the browser
with HTML, CSS, JavaScript and Canvas; it does not need a backend, API key,
paid AI service or third-party image analysis.

## Run locally

Open `index.html` in a browser, or serve this folder with any static web server
(for example, VS Code Live Server). The upload, preview, color analysis,
aesthetic picker and results flow use browser APIs and `sessionStorage`.

## Publish with GitHub Pages

Push this folder's contents (the four HTML files, `style.css` and `script.js`)
to the repository root, then enable GitHub Pages for that branch and root. If
using `/docs` as the Pages source, place those files inside `docs/`. Asset
references are relative to each HTML page, so they also work when the
repository site is served from a project path such as `/FitMatch/`. The site
is static and requires no build step.

## How local styling works

Canvas samples the uploaded image, groups sampled pixels into color bins, and
estimates dominant and secondary colors, a basic color category, and
lightness/saturation characteristics. A stable fingerprint of the sampled
pixels helps vary clothing, layering, footwear, accessories and colour
pairings between photos; the selected aesthetic shapes each recipe.

This is color analysis, not garment recognition: FitMatch does not identify
whether an item is a top, bottom, dress or a particular pattern. Recommendations
are styling inspiration and may need adapting to the uploaded item's type.
Images are processed locally and the current result is held in
`sessionStorage` until the browser tab session ends.
