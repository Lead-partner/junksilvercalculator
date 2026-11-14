# Source checks — 14 Nov 2026

All listed source URLs were opened now with `curl -L -A 'Mozilla/5.0'` on **14 Nov 2026**. The files here are research evidence, not public site assets. Original pages contain market prices and other material that is deliberately not copied to the guides. Nothing in this directory is included by the build.

## Primary sources used

| Saved file | Source URL | What the fetched source confirms |
| --- | --- | --- |
| [ngc-melt.html](ngc-melt.html) | [NGC: U.S. Silver Coin Melt Values](https://www.ngccoin.com/price-guide/coin-melt-values.aspx) | Coin weights, silver fractions and rounded actual silver weights: dimes 2.5 g/.900; quarters 6.25 g/.900; 90% halves 12.5 g/.900; 1965–1970 halves 11.5 g/.400; Morgan/Peace dollars 26.73 g/.900; wartime nickels 5 g/.350. Design ranges: Barber dimes/quarters 1892–1916, Mercury dimes 1916–1945, Roosevelt silver dimes 1946–1964, Standing Liberty quarters 1916–1930, Washington silver quarters 1932–1964, Walking Liberty halves 1916–1947, Franklin halves 1948–1963, Kennedy 90% halves 1964. Distinguishes intrinsic melt from numismatic value. No prices reproduced. |
| [ngc-guide.html](ngc-guide.html) | [NGC: U.S. Coin Price Guide](https://www.ngccoin.com/price-guide/united-states/) | Purpose and limitations of the price guide; collectible prices depend on characteristics, availability and demand. It is a reference, not a purchase offer. |
| [ngc-war-history.html](ngc-war-history.html) | [NGC: The Wartime Silver Nickels of 1942–45, Part One](https://www.ngccoin.com/news/article/999/) | Original research by David W. Lange: 56% copper/35% silver/9% manganese; introduction in October 1942, with sources disagreeing on October 1 vs. October 8; large mint marks above Monticello; first P mint mark on a US coin; standard-alloy 1942 issues from Philadelphia/Denver, silver issues from Philadelphia/San Francisco; all three mints made silver nickels 1943–1945. Supports saying **late 1942**, rather than implying all 1942 coins or a midyear change. |
| [ngc-dollar-history.html](ngc-dollar-history.html) | [NGC: A Centennial Celebration of Morgan and Peace Dollars](https://www.ngccoin.com/coin-grading/morgan-and-peace-dollar/) | Original Morgan dates 1878–1904 and 1921; original Peace dates 1921–1928 and 1934–1935. Discusses date, mint and grade distinctions and collector premiums; distinguishes modern issues from the original series. No prices, quotes or auction results reproduced. |
| [ngc-kennedy.html](ngc-kennedy.html) | [NGC: Grading Kennedy Half Dollars](https://www.ngccoin.com/coin-grading-guide/grading-kennedy-half-dollars/) | Kennedy 1964 .900 silver, 1965–1970 silver-clad alloy, regular circulating issues copper-nickel clad from 1971; silver collector issues are exceptions to a simple date-only rule. |
| [coinage-act-1965.pdf](coinage-act-1965.pdf) and [text](coinage-act-1965.txt) | [GovInfo: Public Law 89-81, 79 Stat. 254, Coinage Act of 1965](https://www.govinfo.gov/content/pkg/STATUTE-79/pdf/STATUTE-79-Pg254.pdf) | Section 101: clad dime and quarter with copper-nickel layers and copper core; reduced-silver half weighs 11.5 g and contains 4.6 g silver (40%, a derived ratio). The 1965 change is a change in dated issues, not an assertion that all .900 mint production stopped that calendar year. |
| [coinage-act-1970.pdf](coinage-act-1970.pdf) and [text](coinage-act-1970.txt) | [GovInfo: Public Law 91-607, 84 Stat. 1769](https://www.govinfo.gov/content/pkg/STATUTE-84/pdf/STATUTE-84-Pg1769.pdf) | Section 204 permits the earlier silver half specification only until January 1, 1971. This PDF starts on page 1769; it does not include section 201 on the preceding page and is not used to infer that section's specifications. |
| [nist-mp286.pdf](nist-mp286.pdf) and [text](nist-mp286.txt) | [NIST/NBS: Units of Weight and Measure, MP 286](https://nvlpubs.nist.gov/nistpubs/Legacy/MP/nbsmiscellaneouspub286.pdf) | Troy ounce conversion: 31.1034768 grams, confirming `TROY_GRAMS` in `src/calc.js`. Used to derive all displayed silver quantities, not to copy rounded market melt figures. |
| [ngc-market-2026.html](ngc-market-2026.html) | [NGC: My 15th Annual NGC Year in Review – Part 3](https://www.ngccoin.com/news/article/14894/) | A 2026 report includes first-person market observations that many Morgan/Peace dollars were selling below melt. This prevents substantiating a blanket current claim that **most trade above melt**. The article instead says collector premiums can be much higher and are not guaranteed. No dealer statements or prices are quoted or reproduced on the site. |

All sources in this table returned HTTP 200. The linked Coin Explorer category pages were also fetched successfully (`ngc-nickels.html`, `ngc-morgan.html`, `ngc-peace.html`), but their saved HTML is a JavaScript application shell, so it is **not evidence** for series details. The fully rendered NGC original articles and melt table above supply those details. NIST SP 811 was also fetched (`nist-sp811.pdf` and `.txt`); its table rounds the troy-ounce conversion, so MP 286 supplies the exact conversion instead.

## Blocked sources — not evidence

These saved responses are HTTP 403 Cloudflare challenge pages, checked **14 Nov 2026**. They were not used to support claims, even where web-search extracts were readable.

| Saved response | Requested URL |
| --- | --- |
| [mint-history.html](mint-history.html) | https://www.usmint.gov/learn/history/historic-coin-production |
| [mint-dollars.html](mint-dollars.html) | https://www.usmint.gov/news/inside-the-mint/one-hundred-years-of-silver-dollar-coinage-1878-1978 |
| [mint-quarter.html](mint-quarter.html) | https://www.usmint.gov/learn/coins-and-medals/circulating-coins/quarter |
| [mint-nickel.html](mint-nickel.html) | https://www.usmint.gov/learn/coins-and-medals/circulating-coins/nickel |
| [mint-bicentennial.html](mint-bicentennial.html) | https://www.usmint.gov/news/press-releases/19750805-bicentennial-silver-proof-sets |
| [mint-specs.html](mint-specs.html) | https://www.usmint.gov/learn/coin-and-medal-programs/coin-specifications |
| [mint-marks.html](mint-marks.html) | https://www.usmint.gov/content/usmint/us/en/learn/collecting-basics/mint-marks.html |
| [mint-bicentennial-sets.html](mint-bicentennial-sets.html) | https://www.usmint.gov/content/usmint/us/en/learn/history/historical-documents/public-demand-for-bicentennial-coins-sets-records.html |
| [mint-eagles.html](mint-eagles.html) | https://www.usmint.gov/content/usmint/us/en/coins/coin-medal-programs/american-eagle/silver-bullion.html |
| [pcgs-washington.html](pcgs-washington.html) | https://www.pcgs.com/coinfacts/category/washington-quarter-1932-1998/112 |
| [pcgs-roosevelt.html](pcgs-roosevelt.html) | https://www.pcgs.com/coinfacts/category/roosevelt-dime-1946-date/98 |
| [pcgs-war.html](pcgs-war.html) | https://www.pcgs.com/coinfacts/category/nickels/jefferson-nickel-1938-date/type-2-silver-alloy-1942-1945/679 |
| [pcgs-guide.html](pcgs-guide.html) | https://www.pcgs.com/prices |

Alternate U.S. Mint `/content/usmint/us/en/` paths, non-www hostnames, and trailing-slash variants were also tried with the same 403 result. Redundant challenge responses were discarded. Because a fetched U.S. Mint source could not confirm the optional details, the guides omit the 1976 40% quarter collector exception and the Eisenhower/Silver Eagle comparisons. PCGS is linked as a reader's price-guide option, with no content or prices attributed to its blocked pages.

The old `../sources/usmint.html` challenge page was ignored.

## Derived figures and local behavior

- Article silver quantities come directly from `coinOzt()` using the existing `COINS` weights/fineness in `src/calc.js`, rounded to five decimal places. Internal calculations retain full precision. This is a derivation from the fetched weight/fineness and troy-ounce conversion sources.
- The $10 face example represents 40 quarters by denomination arithmetic; it is not a market price. Its link is `/?q=10&f=q`.
- Entry modes, dealer percentages, offer comparisons, the optional .715 worn-coin setting, price refresh timing, rounding, and embed dimensions describe the existing implementation (`src/calc.js`, `src/app.js`, `scripts/fetch-spot.mjs`, `.github/workflows/spot.yml`, `src/pages.mjs`). No claim that .715 is a measured weight or a universally used dealer rate is added.
- Original source archive pages/PDFs contain prices. Those pages are outside `static/` and `public/` and are not published. New guide HTML contains no fixed market values, dealer quotes, search volumes, affiliate links or externally loaded assets.

Other successful fetches, checked 14 Nov 2026 (not used for the guide facts):

| Saved file | URL | Limitation |
| --- | --- | --- |
| `ngc-nickels.html` | https://www.ngccoin.com/coin-explorer/united-states/nickels/jefferson-five-cents-1938-date/ | HTTP 200 application shell; use the fetched Lange article instead. |
| `ngc-morgan.html` | https://www.ngccoin.com/coin-explorer/united-states/dollars/morgan-dollars-1878-1921/ | HTTP 200 application shell; use NGC's fetched centennial history instead. |
| `ngc-peace.html` | https://www.ngccoin.com/coin-explorer/united-states/dollars/peace-dollars-1921-1935/ | HTTP 200 application shell; use NGC's fetched centennial history instead. |
| `nist-sp811.pdf` and `.txt` | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication811e2008.pdf | HTTP 200; Appendix B lists a rounded troy-ounce conversion. MP 286 confirms all digits used by the app. |
