# tasks.md
# The Engineer's Decision Room — Implementation Task List
# AWS Student Builder Challenge 2026

**Deadline:** November 6, 2026  
**Days remaining at Phase 3 start:** 4  

Priority:
- P0: Mandatory hackathon requirements — blocking if incomplete
- P1: Creative experience and important improvements — high impact
- P2: Optional enhancements — implement only if time permits

---

## PHASE 3: PORTFOLIO ENHANCEMENT

### TASK-001 — Create challenge branch (P0)
**File:** git  
**Action:** `git checkout -b challenge` from main  
**Risk:** Low  
**Rollback:** `git checkout main`  
**Acceptance:** Branch exists, all existing files intact, `python manage.py check` passes  

---

### TASK-002 — Environment variable configuration (P0)
**Files:** `config/settings.py`, `requirements.txt`, `.env.example`, `.gitignore`  
**Action:**  
- Add `python-decouple==3.8` to requirements.txt  
- Replace hardcoded SECRET_KEY with `config('DJANGO_SECRET_KEY')`  
- Add `DEBUG = config('DJANGO_DEBUG', default=True, cast=bool)`  
- Add `ALLOWED_HOSTS = config('DJANGO_ALLOWED_HOSTS', default='127.0.0.1,localhost').split(',')`  
- Create `.env.example` with documented placeholders  
- Ensure `.env` is in `.gitignore`  
**Risk:** Low — decouple falls back to defaults if .env absent  
**Rollback:** Revert settings.py  
**Acceptance:** `python manage.py check` still passes, SECRET_KEY not in source  

---

### TASK-003 — Install and configure dependencies (P0)
**Files:** `requirements.txt`  
**Action:** Add `django-distill==4.0.6`, `whitenoise==6.12.0`, `python-decouple==3.8`  
**Note:** Install only after branch creation and approval  
**Risk:** Low — all packages are stable, well-maintained  
**Rollback:** Revert requirements.txt, uninstall packages  
**Acceptance:** `pip install -r requirements.txt` succeeds, `import django_distill` works  

---

### TASK-004 — Configure WhiteNoise for static serving (P0)
**Files:** `config/settings.py`  
**Action:**  
- Add WhiteNoise to MIDDLEWARE (after SecurityMiddleware)  
- Set `STATIC_ROOT = BASE_DIR / 'staticfiles'`  
- Add `STATICFILES_STORAGE` for compressed static files  
**Risk:** Low  
**Acceptance:** `python manage.py collectstatic` completes without errors  

---

### TASK-005 — Replace profile photo (P0 — user action required)
**Files:** `assets/img/profile/emmanuel-maingi.jpg`  
**Action:** User replaces 5.1KB blurry photo with high-resolution version (800×1000px minimum)  
**Risk:** If not replaced, profile photo remains blurry on live site  
**Acceptance:** Photo renders sharply at 520px tall hero display  

---

### TASK-006 — Add skip-to-main and ARIA improvements (P1)
**Files:** `templates/base.html`  
**Action:**  
- Add `<a href="#main-content" class="skip-link">Skip to main content</a>` at top of body  
- Add `id="main-content"` to `<main>` tag  
- Verify all nav links have descriptive text  
**Risk:** Zero — additive only  
**Acceptance:** Tab key first reaches skip link, focus visible, screen reader announces landmark  

---

### TASK-007 — Add reduced-motion CSS override (P1)
**Files:** `assets/css/main.css`  
**Action:** Add `@media (prefers-reduced-motion: reduce)` block disabling animations and AOS  
**Risk:** Zero — progressive enhancement  
**Acceptance:** Site remains fully navigable with system reduced-motion setting enabled  

---

### TASK-008 — Add football referee section to About (P1)
**Files:** `templates/about.html`  
**Action:** Add "Beyond the Terminal" block after skills grid, before timeline  
- Content: certified national football referee, composure/judgment/accountability themes  
- Visual: dark card with football icon, quote, connection to engineering mindset  
**Risk:** Low — additive only  
**Acceptance:** Section visible on /about/, responsive on mobile, no existing content displaced  

---

### TASK-009 — Add Decision Room nav item (P1)
**Files:** `templates/base.html`  
**Action:**  
- Add `<li><a href="/decision-room/">Decision Room <span class="dr-badge">Try</span></a></li>`  
- Style badge with amber accent  
- Add `decision-room` to URL name check for active state  
**Risk:** Low — additive nav item  
**Acceptance:** Visible in desktop and mobile nav, links to /decision-room/, active state works  

---

### TASK-010 — Add Decision Room entry CTA to homepage (P1)
**Files:** `templates/index.html`  
**Action:** Add terminal-style CTA block below hero section  
- Dark card with blinking cursor, electric blue border, "Enter the Decision Room" button  
- Brief teaser: "02:47 UTC. Production is down. You're on call."  
- Respects prefers-reduced-motion (no cursor blink)  
**Risk:** Zero — additive block  
**Acceptance:** CTA visible on homepage, links to /decision-room/, renders on mobile  

