/**
 * The Engineer's Decision Room
 * Interactive incident-response simulation
 * Phase 4.6 — Technical accuracy, scroll fix, timer, selected state
 * Vanilla ES6 · no framework, no build step, no external APIs
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   SCENARIO DATA
═══════════════════════════════════════════════════════════════ */
const SCENARIO = {

  /* ── Stage 1 consequences ── */
  stage1: {
    A1: {
      quality: 'good',
      icon: 'bi-check-circle-fill',
      title: 'Good instinct.',
      text: 'Diving into the metrics reveals a clear correlation: DB query response time spiked exactly 18 minutes ago, matching the deployment time. CPU is elevated at 78% and memory is stable at 61%. Stable memory makes a significant memory-related issue less likely, though it does not rule it out entirely. The dominant signal here is the database layer: query timeouts appearing in the logs from the moment the deployment completed.',
      hint: 'The deployment diff is your next stop.',
    },
    A2: {
      quality: 'good',
      icon: 'bi-check-circle-fill',
      title: 'Methodical approach.',
      text: 'The changelog reveals the likely culprit: v2.4.1 introduced a JOIN between user_sessions and analytics_events, but the query references analytics_events.created_at with no corresponding index. At 1,200 requests per second, every dashboard call performs a sequential scan across millions of rows. The background worker interval was also tightened from 30s to 5s, multiplying query frequency sixfold. These two changes together explain the latency spike.',
      hint: 'Check the logs and security indicators before deciding.',
    },
    A3: {
      quality: 'bad',
      icon: 'bi-exclamation-triangle-fill',
      title: 'Impulsive.',
      text: 'Rolling back without a diagnosis is a gamble. You may restore service temporarily, but you have spent 6 minutes and introduced rollback risk without understanding what broke. More critically, the suspicious IPs are still probing your perimeter and remain unaddressed. A rollback without root cause analysis means you risk redeploying the same defect on the next release. Engineers diagnose before acting.',
      hint: 'Proceed, but your quality score reflects the lack of investigation.',
    },
    A4: {
      quality: 'bad',
      icon: 'bi-exclamation-triangle-fill',
      title: 'You are the on-call engineer.',
      text: 'Escalating to the team is sometimes correct, but not as your first action at 02:47 UTC. The on-call rota exists for exactly this moment. The team responds 12 minutes later. By then latency has reached 1,600ms and the error rate is 24%. The time spent waiting could have identified the root cause. Ownership of the incident starts with you.',
      hint: 'Proceed, but the delay has affected your reliability score.',
    },
  },

  /* ── Stage 2 consequences ── */
  stage2: {
    B1: {
      quality: 'good',
      icon: 'bi-check-circle-fill',
      title: 'Correct root cause identified.',
      text: 'You have pinpointed the problem precisely. The new dashboard endpoint introduced in v2.4.1 executes a JOIN across user_sessions and analytics_events, filtering on analytics_events.created_at. With 14 million rows and no index on that column, the database performs a full sequential scan for every request. This holds connection slots and blocks other queries. The background worker change from 30s to 5s multiplies the query rate sixfold, saturating the connection pool. This is the root cause.',
      hint: 'You have a precise diagnosis. Now fix it decisively.',
    },
    B2: {
      quality: 'ok',
      icon: 'bi-dash-circle-fill',
      title: 'Security concern identified, but root cause missed.',
      text: 'The 3 flagged IPs are real and warrant investigation. However, the traffic volume of 1,315 requests over 15 minutes is not consistent with a DDoS attack sufficient to cause a 643% latency spike across all endpoints. This looks more like opportunistic scanning that coincided with the incident. The DB query timeouts in the logs, beginning exactly at the deployment time, are the primary signal. Treating the IPs as the sole cause misattributes the outage.',
      hint: 'Security exposure is real, but the database is the bottleneck.',
    },
    B3: {
      quality: 'bad',
      icon: 'bi-x-circle-fill',
      title: 'Diagnosis not supported by the evidence.',
      text: 'Memory is at 61% and has remained flat since before the deployment. A progressive memory leak would typically show a rising trend alongside garbage collection events or OOM warnings. None of these are present in the logs. Stable memory makes a significant leak unlikely in this timeframe, though not impossible. The stronger signal is the repeated DB query timeouts that began at deployment time. That is where the evidence points.',
      hint: 'Review the DB query errors in the log stream.',
    },
    B4: {
      quality: 'bad',
      icon: 'bi-x-circle-fill',
      title: 'No evidence supports this diagnosis.',
      text: 'The deployment diff shows no changes to load balancer configuration. All 4 pods are running and passing health checks. An uneven load balancer would produce asymmetric error rates across pods or health check failures, neither of which appear in the metrics. The 8-second DB query timeouts that began immediately after the deployment are a much stronger indicator. Follow the evidence.',
      hint: 'Re-read the deployment diff carefully.',
    },
  },

  /* ── Stage 3 consequences ── */
  stage3: {
    C1: {
      quality: 'good',
      icon: 'bi-check-circle-fill',
      title: 'Excellent execution.',
      text: 'v2.4.1 rolled back in 90 seconds. Index created on analytics_events.created_at. v2.4.2 deployed with the fix in place. Latency returns to 118ms within 4 minutes. Error rate drops to 0.1%. DB connection pool normalises. The security team has been notified of the 3 flagged IPs for review and investigation. Incident resolved within SLA. Full post-mortem scheduled for 09:00 UTC.',
    },
    C2: {
      quality: 'ok',
      icon: 'bi-dash-circle-fill',
      title: 'Palliative. Root cause unresolved.',
      text: 'Scaling to 8 pods distributes the load and buys time: latency drops to 420ms and error rate falls to 4%. However, the missing index on analytics_events.created_at is still in production on every pod. As traffic grows through the morning, the sequential scans will saturate the connection pool again. The security exposure from the 3 flagged IPs also remains unaddressed. Service is partially restored, but the underlying defect persists.',
    },
    C3: {
      quality: 'ok',
      icon: 'bi-dash-circle-fill',
      title: 'Security addressed. Root cause unresolved.',
      text: 'Blocking the 3 IPs is correct security hygiene and reduces suspicious traffic. Scaling provides temporary relief. However, the missing database index is still in production. Latency improves slightly to 650ms but remains above acceptable thresholds. You have addressed the security concern while leaving the primary performance defect in place.',
    },
    C4: {
      quality: 'bad',
      icon: 'bi-x-circle-fill',
      title: 'SLA breached.',
      text: 'Thirty minutes of observation with no action: latency climbs to 2,800ms. Error rate reaches 47%. The DB connection pool exhausts completely at 02:58 UTC. The application goes fully dark at 03:02. SLA is breached. Three enterprise customers open incident tickets. In engineering, inaction under a known, active incident is not neutral. It is a decision, and it carries consequences.',
    },
  },

  /* ── Score matrix: [reliability, security, quality] ── */
  scoreMatrix: {
    'A1_B1_C1': [95, 82, 98], 'A2_B1_C1': [95, 82, 96],
    'A1_B1_C2': [68, 42, 62], 'A2_B1_C2': [68, 42, 60],
    'A1_B1_C3': [60, 90, 66], 'A2_B1_C3': [60, 90, 64],
    'A1_B1_C4': [18, 30, 14], 'A2_B1_C4': [18, 30, 12],
    'A1_B2_C1': [82, 92, 72], 'A2_B2_C1': [82, 92, 70],
    'A1_B2_C2': [62, 70, 52], 'A2_B2_C2': [62, 70, 50],
    'A1_B2_C3': [58, 96, 68], 'A2_B2_C3': [58, 96, 66],
    'A1_B2_C4': [16, 28, 12], 'A2_B2_C4': [16, 28, 10],
    'A1_B3_C1': [52, 40, 44], 'A2_B3_C1': [52, 40, 42],
    'A1_B4_C1': [52, 40, 44], 'A2_B4_C1': [52, 40, 42],
    'A1_B3_C2': [44, 38, 36], 'A2_B3_C2': [44, 38, 34],
    'A1_B4_C2': [44, 38, 36], 'A2_B4_C2': [44, 38, 34],
    'A1_B3_C3': [42, 76, 40], 'A2_B3_C3': [42, 76, 38],
    'A1_B4_C3': [42, 76, 40], 'A2_B4_C3': [42, 76, 38],
    'A1_B3_C4': [14, 20, 10], 'A2_B3_C4': [14, 20,  8],
    'A1_B4_C4': [14, 20, 10], 'A2_B4_C4': [14, 20,  8],
    'A3_B1_C1': [80, 52, 60], 'A3_B1_C2': [62, 38, 48],
    'A3_B1_C3': [58, 82, 54], 'A3_B1_C4': [18, 22, 14],
    'A3_B2_C1': [74, 86, 58], 'A3_B2_C2': [58, 64, 44],
    'A3_B2_C3': [54, 90, 52], 'A3_B2_C4': [16, 24, 12],
    'A3_B3_C1': [48, 38, 38], 'A3_B4_C1': [48, 38, 38],
    'A3_B3_C2': [40, 34, 30], 'A3_B4_C2': [40, 34, 30],
    'A3_B3_C3': [38, 72, 36], 'A3_B4_C3': [38, 72, 36],
    'A3_B3_C4': [12, 18,  8], 'A3_B4_C4': [12, 18,  8],
    'A4_B1_C1': [74, 68, 54], 'A4_B1_C2': [58, 36, 42],
    'A4_B1_C3': [52, 78, 48], 'A4_B1_C4': [14, 20, 12],
    'A4_B2_C1': [68, 84, 52], 'A4_B2_C2': [54, 62, 38],
    'A4_B2_C3': [50, 88, 46], 'A4_B2_C4': [12, 22, 10],
    'A4_B3_C1': [44, 36, 34], 'A4_B4_C1': [44, 36, 34],
    'A4_B3_C2': [38, 30, 26], 'A4_B4_C2': [38, 30, 26],
    'A4_B3_C3': [36, 68, 32], 'A4_B4_C3': [36, 68, 32],
    'A4_B3_C4': [10, 16,  6], 'A4_B4_C4': [10, 16,  6],
  },

  /* ── Verdict tiers ── */
  verdicts: [
    {
      min: 85,
      label: 'Incident Commander',
      cssClass: 'dr-verdict-commander',
      description: 'Exceptional incident response. You identified the root cause, acted decisively, and addressed both the performance regression and the security exposure. This is what methodical engineering under pressure looks like.',
    },
    {
      min: 70,
      label: 'Reliable Engineer',
      cssClass: 'dr-verdict-reliable',
      description: 'Solid incident response. Service was restored and your thinking was methodical. A more thorough approach, particularly around root cause identification or security, would have improved the outcome.',
    },
    {
      min: 50,
      label: 'Learning Curve',
      cssClass: 'dr-verdict-learning',
      description: 'Partial success. Service was partially restored but the root cause was either missed or not fully resolved. Review the lessons below. These patterns appear regularly in real production incidents.',
    },
    {
      min: 0,
      label: 'Postmortem Required',
      cssClass: 'dr-verdict-postmortem',
      description: 'The incident escalated beyond the SLA threshold. The root cause was not addressed. Real incidents with this outcome trigger post-mortem reviews. That process is how engineering teams improve.',
    },
  ],

  /* ── Decision labels for timeline ── */
  decisionLabels: {
    A1: 'Investigated application metrics and DB performance',
    A2: 'Reviewed deployment diff and changelogs',
    A3: 'Rolled back immediately without investigation',
    A4: 'Paged the development team as first action',
    B1: 'Diagnosed: missing index on analytics_events.created_at',
    B2: 'Diagnosed: external DDoS / suspicious traffic as primary cause',
    B3: 'Diagnosed: memory leak in container (unsupported by evidence)',
    B4: 'Diagnosed: load balancer misconfiguration (no evidence)',
    C1: 'Rolled back v2.4.1, added DB index, redeployed v2.4.2',
    C2: 'Scaled out to 8 pods (palliative)',
    C3: 'Blocked suspicious IPs and scaled instances',
    C4: 'Monitored without taking action',
  },

  /* ── Timeline outcome tags ── */
  decisionOutcomes: {
    A1: 'good', A2: 'good', A3: 'bad',  A4: 'bad',
    B1: 'good', B2: 'ok',  B3: 'bad',  B4: 'bad',
    C1: 'good', C2: 'ok',  C3: 'ok',   C4: 'bad',
  },

  stageLabels: {
    1: 'Stage 1 · Assess',
    2: 'Stage 2 · Diagnose',
    3: 'Stage 3 · Respond',
  },

  /* ── Lessons bank ── */
  lessons: {
    diagnose_first:    'Always diagnose before acting. A rollback without root cause analysis risks redeploying the same defect on the next release.',
    read_the_diff:     'The deployment diff is your first evidence source. Changes that correlate with an incident in timing are strong suspects.',
    db_indexes:        'Missing indexes on columns used in JOIN predicates or WHERE clauses are a common cause of sudden latency spikes after deployments. Always review new queries for index coverage.',
    security_separate: 'Security threats and application performance issues can coexist. Suspicious traffic warrants investigation, but attribution requires evidence. Distinguish between correlation and cause.',
    sla_clock:         'SLA obligations are real. Inaction under a known, active incident is itself a decision, and it carries consequences.',
    team_ownership:    'On-call engineering means taking ownership of the situation in front of you. Escalation is appropriate, but not as your first response.',
    partial_fix:       'Scaling infrastructure can defer a performance problem, but it does not resolve it. The root cause remains in production until the defect is corrected.',
    security_hygiene:  'Blocking suspicious IPs and escalating to the security team is correct hygiene, even when those IPs are not the primary cause of an incident.',
    root_cause:        'The root cause is almost always visible in the data. Logs, metrics, and deployment diffs tell the story when read carefully and in sequence.',
  },

  /* ── Referee quotes ── */
  refereeQuotes: {
    high: `"In football, the best referees are invisible. Not because they do nothing, but because they act at the right moment, with the right information. A booking at the wrong time changes the match. A decision deferred creates a worse decision later.\n\nEngineering incidents work exactly the same way. Composure is not passivity. It is the discipline to gather evidence before acting, to hold your nerve under pressure, and to own the outcome of your call.\n\nEvery production incident is a test of that discipline."`,
    mid:  `"A referee who second-guesses every call loses control of the match. A referee who never questions their own judgment makes the wrong calls. The best ones know the difference between decisive and reckless.\n\nIn this incident you made progress. There were moments where a more careful read of the evidence would have led to a better outcome. That is not failure. It is the feedback loop that makes engineers better.\n\nReview the decision timeline. Ask yourself: what did the data show, and what did I overlook?"`,
    low:  `"Every referee, every engineer, gets the call wrong sometimes. The ones who improve are the ones who do not look away from the post-mortem.\n\nThis incident escalated further than it needed to. The evidence was there in the logs. The outcome came down to how the decisions were sequenced.\n\nReplay the scenario. The goal is not a perfect score. It is understanding why each decision produces the outcome it does."`,
  },
};


