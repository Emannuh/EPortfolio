# design.md
# The Engineer's Decision Room — Design System and Feature Specification

---

## 1. Design System

### 1.1 Color Palette (Extends Existing Theme)

The existing dark navy palette is retained as the foundation. These additions are for the Decision Room and premium accents only.

```
Core (existing — preserved):
  --background-color: #101a20      Dark navy background
  --surface-color:    #141f26      Card surfaces
  --default-color:    #e7f2f7      Body text
  --heading-color:    #ffffff      Headings
  --accent-color:     #1387c1      Primary accent (electric blue)
  --light-background: #142027      Alternate section bg
  --dark-background:  #0b1419      Stats strip

Decision Room additions:
  --dr-terminal:      #0d1117      Terminal/log background (near-black)
  --dr-green:         #00d46a      System healthy / good decision
  --dr-amber:         #f5a623      Warning / degraded state
  --dr-red:           #e53e3e      Critical / bad decision
  --dr-cyan:          #00d4ff      Metric highlights / interactive hover
  --dr-border:        rgba(19,135,193,0.25)  Subtle border on DR panels
```

### 1.2 Typography

```
Headings:   Raleway, 700 weight — existing, retained
Body:       Roboto, 400/500 — existing, retained
Nav:        Poppins — existing, retained
Monospace:  'JetBrains Mono', 'Fira Code', 'Courier New' — Decision Room only
            Used for: log output, metric values, terminal text
```

No new font loads required. JetBrains Mono added via Google Fonts (single addition to base.html, conditional via Decision Room template block).

### 1.3 Spacing Scale

```
--space-xs:   4px
--space-sm:   8px
--space-md:   16px
--space-lg:   24px
--space-xl:   40px
--space-2xl:  64px
--space-3xl:  96px
```

### 1.4 Component Tokens

```
Border radius:
  --radius-sm:  6px   (tags, badges)
  --radius-md:  12px  (cards, panels)
  --radius-lg:  20px  (hero elements)

Shadows:
  --shadow-sm:  0 2px 8px rgba(0,0,0,0.3)
  --shadow-md:  0 8px 24px rgba(0,0,0,0.4)
  --shadow-lg:  0 16px 48px rgba(0,0,0,0.5)

Transitions:
  --transition-fast:   0.15s ease
  --transition-base:   0.3s ease
  --transition-slow:   0.5s ease
```

### 1.5 Animation Principles

- AOS scroll animations: retained as-is (duration 600ms, once: true)
- Hover micro-interactions: translateY(-4px) on cards, 0.3s ease
- Decision Room state transitions: 0.4s fade for panel changes
- Counter animations: PureCounter, retained
- Skill bars: Waypoints trigger, retained
- **Reduced motion override:** All animations disabled when `prefers-reduced-motion: reduce`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  [data-aos] { opacity: 1 !important; transform: none !important; }
}
```

### 1.6 Buttons

```
Primary:   bg #1387c1, white text, radius 6px, px 24px py 12px
           Hover: bg #0f6fa3, translateY(-2px)
Outline:   border 1px #1387c1, #1387c1 text, transparent bg
           Hover: bg rgba(19,135,193,0.1)
Ghost:     no border, accent text, underline on hover
Danger:    bg #e53e3e (Decision Room rollback only)
DR Action: bg var(--surface-color), border var(--dr-border), full width
           Hover: border #1387c1, bg rgba(19,135,193,0.08)
