# B2 verification — 14 Nov 2026

Completed locally in this checkout. No push, deployment, DNS change, account creation, email or purchase was performed.

## Changes

- Added five static, source-backed melt guides, the guides index, calculation/source notes and human embed instructions.
- Added the native mobile menu, real header/footer destinations and current-page attributes. FAQ remains on home.
- Added generated Article/BreadcrumbList metadata, canonical/social tags, dated sitemap entries, prefills and related links.
- Article content lives in `src/guides.mjs`. Articles have no runtime JavaScript. Existing Fable variables, self-hosted fonts and calculator controls are preserved.
- Source archive and evidence/omission notes: [sources-ref/README.md](sources-ref/README.md). Only site assets from `static/` are copied; the research archive is not published.

## New URLs

- `/guides/`
- `/guides/silver-quarter-value/`
- `/guides/silver-dime-value/`
- `/guides/silver-half-dollar-value/`
- `/guides/silver-nickels/`
- `/guides/silver-dollar-melt-value/`
- `/how-we-calculate/`
- `/embed-code/`

`/embed/` remains the noindex iframe. `vercel.json` is unchanged; the new pages receive the normal CSP.

## Tests and browser evidence

| Check | Result |
| --- | --- |
| `npm test` | 24/24 pass, including original math/provider tests and new built-HTML tests. Builds before testing for fresh-checkout CI. |
| `npm run build` | Pass; total runtime JS 5,997 bytes gzip against the existing 15,000-byte budget. |
| `npm run qa` | 46/46 original browser checks pass, including offer/percentage behavior, state restoration, price fallbacks, iframe and security headers. |
| `npm run qa:guides` | 131/131 browser checks pass across home, index, five guides, calculation notes and embed instructions. |
| Responsive layout | No horizontal overflow at 320, 390, 768 or 1280 pixels on all nine pages. Open disclosures also checked. |
| Mobile navigation | Native menu works with JavaScript disabled; actual pointer navigation reaches all three destinations with current-page attributes. Visible menu targets are at least 44×44 pixels. |
| Prefill flow | All five article buttons reach home with the intended row populated and nonzero silver content; war-nickel extra row is revealed. Node tests additionally cover the quarter face-value and 40% half links. |
| Embed copying | Browser clipboard exactly matches the displayed iframe snippet. |
| Preserved HTML | Compared against the original Git checkout with the same spot argument: iframe HTML and complete home calculator/offer/dealer tool HTML match exactly. |
| Final editorial check | Every article has 500–900 visible words, a first paragraph of at most 60 words, paragraphs of at most three sentences and linked sources checked 14 Nov 2026. Final nickel paragraph checked at all four widths and its screenshots refreshed. |

Screenshots: `/workspace/gold-ira/free-apps/qa/jsc-b2-<page>-390.png` and `jsc-b2-<page>-1280.png` for all nine pages (18 images), plus `jsc-b2-menu-open-390.png`. Browser report: `/workspace/gold-ira/free-apps/qa/jsc-b2-report.json`. The original suite's report is `qa-shots/report.json` (ignored).

## Lighthouse mobile

Lighthouse 12 against the local static server, using `/usr/bin/google-chrome` with `--headless=new --no-sandbox` and `--form-factor=mobile`, after the final home/navigation changes:

| Page | Performance | Accessibility | Best practices | SEO | CLS |
| --- | --- | --- | --- | --- | --- |
| `/` | 99 | 100 | 100 | 100 | 0 |
| `/guides/silver-quarter-value/` | 100 | 100 | 100 | 100 | 0 |

HTML and JSON reports: `/workspace/gold-ira/free-apps/qa/jsc-b2-lighthouse-home.report.{html,json}` and `jsc-b2-lighthouse-silver-quarter-value.report.{html,json}`. All requested score thresholds are met. This is local testing; production was not deployed or tested.

## Source limitations and factual corrections

- NGC original articles/table, GovInfo statutes and NIST conversion references were fetched with curl and saved. U.S. Mint and PCGS URLs returned Cloudflare 403 pages; they are archived as failed attempts, not cited as fetched evidence.
- The optional Mint-only Bicentennial quarter, Eisenhower and Silver Eagle details are omitted because no usable Mint response could confirm them. PCGS remains a price-guide link, with no price or factual content attributed to its blocked pages.
- NGC dates the wartime nickel alloy introduction to October 1942. The guide says late 1942 and avoids choosing an exact day because the source reports conflicting dates.
- A fetched 2026 NGC market report contradicts a blanket current assertion that most Morgan/Peace dollars trade above melt. The guide emphasizes potentially much higher collector value and the need to check a guide, without guaranteeing premiums or publishing any prices/dealer statements.