/* ═══════════════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════════════ */
let STATE = {
  stage1Choice: null,
  stage2Choice: null,
  stage3Choice: null,
};

/* Simulated incident timer — deterministic display, no scoring effect */
let _timerInterval = null;
const TIMER_START_SECONDS = 4 * 60 + 13; // 04:13 elapsed at scene start

function startIncidentTimer() {
  const el = document.getElementById('incident-timer-val');
  if (!el) return;
  let elapsed = TIMER_START_SECONDS;
  _timerInterval = setInterval(() => {
    elapsed++;
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    el.textContent = `${m}:${s}`;
  }, 1000);
}

function stopIncidentTimer() {
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
}


/* ═══════════════════════════════════════════════════════════════
   UTILITY HELPERS
═══════════════════════════════════════════════════════════════ */
/* FIX #1: scroll clears sticky nav (offset = header height ~70px + 20px gap) */
function showPhase(id) {
  document.querySelectorAll('.dr-phase').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(id);
  if (!target) return;
  target.classList.add('active');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Small delay lets the display:block apply before scrolling
  requestAnimationFrame(() => {
    setTimeout(() => {
      const headerH = document.getElementById('header')?.offsetHeight ?? 70;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: prefersReduced ? 'instant' : 'smooth' });
    }, 30);
  });
}

