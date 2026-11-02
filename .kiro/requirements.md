# requirements.md
# The Engineer's Decision Room — AWS Student Builder Challenge 2026

**Deadline:** November 6, 2026  
**Status:** Phase 2 — Approved for implementation

---

## REQ-001: Static Export Compatibility (P0)

### Context
The project runs Django 5.1.4 (system) / 6.0.2 (requirements.txt — discrepancy noted; system Python 3.14.5 has 5.1.4 installed). django-distill 4.0.6 requires Python >=3.10, supports Django 3.2–5.x. All project routes are parameterless — fully compatible with static export.

### Route Export Analysis

| Route | Export Status | Notes |
|---|---|---|
| `/` | ✅ Static | No parameters, no DB required |
| `/about/` | ✅ Static | No parameters, no DB required |
| `/resume/` | ✅ Static | No parameters, no DB required |
| `/portfolio/` | ✅ Static | No parameters, no DB required |
| `/portfolio-details/` | ✅ Static | No parameters, no DB required |
| `/services/` | ✅ Static | No parameters, no DB required |
| `/service-details/` | ✅ Static | No parameters, no DB required |
| `/contact/` | ⚠️ Partial | GET renders fine; POST handler requires running Django — must be replaced with Formspree for static deployment |
| `/decision-room/` | ✅ Static | New route — pure HTML + JS, no backend |
| `/admin/` | ❌ Exclude | Django admin cannot be statically exported — exclude from distill output |

### Requirements
- REQ-001.1: All 8 portfolio pages must export to clean HTML files.
- REQ-001.2: The contact form must function in static mode via Formspree free tier.
- REQ-001.3: The Django admin must remain accessible in local dev mode and be excluded from static export.
- REQ-001.4: Static assets (CSS, JS, images, vendor libraries) must be collected via `collectstatic` and included in the export.
- REQ-001.5: The `STATIC_ROOT` must be configured before export.
- REQ-001.6: All `{% url %}` template tags must resolve correctly in both Django and static export modes.
- REQ-001.7: The Django SECRET_KEY must be moved to an environment variable before any deployment.
- REQ-001.8: `DEBUG` must be `False` in the static build environment.

---

## REQ-002: AWS Amplify Hosting (P0)

- REQ-002.1: The exported static site must deploy successfully to AWS Amplify Hosting free tier.
- REQ-002.2: An `amplify.yml` build configuration must be created specifying the build commands and artifact directory.
- REQ-002.3: The GitHub repository must be public and connected to Amplify.
- REQ-002.4: The deployed public URL must be accessible throughout the judging period (Nov 6 onwards).
- REQ-002.5: The Amplify build must complete without errors.
- REQ-002.6: All static assets must resolve correctly at the Amplify URL (no broken CSS, JS, or image paths).

---

## REQ-003: Portfolio Content Completeness (P0)

- REQ-003.1: About Me section must include name, role, location, and professional summary.
- REQ-003.2: Skills/Tech Superpowers section must list all technical domains.
- REQ-003.3: Projects section must display at least 6 real GitHub-linked projects.
- REQ-003.4: Experience section must include all 5 roles including current CCI Global role.
- REQ-003.5: Certifications section must list all 8 certifications.
- REQ-003.6: Contact section must include working email, phone, GitHub, and LinkedIn links.
- REQ-003.7: Football referee background must be surfaced as a professional differentiator.
- REQ-003.8: A GitHub repository link must be visible and publicly accessible.

---

## REQ-004: The Engineer's Decision Room — Interactive Feature (P0)

- REQ-004.1: The Decision Room must be reachable from a visible CTA on the homepage.
- REQ-004.2: The experience must work entirely in the browser with no authentication, login, or backend.
- REQ-004.3: No paid APIs or AI services may be used.
- REQ-004.4: The scenario must involve at least three decision stages.
- REQ-004.5: Each decision must have a visible consequence on the simulated system state.
- REQ-004.6: A scoring system must track reliability, security, and response quality across decisions.
- REQ-004.7: The final screen must display an incident summary with the visitor's score and decision breakdown.
- REQ-004.8: A replay button must reset the experience to the initial state.
- REQ-004.9: The football referee connection must be made explicit (composure, judgment, accountability).
- REQ-004.10: All simulated data (logs, metrics, IPs) must be visibly labelled as fictional/simulated.
- REQ-004.11: The feature must be usable on mobile screens (≥ 320px width).
- REQ-004.12: Visitors who do not want to interact must be able to navigate past it using the standard nav.

---

## REQ-005: Design and Responsiveness (P1)

- REQ-005.1: The site must be fully responsive across mobile (320px), tablet (768px), and desktop (1200px+).
- REQ-005.2: Keyboard navigation must work for all interactive elements.
- REQ-005.3: `prefers-reduced-motion` media query must disable non-essential animations.
- REQ-005.4: Colour contrast must meet WCAG AA minimum (4.5:1 for body text).
- REQ-005.5: All images must have descriptive `alt` attributes.
- REQ-005.6: Focus indicators must be visible on all interactive elements.
- REQ-005.7: The profile photo must display at full resolution without blurring.

---

## REQ-006: Hackathon Submission (P0)

- REQ-006.1: A professional README must document the project, AWS services, architecture, and setup.
- REQ-006.2: The submission write-up must cover AWS services used, implementation approach, challenges, and lessons learned.
- REQ-006.3: Screenshots must show the live portfolio, Decision Room, and Amplify deployment configuration.
- REQ-006.4: The GitHub repository must be public before submission.
- REQ-006.5: The live Amplify URL must be working at submission time.