```

### 1.7 Accessibility Requirements

- All interactive elements: visible focus ring (2px solid #1387c1, offset 2px)
- ARIA labels on icon-only buttons
- `aria-live="polite"` on Decision Room state panels
- `role="status"` on score indicators
- Skip-to-main link in base.html
- All images: non-empty alt attributes
- Decision Room: keyboard navigable (Tab/Enter/Space)
- Minimum touch target: 44×44px on mobile

---

## 2. Page-Level Design Decisions

### 2.1 Homepage (index.html)
**Changes required:**
- Add Decision Room CTA block below hero — styled as a premium "Enter the Operations Center" panel
- CTA design: dark terminal-style card with blinking cursor, electric blue border, short teaser text
- Football referee badge: add a subtle "Certified National Football Referee" pill/badge near the floating hero cards
- Profile photo: replace with high-res version (user action required)
- No other structural changes to existing hero

### 2.2 About (about.html)
**Changes required:**
- Add football referee section as a dedicated "Beyond the Terminal" block
- Position: after the skills grid, before the timeline
- Content: referee philosophy — composure, judgment, accountability — bridge to engineering mindset
- Stats counter: add "Matches Officiated" counter (placeholder — user to provide number or remove)
- No other structural changes

### 2.3 Resume (resume.html)
**No structural changes.** Content is clean and complete.

### 2.4 Portfolio (portfolio.html)
**No structural changes.** 9 cards with real GitHub links are in place.

### 2.5 Services (services.html)
**No structural changes.** 7 services including Data Analysis are in place.

### 2.6 Contact (contact.html)
**Changes required:**
- Replace Django POST form action with Formspree endpoint
- Remove Django messages template tag (not available in static)
- Add success/error state handling in JavaScript
- Keep all visual design identical

### 2.7 Navigation (base.html)
**Changes required:**
- Add "Decision Room" nav item with a subtle amber/cyan badge: "Try It"
- Position: between Portfolio and Contact
- On mobile: appears in standard nav menu
- Skip-to-main anchor at top of body

---

## 3. The Engineer's Decision Room — Full Specification

### 3.1 Concept

A browser-based engineering incident simulation. The visitor plays the role of the on-call engineer responding to a production incident. All data is fictional and clearly labelled. No login, no backend, no AI.

The connection to football refereeing is made explicit: both roles require making high-stakes decisions under pressure, with incomplete information, in real time, and owning the consequences without hesitation.

### 3.2 Scenario: Operation Nightwatch

**Setup (displayed as a briefing screen):**

> SIMULATION — NOT REAL DATA  
> You are the on-call engineer at Nightwatch Systems.  
> It is 02:47 UTC. A production deployment completed 18 minutes ago.  
> Monitoring alerts are firing. The ops channel is escalating.  
> You have the terminal. What do you do?

**System under stress:**
- App: `nightwatch-api` v2.4.1 (just deployed, previously v2.3.9)
- Symptoms: p95 latency spiked from 120ms to 890ms, HTTP 5xx rate 12%, suspicious traffic from 3 foreign IPs

### 3.3 State Machine

The experience has 5 phases: Briefing → Stage 1 → Stage 2 → Stage 3 → Incident Report.

```
BRIEFING
  └─► STAGE 1: ASSESS THE SITUATION
        Decision A: What do you investigate first?
          A1: Check application metrics dashboard     → Good path
          A2: Review deployment diff and changelogs   → Good path  
          A3: Immediately roll back the deployment    → Premature path
          A4: Page the development team               → Delay path

      STAGE 2: INVESTIGATE (adapts based on Stage 1)
        (if A1 or A2 chosen — evidence shown matches investigation)
        (if A3 — rollback initiated but security threat unaddressed)
        (if A4 — team responds slowly, situation worsens)
        
        Decision B: What does the evidence tell you?
          B1: The deployment introduced a slow DB query → Correct diagnosis
          B2: An external DDoS attack is the root cause → Partial (security real but not primary)
          B3: A memory leak in the new container       → Wrong diagnosis
          B4: The load balancer is misconfigured       → Wrong diagnosis

      STAGE 3: RESPOND
        (choices adapt based on prior decisions)
        Decision C: What is your response?
          C1: Roll back v2.4.1, patch the DB query, redeploy → Optimal
          C2: Scale up instances to absorb load              → Palliative
          C3: Block the suspicious IPs, scale instances      → Partial (ignores root cause)
          C4: Do nothing, monitor for 30 minutes             → Poor

      INCIDENT REPORT
        Score calculated.
        Summary generated based on decision path.
        Football referee connection displayed.
        Replay button shown.