function renderConsequence(containerId, decision, stageData) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const data = stageData[decision];
  if (!data) return;

  const qualityClass = data.quality === 'good' ? 'good' : data.quality === 'ok' ? 'ok' : 'bad';
  el.className = `dr-consequence visible ${qualityClass}`;
  el.setAttribute('aria-live', 'assertive');
  el.innerHTML = `
    <span class="dr-consequence-title">
      <i class="bi ${data.icon} dr-consequence-icon" aria-hidden="true"></i>${data.title}
    </span>
    ${data.text}
    ${data.hint ? `<div class="dr-consequence-hint"><i class="bi bi-arrow-right-circle" aria-hidden="true"></i>${data.hint}</div>` : ''}
  `;
  // Move focus to the consequence so screen readers announce it
  el.setAttribute('tabindex', '-1');
  el.focus();
}

/* FIX #5: use CSS class for selected + keep selected button fully visible */
function markSelectedButton(phaseId, decision) {
  document.querySelectorAll(`#${phaseId} .dr-btn`).forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.decision === decision) {
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.setAttribute('aria-pressed', 'false');
    }
  });
}

/* FIX #5: unified next-button reveal via CSS class */
function showNextButton(wrapperId) {
  const el = document.getElementById(wrapperId);
  if (el) el.classList.add('visible');
}