---

## PHASE 4: THE ENGINEER'S DECISION ROOM

### TASK-011 — Create Decision Room URL and view (P0)
**Files:** `portfolio/urls.py`, `portfolio/views.py`  
**Action:**  
- Add `path('decision-room/', views.decision_room, name='decision-room')` to urls.py  
- Add `decision_room` view function (returns template render)  
**Risk:** Low  
**Acceptance:** `/decision-room/` returns HTTP 200, no template errors  

---

### TASK-012 — Build decision-room.css (P0)
**Files:** `assets/css/decision-room.css`  
**Action:** Write isolated stylesheet for Decision Room only  
- Terminal/monospace aesthetic  
- Status indicator lights (green/amber/red)  
- Metric panels, log stream, decision buttons  
- Mobile-responsive layout  
- Reduced-motion overrides  
- No modifications to main.css  
**Risk:** Low — isolated file  
**Acceptance:** DR page renders correctly without affecting any other page  

---

### TASK-013 — Build decision-room.html template (P0)
**Files:** `templates/decision-room.html`  
**Action:** Create full Decision Room template extending base.html  
- Briefing screen (intro, scenario setup, fictional data disclaimer)  
- Stage 1: Situation Assessment (4 decision buttons)  
- Stage 2: Investigation (simulated metrics, logs, diff, 4 decisions)  
- Stage 3: Response (4 decision buttons, consequence shown)  
- Incident Report (scores, verdict, referee connection, replay button)  
- All panels start hidden; JavaScript controls visibility  
- ARIA live regions on dynamic content  
**Risk:** Medium — most complex template in project  
**Acceptance:** All 4 stages render, all 12 decision buttons visible per stage, report displays  

---

### TASK-014 — Build decision-room.js state machine (P0)
**Files:** `assets/js/decision-room.js`  
**Action:** Implement complete vanilla JS state machine  
- SCENARIO constant with all stages, decisions, consequences, score matrix  
- STATE object tracking current stage and choices  
- renderStage(), handleDecision(), calculateScore(), renderReport(), resetExperience()  
- Score calculation must be deterministic (same choices = same scores, always)  
- Animated log stream (typewriter effect on log lines)  
- Score bars animate on report screen  
- Replay resets DOM and STATE completely  
**Risk:** High — most complex piece of code in project. Mitigate with thorough path testing  
**Acceptance:** All 8+ decision paths produce correct scores; replay fully resets experience  

---

### TASK-015 — Test all Decision Room paths (P0)
**Action:** Manually walk every combination of A1–A4 × B1–B4 × C1–C4  
- Verify score matrix output matches design.md  
- Verify consequence messages display correctly  
- Verify replay resets state completely  
- Test on mobile viewport (320px width)  
- Test keyboard navigation (Tab to each button, Enter to select)  
**Risk:** Catches logic errors before deployment  
**Acceptance:** All paths produce expected scores; no console errors; mobile usable  

---

## PHASE 5: STATIC EXPORT AND AWS AMPLIFY

### TASK-016 — Convert URL routes to distill_path (P0)
**Files:** `portfolio/urls.py`  
**Action:**  
- Replace `path` imports with `distill_path` from `django_distill`  
- Each route uses `distill_path(..., distill_func=None)` for parameterless routes  
- Exclude `/admin/` (handled by Django, not distill)  
- Update `/contact/` to use distill_path but template uses Formspree not Django POST  
**Risk:** Medium — existing URL patterns must keep their `name` attributes unchanged  
**Acceptance:** All names unchanged; `python manage.py distill-local dist/ --force` completes  

---

### TASK-017 — Replace contact form with Formspree (P0)
**Files:** `templates/contact.html`  
**Action:**  
- Register free Formspree account, get endpoint URL  
- Replace `action="{% url 'contact' %}"` with `action="https://formspree.io/f/ENDPOINT"`  
- Replace `method="post"` with `method="POST"` and add `enctype`  
- Remove `{% csrf_token %}` (not needed with Formspree)  
- Remove `{% if messages %}` block  
- Add JavaScript success/error handling using Formspree's AJAX response  
- In Django dev mode: test that form still renders (POST goes to Formspree in all modes)  
**Risk:** Medium — contact form is user-facing functionality  
**Acceptance:** Form submits successfully in both Django dev and static modes; success message shown  
**Prerequisite:** User creates Formspree account and provides endpoint  

---

### TASK-018 — Configure STATIC_ROOT and test collectstatic (P0)
**Files:** `config/settings.py`  
**Action:** Verify STATIC_ROOT is set, run `python manage.py collectstatic --noinput`  
**Risk:** Low  
**Acceptance:** staticfiles/ directory populated, no missing asset errors  

