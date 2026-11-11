"""Counsel-locked text check for the two pages counsel cleared on 2026-11-02 (LEG-049, LEG-050).

Reads the BUILT HTML of each page, reduces it to visible text (tags removed, entities decoded,
whitespace collapsed, script and style dropped) and checks that every counsel-locked sentence is
present verbatim and every sentence counsel ordered removed is absent.

The expected strings below are copied from counsel's 2026-11-02 email as recorded in the Standing
Decisions; they are NOT read from the copy deck, so this check is independent of the generator.

Usage: python3 -I counsel_lock_check.py <trainerize-alternatives index.html> <pricing guide index.html>
Pass - in place of either path to skip that page's checks (e.g. when only one page is built yet).
When the Trainerize page is checked, --checked "<Month D, YYYY>" is REQUIRED: notice 2's date must
equal it exactly (added 2026-11-02 after a verifier showed the date was not locked).
Exit code 0 only if every check that ran passes.
"""
import html
import re
import sys
from html.parser import HTMLParser


class Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.out = []

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.skip:
            self.skip -= 1

    def handle_data(self, d):
        if not self.skip:
            self.out.append(d)


def visible_text(path):
    p = Text()
    p.feed(open(path, encoding="utf-8").read())
    return re.sub(r"\s+", " ", html.unescape(" ".join(p.out))).strip()


results = []


def check(name, ok, detail=""):
    results.append((ok, name, detail))


def present(text, label, s):
    n = text.count(s)
    check(f"{label}: present verbatim", n >= 1, f"count={n} :: {s[:90]}")


def absent(text, label, s):
    n = text.count(s)
    check(f"{label}: absent", n == 0, f"count={n} :: {s[:90]}")


args = sys.argv[1:]
CHECKED = None
if "--checked" in args:
    i = args.index("--checked")
    CHECKED = args[i + 1]
    del args[i:i + 2]
ta_path, pg_path = args[0], args[1]


def run_ta(ta_path):
    TA = visible_text(ta_path)
    present(TA, "TA notice 1", "This page is published by Wolvec, which offers competing software for fitness coaches. Wolvec is not affiliated with, sponsored by, or endorsed by the companies named on this page. Third-party names and marks belong to their respective owners.")
    n2 = re.findall(r"Information checked ([A-Z][a-z]+ \d{1,2}, \d{4})\. Products, features and prices can change\. Verify current details with each provider\.", TA)
    check("TA notice 2: template present exactly once", len(n2) == 1, f"dates={n2}")
    check("TA notice 2: date equals --checked date (required for the TA page)",
          CHECKED is not None and n2 == [CHECKED], f"page={n2} expected={CHECKED!r}")
    present(TA, "TA notice 3", "Wolvec does not currently publish pricing. The prices below are provided as current competitor information, not as a claim that Wolvec is cheaper or more expensive.")
    present(TA, "TA counsel edit Q2 (Wolvec billing sentence)", "Wolvec does not currently publish pricing, and this page makes no statement about whether any Wolvec feature is included in a base price or carries a separate charge.")
    absent(TA, "TA old Q2 sentence", "makes no statement about how Wolvec bills for its AI")
    present(TA, "TA counsel edit Q3 (FitMetrics conflict wording)", "Trainerize's public pages currently describe FitMetrics pricing differently, so this page does not state a FitMetrics price. Check Trainerize for current pricing.")
    present(TA, "TA counsel Q3 kept fact (paid add-on)", "FitMetrics is a paid add-on.")
    for s in ("$149", "$0.10", "$6/client", "$6 per client", "$150", "MCP call"):
        absent(TA, "TA FitMetrics price fragment", s)
    present(TA, "TA counsel Q6 currency wording", "Shown as $, no currency code")
    check("TA no em or en dash in visible text", not re.search("[–—]", TA))
    check("TA no em or en dash anywhere in the raw HTML (title, meta, JSON-LD included)",
          not re.search("[–—]", open(ta_path, encoding="utf-8").read()))
    for w in ("cheapest", "better value", "saves you", "more affordable", "#1", "unbiased", "independent review"):
        absent(TA, "TA banned comparative", w)
    TA_RAW = open(ta_path, encoding="utf-8").read()
    cells = [re.sub(r"<[^>]+>", "", c).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", TA_RAW, re.S)]
    check("TA table cells found", len(cells) >= 40, f"cells={len(cells)}")
    bad = [c for c in cells if re.match(r"No\b", c)]
    check("TA no table cell starting with 'No' (counsel: use 'Not verified')", not bad, f"{bad[:3]}")
    nv = sum(1 for c in cells if c == "Not verified")
    check("TA 'Not verified' cells present", nv >= 1, f"count={nv}")



def run_pg(pg_path):
    PG = visible_text(pg_path)
    present(PG, "PG counsel edit 1 (price changes)", "Review your prices on the date you set, and when you are full or have a waitlist, your costs go up, or you earn a new credential. Before changing the price for an existing agreement, prepaid package or recurring plan, ask an attorney what your agreement and applicable law permit. If the change is permitted, tell clients clearly in writing what is changing and when, using any notice or consent process your attorney says applies.")
    absent(PG, "PG old price-change wording", "is a question to settle with your attorney before you announce it")
    present(PG, "PG counsel edit 2 (starting price)", "You can choose whether to show full prices or a genuine starting price. If you show a starting price, make sure the described service is actually available at that price, and check the price-disclosure rules where you sell if mandatory fees or charges apply. Make what each package includes and what the client will pay clear before anyone pays.")
    absent(PG, "PG old starting-price wording", "is your call")
    present(PG, "PG counsel edit 3 (competitor prices)", "If a price is not published to prospective customers, note it as unknown. Use public customer-facing prices for the comparison, and set your own prices independently.")
    present(PG, "PG counsel optional line", "Do not coordinate prices, discounts or future pricing with other trainers.")
    absent(PG, "PG removed 'ask what it costs'", "ask what is included and what it costs")
    present(PG, "PG approved renewal line", "if billing renews, how it renews and how to cancel")
    present(PG, "PG approved Before you sell passage", "rules on prepaid packages, session expiry, cancellation, refunds, contract length and automatic renewal of recurring billing differ from place to place, and if you coach online your clients may be in a different state from you. Whether a health studio or fitness contract law applies to you is another question to check. Ask an attorney which rules apply before you sell, and do not copy another trainer's terms.")
    present(PG, "PG agreement sentence (earlier counsel text)", "Use a written agreement that covers the services provided, payment and cancellation terms, and the scope and limits of the coaching relationship. Have an attorney review it.")
    check("PG no em or en dash in visible text", not re.search("[–—]", PG))
    check("PG no em or en dash anywhere in the raw HTML (title, meta, JSON-LD included)",
          not re.search("[–—]", open(pg_path, encoding="utf-8").read()))



if ta_path != "-":
    run_ta(ta_path)
if pg_path != "-":
    run_pg(pg_path)
check("at least one page checked", ta_path != "-" or pg_path != "-")

fails = [r for r in results if not r[0]]
for ok, name, detail in results:
    print(("PASS" if ok else "FAIL") + "  " + name + ("  :: " + detail if detail else ""))
print(f"\n{len(results) - len(fails)} of {len(results)} checks pass")
sys.exit(1 if fails else 0)