/* ═══════════════════════════════════════════════════════════════
   DECISION HANDLERS
═══════════════════════════════════════════════════════════════ */
function handleStage1Decision(decision) {
  if (STATE.stage1Choice) return;
  STATE.stage1Choice = decision;
  markSelectedButton('phase-1', decision);
  renderConsequence('consequence-1', decision, SCENARIO.stage1);
  showNextButton('next-1');
}

function handleStage2Decision(decision) {
  if (STATE.stage2Choice) return;
  STATE.stage2Choice = decision;
  markSelectedButton('phase-2', decision);
  renderConsequence('consequence-2', decision, SCENARIO.stage2);
  showNextButton('next-2');
}

function handleStage3Decision(decision) {
  if (STATE.stage3Choice) return;
  STATE.stage3Choice = decision;
  markSelectedButton('phase-3', decision);
  renderConsequence('consequence-3', decision, SCENARIO.stage3);
  showNextButton('next-3');
}


/* ═══════════════════════════════════════════════════════════════
   SCORE CALCULATION — deterministic
═══════════════════════════════════════════════════════════════ */
function calculateScores() {
  const key = `${STATE.stage1Choice}_${STATE.stage2Choice}_${STATE.stage3Choice}`;
  const scores = SCENARIO.scoreMatrix[key];
  if (!scores) {
    console.warn('Decision Room: unmapped path', key, '· using fallback');
    return { reliability: 50, security: 50, quality: 50 };
  }
  return { reliability: scores[0], security: scores[1], quality: scores[2] };
}

