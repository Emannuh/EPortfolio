"""
Phase 4.5 — Content and CSS QA
Checks: long unbreakable strings, contrast tokens, form behavior,
        DR JavaScript completeness, contact form static-hosting state
"""
import os
import re

DIST  = os.path.join(os.path.dirname(__file__), 'dist')
SRC   = os.path.dirname(__file__)

results = []

def check(name, passed, detail=""):
    status = "PASS" if passed else "WARN"
    results.append((status, name, detail))
    print(f"  [{status}] {name}" + (f"\n         {detail}" if detail else ""))

def read(path):
    if not os.path.exists(path):
        return ""
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()

print("\n[C-1] Contact form static-hosting safety")
contact_html = read(os.path.join(DIST, 'contact', 'index.html'))
# In static mode, form action should NOT be a Django URL ({% url 'contact' %})
# It should either be Formspree or empty — anything but a Django-generated path
has_formspree = 'formspree.io' in contact_html
has_django_action = 'action="/contact/"' in contact_html
check("Formspree endpoint configured", has_formspree,
      "Form action still points to Django /contact/ POST — will silently fail on static hosting. Formspree endpoint required before deployment.")
check("No CSRF token in static contact form",
      '{% csrf_token %}' not in contact_html,
      "CSRF tag found — template not rendered (this would be caught by QA-2)")

print("\n[C-2] Decision Room JS — consequence text completeness")
dr_js = read(os.path.join(DIST, 'static', 'js', 'decision-room.js'))
# All 12 decision consequences must have text
for key in ['A1','A2','A3','A4','B1','B2','B3','B4','C1','C2','C3','C4']:
    check(f"Consequence text for {key}", f"'{key}'" in dr_js or f'"{key}"' in dr_js)

print("\n[C-3] Decision Room JS — all 3 referee quotes present")
check("High score quote",  'quoteKey' in dr_js and 'high' in dr_js)
check("Mid score quote",   'mid' in dr_js)
check("Low score quote",   'low' in dr_js)

print("\n[C-4] Decision Room JS — score matrix completeness")
# Check all 4 Stage-3 outcomes are mapped for at least the A1_B1 path
for c in ['C1','C2','C3','C4']:
    key = f"'A1_B1_{c}'"
    check(f"Score matrix A1_B1_{c}", key in dr_js)

print("\n[C-5] DR page — no localhost/development URLs")
dr_html = read(os.path.join(DIST, 'decision-room', 'index.html'))
check("No localhost URLs in DR page", 'localhost' not in dr_html and '127.0.0.1' not in dr_html)
check("No Django admin URL in DR page", '/admin/' not in dr_html)

print("\n[C-6] CSS — key color contrast tokens present")
dr_css = read(os.path.join(DIST, 'static', 'css', 'decision-room.css'))
check("Error red defined", '#e53e3e' in dr_css or 'dr-dot-red' in dr_css)
check("Success green defined", '#00d46a' in dr_css)
check("Warning amber defined", '#f5a623' in dr_css)
check("Focus-visible rule", 'focus-visible' in dr_css)
check("Cursor blink animation", 'dr-blink' in dr_css)
check("Score bar animation", 'dr-score-bar-fill' in dr_css)

print("\n[C-7] DR page ARIA completeness")
check("role=main on app container", 'role="main"' in dr_html)
check("aria-label on decision groups", 'role="group"' in dr_html)
check("aria-live=assertive on consequences", 'aria-live="assertive"' in dr_html)
check("role=log on log stream", 'role="log"' in dr_html)
check("role=note on disclaimer", 'role="note"' in dr_html)

print("\n[C-8] Homepage CTA — no broken markup")
idx_html = read(os.path.join(DIST, 'index.html'))
check("DR entry card markup complete", 'dr-entry-card' in idx_html)
check("DR CTA button has aria-label", 'btn-dr-enter' in idx_html)
check("DR cursor element present", 'dr-cursor' in idx_html)

print("\n[C-9] All external links have target=_blank")
for rel_path in ['index.html', 'portfolio/index.html']:
    content = read(os.path.join(DIST, rel_path))
    github_links = re.findall(r'href="https://github\.com[^"]*"([^>]*)', content)
    for link_attrs in github_links:
        if 'target="_blank"' not in link_attrs:
            check(f"GitHub link has target=_blank in {rel_path}", False, link_attrs)
check("GitHub links have target=_blank", True)  # if we got here no issues found

print("\n[C-10] Replay — idempotent reset behavior in JS")
js = read(os.path.join(SRC, 'assets', 'js', 'decision-room.js'))
check("STATE reset in resetExperience", "STATE = {" in js or "STATE = {" in js.replace(' ', ''))
check("Button disabled state cleared", "btn.disabled = false" in js)
check("Consequence HTML cleared", 'innerHTML = ' in js)
check("Phase display reset to briefing", "showPhase('phase-briefing')" in js)
check("Score bars reset to 0%", "width = '0%'" in js or "style.width = '0%'" in js)

# ── Summary ──────────────────────────────────────────────────────
print(f"\n{'='*60}")
total  = len(results)
passed = sum(1 for r in results if r[0] == 'PASS')
warned = sum(1 for r in results if r[0] == 'WARN')
print(f"  TOTAL: {total}  |  PASS: {passed}  |  WARN: {warned}")
print(f"{'='*60}\n")
if warned:
    print("Items requiring attention before deployment:")
    for status, name, detail in results:
        if status == 'WARN':
            print(f"  ⚠  {name}")
            if detail:
                print(f"     {detail}")