---

### TASK-019 — Run django-distill local export and verify (P0)
**Files:** Generated `dist/` directory  
**Action:**  
- Run `python manage.py distill-local dist/ --force`  
- Verify all 9 pages exported (index, about, resume, portfolio, portfolio-details, services, service-details, contact, decision-room)  
- Open dist/index.html in browser — verify it renders correctly  
- Check all internal links resolve to correct static paths  
- Verify assets (CSS, JS, images) load in static mode  
**Risk:** Medium — first full static export; may expose path issues  
**Acceptance:** All 9 pages render without errors in browser from dist/ directory  

---

### TASK-020 — Create amplify.yml (P0)
**Files:** `amplify.yml` (project root)  
**Action:** Write Amplify build specification per design.md section 6.3  
**Risk:** Low  
**Acceptance:** YAML is valid; build spec matches Amplify documentation format  

---

### TASK-021 — Push challenge branch to GitHub and verify repo is public (P0)
**Action:**  
- Push `challenge` branch to GitHub  
- Verify repository is public (Settings → Change visibility)  
- Verify GitHub link on portfolio points to correct public repo  
**Risk:** Low  
**Acceptance:** Repo accessible at github.com/Emannuh without login  

---

### TASK-022 — Connect GitHub to AWS Amplify and deploy (P0)
**Action:**  
- Create new Amplify app in AWS Console  
- Connect to GitHub repository, select `challenge` branch  
- Configure environment variables (SECRET_KEY, DEBUG=false, ALLOWED_HOSTS)  
- Trigger first build  
- Monitor build log for errors  
**Risk:** High — first deployment, path issues may appear  
**Acceptance:** Build completes with exit 0; public URL accessible; all pages load; no broken assets  

---

### TASK-023 — Verify live Amplify deployment (P0)
**Action:** Open Amplify URL in browser and verify:  
- All 9 pages load (no 404s)  
- CSS and JS load (no unstyled pages)  
- Profile photo displays (no broken image)  
- Decision Room works end-to-end  
- Contact form submits via Formspree  
- All GitHub project links open correctly  
- Site is responsive on mobile (Chrome DevTools)  
**Risk:** Catch deployment issues before submission  
**Acceptance:** 100% of items above confirmed working  

---

## PHASE 6 & 7: QA AND SUBMISSION

### TASK-024 — Keyboard and accessibility audit (P1)
**Action:**  
- Tab through entire site — verify all interactive elements reachable  
- Verify skip-to-main link functions  
- Verify Decision Room keyboard navigable  
- Check focus indicators visible  
- Verify all images have alt text  
**Acceptance:** No keyboard traps; all actions achievable without mouse  

---

### TASK-025 — Write README.md (P0)
**Files:** `README.md`  
**Action:** Write professional hackathon README including:  
- Project name and description  
- Live URL (Amplify)  
- AWS services used and why  
- Architecture diagram (text or simple diagram)  
- Local development setup instructions  
- Static export instructions  
- Amplify deployment instructions  
- Decision Room description  
- Challenges and lessons learned  
**Acceptance:** README complete, no placeholder text, accurate URLs  

---

### TASK-026 — Prepare submission write-up and screenshots (P0)
**Action:**  
- Screenshot: homepage  
- Screenshot: Decision Room at each stage  
- Screenshot: Incident Report with score  
- Screenshot: Amplify Console showing deployment  
- Screenshot: Amplify build log (success)  
- Screenshot: GitHub repository (public, visible)  
- Write submission narrative addressing all 4 judging criteria  
**Acceptance:** All screenshots taken, narrative complete, ready to submit  

---

## Rollback Strategy

| Risk Event | Rollback Action |
|---|---|
| Phase 3 changes break existing routes | `git stash` or `git checkout main` |
| django-distill export fails | Investigate specific route, fix or exclude, retry |
| Amplify build fails | Check build log, fix settings.py or amplify.yml, push fix |
| Contact form breaks | Revert to Django POST for local dev; Formspree endpoint issue = get new endpoint |
| Decision Room JS error | Isolate in decision-room.js, does not affect rest of site |
| Secret key exposed | Rotate key immediately, force-push is acceptable here on challenge branch only |

---

## Day-by-Day Schedule

| Day | Date | P0 Tasks | P1 Tasks |
|---|---|---|---|
| 1 | Nov 2 | 001, 002, 003, 004, 006 | 005, 007, 008, 009, 010 |
| 2 | Nov 3 | 011, 012, 013, 014, 015 | — |
| 3 | Nov 4 | 016, 017, 018, 019, 020, 021, 022, 023 | 024 |
| 4 | Nov 5 | 025, 026 | Final polish |
| Submit | Nov 6 | Submission | — |