function calculateOverall(scores) {
  // Reliability 40%, Security 30%, Quality 30%
  return Math.round(scores.reliability * 0.4 + scores.security * 0.3 + scores.quality * 0.3);
}

function getVerdict(overall) {
  return SCENARIO.verdicts.find(v => overall >= v.min) || SCENARIO.verdicts[SCENARIO.verdicts.length - 1];
}


/* ═══════════════════════════════════════════════════════════════
   LESSON SELECTOR
═══════════════════════════════════════════════════════════════ */
function selectLessons() {
  const lessons = [];
  const L = SCENARIO.lessons;

  lessons.push(L.root_cause);
  if (STATE.stage1Choice === 'A3') lessons.push(L.diagnose_first);
  if (STATE.stage1Choice === 'A4') lessons.push(L.team_ownership);
  if (STATE.stage1Choice === 'A1' || STATE.stage1Choice === 'A2') lessons.push(L.read_the_diff);
  if (STATE.stage2Choice === 'B1') lessons.push(L.db_indexes);
  if (STATE.stage2Choice === 'B2') lessons.push(L.security_separate);
  if (STATE.stage2Choice === 'B3' || STATE.stage2Choice === 'B4') lessons.push(L.db_indexes);
  if (STATE.stage3Choice === 'C2') lessons.push(L.partial_fix);
  if (STATE.stage3Choice === 'C3') lessons.push(L.security_hygiene, L.partial_fix);
  if (STATE.stage3Choice === 'C4') lessons.push(L.sla_clock);
  if (STATE.stage3Choice === 'C1') lessons.push(L.security_hygiene);

  return [...new Set(lessons)].slice(0, 5);
}


