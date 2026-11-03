"""
Phase 4.5 — Automated QA Script
Runs all static-site checks and prints a structured report.
Usage: python qa_checks.py
"""
import os
import re
import json
import sys

DIST = os.path.join(os.path.dirname(__file__), 'dist')
ASSETS_JS = os.path.join(os.path.dirname(__file__), 'assets', 'js')

results = []

def check(name, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    results.append((status, name, detail))
    print(f"  [{status}] {name}" + (f"\n         {detail}" if detail and not passed else ""))

def get_html_files():
    pages = {}
    for root, dirs, files in os.walk(DIST):
        for f in files:
            if f.endswith('.html'):
                path = os.path.join(root, f)
                rel = os.path.relpath(path, DIST).replace('\\', '/')
                with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
                    pages[rel] = fh.read()
    return pages

# ── Load all pages ──────────────────────────────────────────────
pages = get_html_files()
print(f"\n{'='*60}")
print(f"  Phase 4.5 QA — {len(pages)} exported pages found")
print(f"{'='*60}\n")

# QA-1: Page count
print("[QA-1] Page count")
expected = {'index.html', 'about/index.html', 'resume/index.html',
            'portfolio/index.html', 'portfolio-details/index.html',
            'services/index.html', 'service-details/index.html',
            'contact/index.html', 'decision-room/index.html'}
actual = set(pages.keys())
missing_pages = expected - actual
check("All 9 pages exported", len(missing_pages) == 0,
      f"Missing: {missing_pages}" if missing_pages else "")

# QA-2: No Django template tags
print("\n[QA-2] Django template tag leakage")
tag_re = re.compile(r'\{[%{]')
for rel, content in pages.items():
    check(f"No template tags in {rel}", not tag_re.search(content),
          f"Raw Django tags found")

# QA-3: Static asset resolution
print("\n[QA-3] Static asset resolution")
asset_re = re.compile(r'(?:src|href)="(/static/[^"]+)"')
missing_assets = []
found_assets = set()
for rel, content in pages.items():
    for ref in asset_re.findall(content):
        local = os.path.join(DIST, ref.lstrip('/').replace('/', os.sep))
        if os.path.exists(local):
            found_assets.add(ref)
        else:
            missing_assets.append((rel, ref))
check(f"All static assets present ({len(found_assets)} unique refs)",
      len(missing_assets) == 0,
      f"Missing: {missing_assets[:5]}" if missing_assets else "")

# QA-4: Key assets specifically
print("\n[QA-4] Key asset spot-checks")
key_assets = [
    '/static/css/main.css',
    '/static/css/decision-room.css',
    '/static/js/main.js',
    '/static/js/decision-room.js',
    '/static/vendor/bootstrap/css/bootstrap.min.css',
    '/static/vendor/bootstrap-icons/bootstrap-icons.css',
    '/static/vendor/aos/aos.js',
    '/static/vendor/typed.js/typed.umd.js',
    '/static/vendor/isotope-layout/isotope.pkgd.min.js',
    '/static/img/profile/emmanuel-maingi.jpg',
]
for asset in key_assets:
    local = os.path.join(DIST, asset.lstrip('/').replace('/', os.sep))
    check(asset, os.path.exists(local))

# QA-5: Internal link resolution
print("\n[QA-5] Internal link resolution")
link_re = re.compile(r'href="(/[a-z0-9\-/]*)"')
external_re = re.compile(r'^https?://|^mailto:|^#|^/static/')
broken_links = []
for rel, content in pages.items():
    for href in link_re.findall(content):
        if external_re.match(href):
            continue
        if href == '/':
            local = os.path.join(DIST, 'index.html')
        else:
            local = os.path.join(DIST, href.strip('/').replace('/', os.sep), 'index.html')
        if not os.path.exists(local):
            broken_links.append((rel, href))
check(f"All internal links resolve",
      len(broken_links) == 0,
      f"Broken: {broken_links}" if broken_links else "")

# QA-6: Decision Room structural completeness
print("\n[QA-6] Decision Room structure")
dr = pages.get('decision-room/index.html', '')
check("Disclaimer banner present", 'SIMULATION ONLY' in dr)
check("Phase 0 briefing panel", 'id="phase-briefing"' in dr)
check("Phase 1 panel", 'id="phase-1"' in dr)
check("Phase 2 panel", 'id="phase-2"' in dr)
check("Phase 3 panel", 'id="phase-3"' in dr)
check("Phase 4 report panel", 'id="phase-report"' in dr)
check("Start button", 'id="btn-start"' in dr)
check("Replay button", 'id="btn-replay"' in dr)
for d in ['A1','A2','A3','A4','B1','B2','B3','B4','C1','C2','C3','C4']:
    check(f"Decision button {d}", f'data-decision="{d}"' in dr)
check("Stage 1 next button", 'id="btn-next-1"' in dr)
check("Stage 2 next button", 'id="btn-next-2"' in dr)
check("Stage 3 next button", 'id="btn-next-3"' in dr)
check("Score elements present", 'id="score-reliability"' in dr)
check("Timeline element present", 'id="timeline-items"' in dr)
check("Lessons element present", 'id="lessons-list"' in dr)
check("Referee quote element", 'id="referee-quote"' in dr)
check("JS loaded", 'decision-room.js' in dr)
check("CSS loaded", 'decision-room.css' in dr)
check("ARIA live regions", 'aria-live' in dr)
check("All buttons have aria-label", dr.count('aria-label') >= 15)

# QA-7: Homepage CTA
print("\n[QA-7] Homepage Decision Room CTA")
idx = pages.get('index.html', '')
check("DR entry section present", 'dr-entry-section' in idx)
check("Enter CTA button", 'Enter the Decision Room' in idx)
check("Timestamp teaser", '02:47 UTC' in idx)
check("Link to /decision-room/", '/decision-room/' in idx)

# QA-8: Navigation completeness
print("\n[QA-8] Navigation — Decision Room nav item on all pages")
for rel, content in pages.items():
    check(f"DR nav item in {rel}", 'Decision Room' in content and '/decision-room/' in content)

# QA-9: Skip link and accessibility structure
print("\n[QA-9] Accessibility structure")
for rel, content in pages.items():
    check(f"Skip link in {rel}", 'skip-link' in content)
    check(f"main#main-content in {rel}", 'id="main-content"' in content)

# QA-10: Content integrity checks
print("\n[QA-10] Content integrity")
check("Contact email present", 'Emhmanuh@gmail.com' in pages.get('contact/index.html',''))
check("GitHub link present", 'github.com/Emannuh' in pages.get('index.html',''))
check("LinkedIn link present", 'linkedin.com' in pages.get('index.html',''))
check("CCI Global in resume", 'CCI Global' in pages.get('resume/index.html',''))
check("FKFSYS in portfolio", 'FKFSYS' in pages.get('portfolio/index.html',''))
check("Certifications in resume", 'KCNA' in pages.get('resume/index.html',''))

# QA-11: JS syntax check (basic — look for obvious truncation)
print("\n[QA-11] JavaScript file integrity")
dr_js = os.path.join(DIST, 'static', 'js', 'decision-room.js')
if os.path.exists(dr_js):
    with open(dr_js, 'r', encoding='utf-8') as f:
        js_content = f.read()
    check("decision-room.js non-empty", len(js_content) > 5000,
          f"File size: {len(js_content)} chars")
    check("SCENARIO object present", 'const SCENARIO' in js_content)
    check("STATE object present", 'let STATE' in js_content)
    check("init() function present", 'function init()' in js_content)
    check("resetExperience present", 'function resetExperience()' in js_content)
    check("calculateScores present", 'function calculateScores()' in js_content)
    check("renderReport present", 'function renderReport()' in js_content)
    check("Score matrix A1_B1_C1 present", "'A1_B1_C1'" in js_content)
    check("Score matrix A4_B4_C4 present", "'A4_B4_C4'" in js_content)
    check("Referee quote high path", 'quoteKey' in js_content)
    check("Test harness exported", '__DR_TEST__' in js_content)
else:
    check("decision-room.js exists in dist", False, "File not found")

# QA-12: Score calculation logic verification (Python mirror)
print("\n[QA-12] Score calculation logic")
SCORE_MATRIX = {
    'A1_B1_C1': [95, 82, 98],
    'A2_B1_C1': [95, 82, 96],
    'A1_B1_C4': [18, 30, 14],
    'A3_B1_C1': [80, 52, 60],
    'A4_B1_C1': [74, 68, 54],
    'A4_B4_C4': [10, 16,  6],
    'A1_B2_C3': [58, 96, 68],
    'A1_B1_C2': [68, 42, 62],
}

def overall(r, s, q):
    return round(r * 0.4 + s * 0.3 + q * 0.3)

def verdict(score):
    if score >= 85: return 'Incident Commander'
    if score >= 70: return 'Reliable Engineer'
    if score >= 50: return 'Learning Curve'
    return 'Postmortem Required'

opt = overall(*SCORE_MATRIX['A1_B1_C1'])
check(f"Optimal path >= 85 (got {opt})", opt >= 85)
check("Optimal verdict = Incident Commander", verdict(opt) == 'Incident Commander')
nothing = overall(*SCORE_MATRIX['A1_B1_C4'])
check(f"Do-nothing < 30 (got {nothing})", nothing < 30)
check("Do-nothing verdict = Postmortem Required", verdict(nothing) == 'Postmortem Required')
worst = overall(*SCORE_MATRIX['A4_B4_C4'])
check(f"Worst path < 20 (got {worst})", worst < 20)
premature = overall(*SCORE_MATRIX['A3_B1_C1'])
check(f"Premature rollback < optimal ({premature} < {opt})", premature < opt)

# ── QA-13: Mobile CSS checks (structural) ──
print("\n[QA-13] Responsive CSS — viewport meta and breakpoints")
for rel, content in pages.items():
    check(f"Viewport meta in {rel}", 'width=device-width' in content)

dr_css = os.path.join(DIST, 'static', 'css', 'decision-room.css')
if os.path.exists(dr_css):
    with open(dr_css, 'r') as f:
        css = f.read()
    check("Mobile breakpoint 991px", '991px' in css)
    check("Mobile breakpoint 575px", '575px' in css)
    check("Reduced-motion query", 'prefers-reduced-motion' in css)
    check("Decision grid responsive", 'grid-template-columns: 1fr' in css)

# ── Summary ─────────────────────────────────────────────────────
print(f"\n{'='*60}")
total  = len(results)
passed = sum(1 for r in results if r[0] == 'PASS')
failed = sum(1 for r in results if r[0] == 'FAIL')
print(f"  TOTAL: {total}  |  PASS: {passed}  |  FAIL: {failed}")
print(f"{'='*60}\n")

if failed > 0:
    print("FAILED CHECKS:")
    for status, name, detail in results:
        if status == 'FAIL':
            print(f"  ✗ {name}")
            if detail:
                print(f"    {detail}")
    sys.exit(1)
else:
    print("All automated checks passed.")
    sys.exit(0)
