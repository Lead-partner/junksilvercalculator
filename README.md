# Junk Silver Calculator

A standalone, ad-free static calculator for US silver coin melt values. Vanilla HTML, CSS and JavaScript; no runtime or npm dependencies. Operated by Lead Partner AS, Norway.

## Run

Node 20 or newer and Chrome at `/usr/bin/google-chrome` (Chrome is only needed to regenerate image assets and run browser QA).

```sh
npm test
npm run build
node scripts/serve.mjs
```

Open http://127.0.0.1:4173/. The deployable directory is `public/`; build copies local assets, generates all pages, checks the JavaScript gzip budget and fetches a fresh spot snapshot. Network failures keep the checked-in `public/spot.json` intact. The local preview emulates the production security headers and serves that snapshot at `/live/spot.json`.

Source: `src/calc.js` (pure ES-module math and URL state), `src/app.js` (browser interactions), `src/pages.mjs` (shared HTML), `src/guides.mjs` (guide data/content), `src/content-pages.mjs` (guide and information pages), `static/` (styles, self-hosted fonts, icons and social image). Nothing from `design-ref/`, `sources-ref/` or `qa-shots/` is shipped. The research archive and fact/source mapping are in [`sources-ref/README.md`](sources-ref/README.md).

## Guides and navigation

The build generates `/guides/`, six articles under `/guides/<slug>/`, `/how-we-calculate/` and `/embed-code/`. Add article data in `src/guides.mjs`; routes, sitemap entries, related-guide links, Article/BreadcrumbList schema and checked-date source lists are generated from it. Article content uses `coinOzt()` for silver quantities and has no runtime JavaScript. Calculator dollar values stay in the live tool.

The shared header links to real pages and uses a native `<details>` menu below 600px. FAQ remains on home. `/embed-code/` contains the human instructions and a small copy script; `/embed/` remains the noindex, frameable tool. `vercel.json` is unchanged.

## Silver price updates

`.github/workflows/spot.yml` runs every 15 minutes and on manual dispatch. It tries gold-api.com, Coinbase, then Swissquote, with a 10-second timeout each and a strict $5–$500 sanity range. Successful writes are atomic. Total failure warns and exits successfully without overwriting the last good file.

The workflow loads the previous published snapshot before fetching, then creates a parentless commit containing **only** `spot.json` and force-pushes it to `spot-data`. The branch has one commit, with author `agentslp <335335651+agentslp@users.noreply.github.com>`. It never commits or pushes application code. Scheduled Actions can be delayed by GitHub; the interval is not a freshness guarantee. Enable Actions in the repository and run the workflow once to initialize the branch after publishing the repository.

Vercel rewrites `/live/spot.json` to that branch’s raw file, with `s-maxage=300`. The browser tries that file first, then gold-api.com directly if missing or older than two hours, then the baked snapshot and a validated localStorage snapshot (retaining the newest valid fallback). The page checks every five minutes while visible and on return to the tab. The source timestamp, when provided, determines the displayed local update time and stale warning. Manual prices are clearly labeled; “Use live price” resets the override.

## Calculations and state

Minted silver = coin count × weight in grams × fineness ÷ 31.1034768. Rounding happens only for display. Optional worn mode uses 0.715 ozt/$1 face for 90% dimes, quarters and halves. By-face mode permits fractional coin equivalents and explains nonmultiples. Count mode uses whole coins; changing a fractional face entry to count rounds to the nearest whole coin. Entry limits prevent unbounded output. The default 88% dealer benchmark is the user’s assumption, not a claim about dealer pricing.

**Precision note:** 26.730 g × 0.900 ÷ 31.1034768 = 0.7734517153… ozt for a Morgan/Peace dollar. This rounds to **0.7735** at four decimal places, rather than the brief’s 0.7734; the calculator and test preserve the stated weight formula. At $48.83 spot it rounds to $37.77.