/* ═══════════════════════════════════════════════════════════════
   RENDER INCIDENT REPORT
═══════════════════════════════════════════════════════════════ */
function renderReport() {
  stopIncidentTimer();
  const scores = calculateScores();
  const overall = calculateOverall(scores);
  const verdict = getVerdict(overall);

  const badge = document.getElementById('report-verdict-badge');
  if (badge) { badge.className = `dr-verdict-badge ${verdict.cssClass}`; badge.textContent = verdict.label; }

  const overallEl = document.getElementById('report-overall-score');
  if (overallEl) overallEl.innerHTML = `${overall}<span>/100</span>`;

  // Add verdict description below score
  const descEl = document.getElementById('report-verdict-desc');
  if (descEl) descEl.textContent = verdict.description;

  const scoreMap = [
    { id: 'score-reliability', bar: 'bar-reliability', value: scores.reliability },
    { id: 'score-security',    bar: 'bar-security',    value: scores.security },
    { id: 'score-quality',     bar: 'bar-quality',     value: scores.quality },
  ];

  scoreMap.forEach(({ id, bar, value }) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });

  requestAnimationFrame(() => {
    setTimeout(() => {
      scoreMap.forEach(({ bar, value }) => {
        const el = document.getElementById(bar);
        if (el) el.style.width = `${value}%`;
      });
    }, 120);
  });

  // Decision timeline
  const timelineEl = document.getElementById('timeline-items');
  if (timelineEl) {
    const decisions = [
      { stage: 1, choice: STATE.stage1Choice },
      { stage: 2, choice: STATE.stage2Choice },
      { stage: 3, choice: STATE.stage3Choice },
    ];
    timelineEl.innerHTML = decisions.map(({ stage, choice }) => {
      const outcome = SCENARIO.decisionOutcomes[choice];
      const label = outcome === 'good' ? 'Optimal' : outcome === 'ok' ? 'Partial' : 'Suboptimal';
      return `<div class="dr-timeline-item">
        <span class="dr-tl-stage">${SCENARIO.stageLabels[stage]}</span>
        <span class="dr-tl-choice">${SCENARIO.decisionLabels[choice]}</span>
        <span class="dr-tl-outcome dr-tl-${outcome}">${label}</span>
      </div>`;
    }).join('');
  }

  // Lessons
  const lessonsEl = document.getElementById('lessons-list');
  if (lessonsEl) {
    lessonsEl.innerHTML = selectLessons().map(l => `<li>${l}</li>`).join('');
  }

  // Referee quote
  const quoteEl = document.getElementById('referee-quote');
  if (quoteEl) {
    const key = overall >= 80 ? 'high' : overall < 55 ? 'low' : 'mid';
    quoteEl.innerHTML = SCENARIO.refereeQuotes[key]
      .split('\n\n')
      .map(p => `<p style="margin-bottom:10px">${p.trim()}</p>`)
      .join('');
  }

  showPhase('phase-report');
}