```

### 3.4 Scoring System

Three dimensions, each 0–100:

| Dimension | Description |
|---|---|
| **Reliability** | Did you restore service effectively? |
| **Security** | Did you address the suspicious traffic? |
| **Decision Quality** | Did you follow sound incident response methodology? |

**Score matrix:**

| Decision Path | Reliability | Security | Quality |
|---|---|---|---|
| A1/A2 → B1 → C1 (optimal) | 95 | 80 | 98 |
| A1/A2 → B1 → C2 | 70 | 40 | 65 |
| A1/A2 → B2 → C3 | 60 | 95 | 70 |
| A1/A2 → B2 → C1 | 85 | 90 | 88 |
| A3 (premature rollback) → any → C1 | 80 | 50 | 60 |
| A4 (paged team) → B1 → C1 | 75 | 70 | 55 |
| Any → B3/B4 (wrong diagnosis) → C1 | 50 | 40 | 42 |
| Any → any → C4 (do nothing) | 20 | 20 | 15 |

**Overall score:** weighted average (Reliability 40%, Security 30%, Quality 30%)

**Verdict tiers:**
- 85–100: "Incident Commander" (exceptional)
- 70–84: "Reliable Engineer" (solid)
- 50–69: "Learning Curve" (partial success)
- 0–49: "Postmortem Required" (needs review)

### 3.5 Simulated Dashboard Elements

**Metrics panel** (shown during Stage 1/2):
```
SIMULATED DATA — FOR DEMONSTRATION ONLY
┌─────────────────────────────────────────┐
│  nightwatch-api   ● DEGRADED            │
│  p95 Latency:  889ms  ▲ +643%           │
│  Error Rate:   12.3%  ▲ +12.1%          │
│  Throughput:   1,240 req/s              │
│  CPU:          78%    ↑                 │
│  Memory:       61%    stable            │
│  Active pods:  4/4                      │
└─────────────────────────────────────────┘
```

**Log stream** (scrolling, shown on Stage 2):
```
[02:31:14] INFO  Deployment v2.4.1 completed successfully
[02:31:47] WARN  p95 latency threshold exceeded: 245ms
[02:33:02] ERROR HTTP 503: upstream timeout /api/v2/users/profile
[02:34:18] ERROR HTTP 503: upstream timeout /api/v2/dashboard
[02:35:01] WARN  Unusual traffic: 185.220.101.47 (TOR exit node)
[02:35:44] WARN  Unusual traffic: 94.102.49.193
[02:36:12] ERROR DB query timeout: SELECT * FROM user_sessions WHERE...
[02:36:12] ERROR DB query timeout: SELECT * FROM analytics_events WHERE...
[02:37:55] CRIT  Error rate exceeded 10% threshold — ALERT FIRED
```
*(All IPs and data are fictional)*

**Deployment diff** (shown if visitor chose to review it):
```
DEPLOYMENT DIFF: v2.3.9 → v2.4.1
+ Added analytics dashboard endpoint /api/v2/dashboard
+ Added user session aggregation query
~ Modified: user_sessions JOIN analytics_events (no index on created_at)
~ Modified: background worker poll interval: 30s → 5s
```

### 3.6 Feedback Messages

Each decision triggers a consequence message (shown in an amber/green/red callout):

- **A1 (metrics first):** "Good instinct. Metrics show the latency spike correlates with deployment time. The dashboard reveals elevated DB response times."
- **A2 (deployment diff):** "Solid approach. The changelog reveals a new JOIN query with no index — a known performance anti-pattern."
- **A3 (immediate rollback):** "Impulsive. Rolling back without diagnosis means you may redeploy the same bug. The suspicious traffic is also unaddressed."
- **A4 (page team):** "Reasonable, but slow. The team is unavailable. You're the on-call engineer. The system is your responsibility right now."
- **B1 (correct diagnosis):** "Correct. The unindexed JOIN on user_sessions is causing full table scans under load. This is the root cause."
- **B2 (DDoS):** "Partially correct. The suspicious IPs are real, but they are not causing the latency — the DB query is. Addressing security alone won't restore service."
- **C1 (rollback + fix):** "Excellent execution. Service restored in 4 minutes. The patch addresses root cause. Security incident logged for review."
- **C2 (scale up):** "Short-term relief. Latency drops but the root cause is still in production. The next deployment will repeat this."

### 3.7 Football Referee Connection

Displayed on the final Incident Report screen:

> "A football referee has 200 milliseconds to make a decision that 60,000 people will judge.  
> There is no replay, no undo, no committee.  
> Engineering works the same way.  
>  
> The best decisions are not always the fastest ones — but they are always the most informed.  
> Collect evidence. Understand the system. Act with precision.  
> Own the result."
>  
> — Emmanuel Maingi, Certified National Football Referee & Engineer

### 3.8 Discovery Hint on Homepage

On the homepage, below the hero section, a panel reads:

```
┌─────────────────────────────────────────────────────┐
│  ⚡  THE ENGINEER'S DECISION ROOM                    │
│                                                      │
│  02:47 UTC. Production is down. You're on call.     │
│  Do you have what it takes?                          │
│                                                      │
│  [  Enter the Decision Room  →  ]                    │
└─────────────────────────────────────────────────────┘
```

Styled as a dark terminal card. Blinking cursor before the headline. Electric blue border. Optional subtle ambient animation (pulsing border glow, respects prefers-reduced-motion).

---

## 4. File Structure

### 4.1 New Files

```
templates/
  decision-room.html        The Decision Room full page