Quantities, input modes, dealer percentage, worn mode, manual price and offer are encoded in the query string using debounced `history.replaceState`. Values are normalized on decode. Calculations run in the browser. A shared URL contains the entered values; recipients can read them. Only the last price snapshot is stored locally. Clear all clears coin quantities, with five-second Undo.

## Verification

```sh
npm test
npm run build
npm run qa
npm run qa:guides
```

Browser QA uses Chrome’s DevTools protocol and Node’s built-in WebSocket (Node 22+ for Chrome utility scripts; build/tests support Node 20). It writes screenshots at 390×844 and 1280×900, checks zero horizontal overflow at 320/390/768/1280, and exercises live totals, face mode, worn mode, offer checks, clear/undo, URL restoration, fallback prices, the embed, metadata and security headers. QA artifacts stay in the ignored `qa-shots/` directory. Regenerate the committed 1200×630 OG image and PNG icons with `node scripts/generate-assets.mjs`.

`npm test` builds first, then runs the math/provider tests and built-HTML checks (sitemap existence, internal links, metadata limits, parsed Article/BreadcrumbList schema, source dates, article length and decoded calculator prefills). `npm run qa:guides` checks all ten pages at the four widths, no-JS mobile navigation, article-to-calculator prefills, all six reference-table calculator rows, unwrapped table quantities and embed snippet copying. It writes the requested `jsc-b3-*` screenshots and JSON report to `/workspace/gold-ira/free-apps/qa/`. The original `npm run qa` retains its calculator, offer, percentage and iframe checks.

B3 verification, checked 14 Nov 2026: `npm test` passes 27/27, `npm run build` passes (5,997 bytes gzip of runtime JS), and `npm run qa:guides` passes 164/164 checks across ten pages at 320/390/768/1280 pixels. The new `/guides/which-coins-are-silver/` has 14 sourced series rows covering the six calculator specifications, a 48-word opening answer and 863 visible words. The nickel guide now targets war nickels; dime/quarter titles are preserved. Every existing guide links to the new reference.

Lighthouse 13.6.0 mobile on the new article scores **100 performance / 100 accessibility / 100 best practices / 100 SEO**, with no run warnings. Reports are `/workspace/gold-ira/free-apps/qa/jsc-b3-lighthouse-which-coins-are-silver.report.{html,json}`; the guide browser report is `jsc-b3-report.json` in that directory. Screenshots use `jsc-b3-<slug>-390.png` and `jsc-b3-<slug>-1280.png`; additional table inspection confirmed readable, unwrapped silver quantities at 320 pixels. NGC, GovInfo and NIST evidence was fetched again with curl and archived; source URLs, checked date, definition scope and exclusions are documented in [`sources-ref/README.md`](sources-ref/README.md).

The additional original `npm run qa` did not complete: one attempt timed out at Chrome DevTools `Page.navigate`; the second passed 32 checks (including coin entry, face/worn modes, offers, URL restoration and price fallbacks) before a `Page.enable` timeout. No calculator assertion failed, but the remainder of that optional suite is unverified in B3. The requested guide suite completed successfully. Testing is local; nothing was pushed or deployed. Earlier B2 results remain in [`qa-b2-results.md`](qa-b2-results.md).

Production Vercel configuration is in `vercel.json`; the main site forbids framing and `/embed/` permits framing. The embed is noindex and excluded from the sitemap. No deployment is performed by build or QA. `.github/workflows/test.yml` runs tests on pushes and pull requests.

## Before launch

**Set up the mailbox `hello@junksilvercalculator.net`.** The contact page links to it; creating the website does not provision email. Initialize `spot-data` by running the spot workflow. Verify the actual production rewrite, security headers and scheduled workflow after the repository/site are published.

## License

MIT; see [LICENSE](LICENSE). Self-hosted Barlow Semi Condensed (400/500/600) and IBM Plex Mono (400/500) are distributed under the SIL Open Font License; notices are in `static/fonts/`.
