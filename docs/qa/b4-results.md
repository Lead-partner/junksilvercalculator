# B4 implementation and verification

Checked 14 Nov 2026. Work stays in the existing checkout; no push or deployment was performed.

The story is coin identification → guide/prefill link → calculator → sourced spot quote → silver melt result. The calculator runtime and its IDs are unchanged. The public quote is cached in browser storage, so the trust line accurately says “coin entries never stored”; settings also remain in the shareable URL.

## Home and hero

- H1 uses self-hosted Barlow Semi Condensed at 52px desktop / 36px mobile, with a separate one-line value proposition and compact factual trust row.
- The desktop sheet gap contains a photo-guide helper. No raster is needed in the hero.
- The fourth common coin row ends at 840px in the 390×844 viewport.
- Server-rendered `<main>` word count: 608 before, 1,963 after, an increase of 1,355. Method: extract `<main>`, replace tags/entities with spaces, split on whitespace; hidden UI and FAQ text count in both snapshots.
- Main explanations, table, worked formula, diagrams, photographs and guide links are visible. FAQ answers use native details; their exact text matches FAQPage JSON-LD.

## Per-page image / figure counts

Counts refer to image elements; an obverse/reverse pair is one image. Mintmark diagrams embed a real reverse photograph. Every image is inside a teaching figure.

| Page | Images | Figures | Mobile image bytes | Desktop image bytes |
| --- | ---: | ---: | ---: | ---: |
| `/` | 4 | 4 | 27,751 | 46,608 |
| `/guides/` | 6 | 6 | 90,208 | 90,208 |
| `/how-we-calculate/` | 2 | 2 | 4,112 | 4,112 |
| `/embed-code/` | 1 | 1 | 1,657 | 1,657 |
| `/guides/which-coins-are-silver/` | 16 | 16 | 218,219 | 245,158 |
| `/guides/silver-quarter-value/` | 4 | 4 | 99,641 | 112,105 |
| `/guides/silver-dime-value/` | 4 | 4 | 91,022 | 103,639 |
| `/guides/silver-half-dollar-value/` | 6 | 6 | 84,706 | 97,836 |
| `/guides/silver-nickels/` | 2 | 2 | 58,214 | 69,265 |
| `/guides/silver-dollar-melt-value/` | 3 | 3 | 29,701 | 44,380 |

The identification guide uses all 14 coin types in its linked grid and repeats Roosevelt in the lead. About, contact, iframe and 404 have no new content figures. All requested content pages have unique 1200×630 social cards; Article/WebApplication/WebPage image objects and sitemap content-image entries resolve to files.

Both measured widths stay below 250,000 image bytes per requested page; the largest is 245,158 bytes. Above-fold images peak at 30,546 bytes, below 60,000. Home uses zero above-fold image bytes. Measurements use the browser-selected AVIF assets and include the SVGs; OG cards are metadata assets, not page-load images.

## Licensing and artwork

27 Commons originals: 19 public domain, 2 CC BY 4.0, 2 CC BY 2.0, 3 CC BY-SA 3.0, 1 CC BY-SA 4.0. The two museum pair originals provide both sides in one file. All candidates were visually reviewed; the low-resolution 1953 Roosevelt candidate was rejected in favor of the 1962 BnF images. The wartime reverse visibly has a large P above Monticello. Attribution and license links appear in every relevant figure caption. Original API metadata, human credits, transformations and share-alike derivative notes are recorded in `static/img/credits.json` and `docs/images/credits.md`.

Real licensed silver/clad edge photo included. Sourced mintmark overlays included for war nickel, Roosevelt dime and Washington quarter. A half-dollar mintmark overlay was omitted because the allowed fetched text sources did not establish the location applicable to the chosen examples; its guide uses a data-derived silver-content figure. No image_gen calls or generated coins: `docs/images/generation-log.md` records zero AI images.

## Verification

- Build passes: runtime JavaScript remains 5,997 bytes gzip.
- Node tests: 33/33 pass, including every image/source reference, alt/intrinsic dimensions, lead and body figures, OG dimensions/uniqueness, structured images, license records, FAQ parity and sitemap image resolution. The existing article prose budget now excludes added figure captions; its original prose bounds remain.
- Calculator browser suite: 46/46 checks pass, including count/face conversion, worn setting, offer comparison, URL state, undo, quote file/direct/offline fallbacks and iframe calculation.
- Route/browser suite: 212/212 checks pass across fourteen routes at 320/390/768/1280, native menus, prefills, reference table and embed copying. No horizontal overflow or browser exceptions.
- Image delivery suite: all 10 requested content pages decode successfully and meet image budgets at 390 and 1280.

| Lighthouse 12 mobile | Performance | Accessibility | Best practices | SEO | LCP | CLS |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Home | 99 | 100 | 100 | 100 | 2.1 s | 0 |
| War nickels | 100 | 100 | 100 | 100 | 1.7 s | 0 |
| Half dollars | 100 | 100 | 100 | 100 | 1.8 s | 0 |

Lighthouse command: `npx -y lighthouse@12 <local URL> --form-factor=mobile --chrome-flags="--headless=new --no-sandbox"`. Reports: `/workspace/gold-ira/free-apps/qa/jsc-b4-lighthouse-*.report.{json,html}`.

Viewport screenshots: `/workspace/gold-ira/free-apps/qa/jsc-b4-<page>-<390|1280>.png`. Hero: `jsc-hero-after-390.png`, `jsc-hero-after-1280.png`. Full-page nickel and half-dollar captures: `jsc-b4-<slug>-<390|1280>-full.png`. Corrected mintmark overlays were individually rendered and viewed. Raw browser/image/test logs and JSON reports use the same B4 prefix.

## Limitations

Melt remains a metal reference, and the 88% dealer field remains an editable user assumption. No universal dealer spread was invented. Half-dollar mintmark annotation omitted as described above. No push/deploy/external account creation, email, spend or Cursor use.