assets/
  css/
    decision-room.css       Decision Room styles (isolated, does not affect other pages)
  js/
    decision-room.js        State machine, scenario logic, scoring, DOM manipulation
  img/
    profile/
      emmanuel-maingi.jpg   [USER: replace with high-res photo]
```

### 4.2 Modified Files

```
templates/
  base.html                 + skip-to-main link, + DR nav item, + monospace font conditional
  index.html                + Decision Room entry CTA block
  about.html                + Football referee "Beyond the Terminal" section
  contact.html              + Replace Django form action with Formspree

portfolio/
  urls.py                   + path for decision-room/
  views.py                  + decision_room view function

config/
  settings.py               + env var for SECRET_KEY, STATIC_ROOT, ALLOWED_HOSTS
  
requirements.txt            + django-distill==4.0.6, whitenoise==6.12.0, python-decouple==3.8

.kiro/
  amplify.yml               Amplify build configuration (copied to root before deploy)
  .env.example              Environment variable template
```

### 4.3 New Root Files

```
amplify.yml                 AWS Amplify build spec
.env.example                Documented env var template  
README.md                   Hackathon submission README
.gitignore                  Ensure .env and staticfiles/ are excluded
```

### 4.4 Generated by Build (Not in Git)

```
staticfiles/                Output of collectstatic — gitignored
dist/                       Output of django-distill — gitignored, uploaded to Amplify
```

---

## 5. Decision Room — JavaScript Architecture

The entire experience runs as a single JavaScript module (`decision-room.js`).

```javascript
// Conceptual structure — not implementation code

const SCENARIO = {
  stages: [...],          // ordered array of stage definitions
  decisions: {...},       // keyed by decision ID
  consequences: {...},    // keyed by decision ID
  scoreMatrix: {...},     // maps decision path to scores
}

const STATE = {
  currentStage: 0,
  choices: [],            // ordered array of decision IDs chosen
  scores: { reliability: 0, security: 0, quality: 0 },
}

function renderStage(stageId) {...}      // update DOM for current stage
function handleDecision(decisionId) {...} // record choice, show consequence, advance
function calculateScore() {...}          // deterministic, based on STATE.choices
function renderReport() {...}            // final screen
function resetExperience() {...}         // restore STATE to initial, re-render stage 0
```

No classes, no build step, no bundler. Vanilla ES6 module syntax. Works in static HTML file identically to Django template.

---

## 6. Static Export + Amplify Architecture

### 6.1 Local Development Flow (Django)
```
python manage.py runserver
→ All 9 pages + Decision Room served by Django
→ Contact form: Django POST handler (development only)
→ Admin: /admin/ accessible
```

### 6.2 Static Build Flow
```
python manage.py collectstatic --noinput
→ All assets copied to staticfiles/

python manage.py distill-local dist/ --force
→ Renders all distill_path routes to dist/
→ Output: dist/index.html, dist/about/index.html, ... dist/decision-room/index.html
→ Assets copied to dist/static/

Contact form in dist/ → points to Formspree endpoint (no Django needed)
```

### 6.3 Amplify Build Spec (amplify.yml)
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - pip install -r requirements.txt
        - python manage.py collectstatic --noinput
    build:
      commands:
        - python manage.py distill-local dist/ --force
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - ~/.cache/pip
```

### 6.4 Environment Variables in Amplify Console
```
DJANGO_SECRET_KEY     (generated, not committed)
DJANGO_DEBUG          false
DJANGO_ALLOWED_HOSTS  .amplifyapp.com
FORMSPREE_ENDPOINT    (from Formspree dashboard)
```
