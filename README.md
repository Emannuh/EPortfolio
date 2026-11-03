# The Engineer's Decision Room
### Emmanuel Maingi · AWS Student Builder Challenge 2026

A full-stack portfolio with a signature interactive engineering incident-response simulation — built on Django, exported to static HTML, and deployed via AWS Amplify Hosting.

---

## Live Site

> **URL:** *(add your Amplify URL after first deploy)*

---

## What It Is

A professional portfolio for Emmanuel Maingi — Full Stack Software Engineer, DevOps Engineer, and Data Analyst based in Nairobi, Kenya — with a distinctive interactive feature: **The Engineer's Decision Room**.

Visitors enter a simulated production incident, investigate evidence across metrics dashboards, application logs, deployment diffs, and security indicators, then make operational decisions across three stages. Every choice has a consequence. The experience ends with a personalised incident report, deterministic score, and a reflection connecting engineering decision-making to Emmanuel's background as a **Certified National Football Referee**.

---

## AWS Services Used

| Service | Purpose |
|---|---|
| **AWS Amplify Hosting** | Hosts the static portfolio site, handles CI/CD from GitHub, serves via CloudFront CDN |
| **Amazon CloudFront** | Global CDN included with Amplify — low-latency delivery worldwide |
| **AWS CodeBuild** | Runs the Amplify build spec: installs dependencies, collects static files, generates static HTML |

### Why Amplify

The portfolio runs on Django for local development. `django-distill` renders all templates to clean static HTML at build time. Amplify builds and deploys this output automatically on every push to the `challenge` branch — zero server infrastructure required, free tier covers the entire portfolio.

---

## Architecture

```
GitHub (challenge branch)
    │
    ▼  trigger on push
AWS Amplify Build (CodeBuild)
    │  pip install -r requirements.txt
    │  python manage.py collectstatic --noinput
    │  python manage.py distill-local dist/ --force
    │
    ▼
dist/                        ← static site output
    index.html
    about/index.html
    resume/index.html
    portfolio/index.html
    services/index.html
    service-details/index.html
    portfolio-details/index.html
    contact/index.html
    decision-room/index.html
    static/
        css/  js/  img/  vendor/
    │
    ▼
CloudFront CDN → Public URL
```

---

## The Decision Room

The portfolio's signature feature. A browser-based engineering incident simulation requiring no login, no backend, and no external APIs.

**Scenario:** A production deployment completes at 02:31 UTC. By 02:47, latency has spiked 643%, error rate is at 12.3%, and suspicious traffic is detected. The visitor is the on-call engineer.

**Three decision stages:**
1. Assess the situation (4 options)
2. Investigate and diagnose (4 options)
3. Execute a response (4 options)

**Scoring:** Deterministic weighted average across Reliability (40%), Security (30%), and Decision Quality (30%). 64 mapped decision paths. Four verdict tiers: Incident Commander, Reliable Engineer, Learning Curve, Postmortem Required.

**Connection to football refereeing:** The final incident report includes a reflection on composure, judgment, and accountability — the same qualities required of a national football referee making split-second decisions under pressure.

**Technical:** Vanilla ES6 state machine. All scenario data separated from logic. Works identically in Django dev mode and static export.

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/Emannuh/EPortfolio.git
cd EPortfolio
git checkout challenge

# Create virtual environment
python -m venv .venv
.venv/Scripts/activate       # Windows
# source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your SECRET_KEY

# Run migrations and start server
python manage.py migrate
python manage.py runserver
```

Open `http://127.0.0.1:8000`

---

## Static Export

```bash
python manage.py collectstatic --noinput
python manage.py distill-local dist/ --force
# Serve locally to verify
python -m http.server 8080 --directory dist
```

---

## Amplify Deployment

1. Push the `challenge` branch to GitHub
2. In AWS Amplify Console → New App → Host Web App → GitHub
3. Select `Emannuh/EPortfolio` → branch: `challenge`
4. Amplify detects `amplify.yml` automatically
5. Add environment variables:
   - `DJANGO_SECRET_KEY` = (generate a new secure key)
   - `DJANGO_DEBUG` = `False`
   - `DJANGO_ALLOWED_HOSTS` = `.amplifyapp.com`
6. Save and deploy

---

## Environment Variables

| Variable | Description |
|---|---|
| `DJANGO_SECRET_KEY` | Django secret key (required, never commit) |
| `DJANGO_DEBUG` | Set to `False` in production |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hosts |

---

## Project Structure

```
FolioOne/
├── config/          Django project settings, URLs, WSGI
├── portfolio/       App: views, URLs, models, tests (27 tests)
├── templates/       9 Django templates
├── assets/          CSS, JS, images, vendor libraries
│   ├── css/main.css, decision-room.css
│   └── js/main.js, decision-room.js
├── amplify.yml      AWS Amplify build specification
├── requirements.txt Django, distill, whitenoise, decouple
└── README.md        This file
```

---

## Challenges and Lessons Learned

**Challenge 1: AWS Amplify does not run Django.**
Amplify Hosting is designed for static sites and frontend frameworks. The solution was `django-distill`, which renders all templates to static HTML at build time. The portfolio behaves identically on Amplify as it does under the Django dev server.

**Challenge 2: Contact form on static hosting.**
Django's CSRF-protected POST handler doesn't work in a static deployment. The form is documented for Formspree integration — a free static form service that handles submissions via AJAX without requiring a server.

**Challenge 3: WhiteNoise filename hashing.**
`CompressedManifestStaticFilesStorage` appends content hashes to filenames, which breaks template `{% static %}` references in the distill export. Switched to `CompressedStaticFilesStorage` which compresses without renaming.

**Lesson learned:** The Django-to-static pipeline is robust once the correct WhiteNoise storage backend is chosen. `django-distill` handles all parameterless routes transparently and the entire build runs in under 60 seconds on Amplify.

---

## Submission

- **GitHub:** https://github.com/Emannuh/EPortfolio (branch: `challenge`)
- **Live URL:** *(add after deploy)*
- **Challenge:** AWS Student Builder Challenge 2026 — Build Your Tech Superpower

---

*Emmanuel Maingi · Nairobi, Kenya · Emhmanuh@gmail.com*