/* ═══════════════════════════════════════════════════════════════
   RESET / REPLAY
═══════════════════════════════════════════════════════════════ */
function resetExperience() {
  stopIncidentTimer();
  STATE = { stage1Choice: null, stage2Choice: null, stage3Choice: null };

  document.querySelectorAll('.dr-btn').forEach(btn => {
    btn.disabled = false;
    btn.classList.remove('selected');
    btn.removeAttribute('aria-pressed');
    btn.style.borderColor = '';
    btn.style.background  = '';
  });

  document.querySelectorAll('.dr-consequence').forEach(el => {
    el.className = 'dr-consequence';
    el.innerHTML = '';
    el.removeAttribute('tabindex');
  });

  // Hide next-button wrappers via CSS class
  document.querySelectorAll('.dr-next-wrap').forEach(el => el.classList.remove('visible'));

  // Reset score bars
  ['bar-reliability', 'bar-security', 'bar-quality'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.width = '0%';
  });

  showPhase('phase-briefing');
}


/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
function init() {
  const btnStart = document.getElementById('btn-start');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      showPhase('phase-1');
      startIncidentTimer();
    });
  }

  // Stage 1
  document.querySelectorAll('#phase-1 .dr-btn').forEach(btn => {
    btn.addEventListener('click', () => handleStage1Decision(btn.dataset.decision));
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStage1Decision(btn.dataset.decision); }
    });
  });

  const btnNext1 = document.getElementById('btn-next-1');
  if (btnNext1) btnNext1.addEventListener('click', () => showPhase('phase-2'));

  // Stage 2
  document.querySelectorAll('#phase-2 .dr-btn').forEach(btn => {
    btn.addEventListener('click', () => handleStage2Decision(btn.dataset.decision));
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStage2Decision(btn.dataset.decision); }
    });
  });

  const btnNext2 = document.getElementById('btn-next-2');
  if (btnNext2) btnNext2.addEventListener('click', () => showPhase('phase-3'));

  // Stage 3
  document.querySelectorAll('#phase-3 .dr-btn').forEach(btn => {
    btn.addEventListener('click', () => handleStage3Decision(btn.dataset.decision));
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStage3Decision(btn.dataset.decision); }
    });
  });

  const btnNext3 = document.getElementById('btn-next-3');
  if (btnNext3) btnNext3.addEventListener('click', () => renderReport());

  const btnReplay = document.getElementById('btn-replay');
  if (btnReplay) btnReplay.addEventListener('click', () => resetExperience());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


/* ═══════════════════════════════════════════════════════════════
   TEST HARNESS
═══════════════════════════════════════════════════════════════ */
if (typeof window !== 'undefined') {
  window.__DR_TEST__ = {
    SCENARIO,
    STATE,
    getSTATE:        () => STATE,
    setChoices:      (a, b, c) => { STATE.stage1Choice = a; STATE.stage2Choice = b; STATE.stage3Choice = c; },
    calculateScores,
    calculateOverall,
    getVerdict,
    selectLessons,
    resetExperience,
  };
}
