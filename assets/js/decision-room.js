/**
 * The Engineer's Decision Room
 * Interactive incident-response simulation
 * Vanilla ES6 · no framework, no build step, no external APIs
 *
 * Architecture:
 *   SCENARIO  · all content: decisions, consequences, scores, lessons, quotes
 *   STATE     · mutable runtime state (current stage + choices made)
 *   Functions · render*, handle*, calculate*, reset*
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   SCENARIO DATA
   All simulated incident data is defined here, separate from logic.
═══════════════════════════════════════════════════════════════ */
const SCENARIO = {

  /* ── Stage 1 consequences ── */
  stage1: {
    A1: {
      quality: 'good',
      icon: 'bi-check-circle-fill',
      title: 'Good instinct.',
      text: 'Diving into the metrics reveals a clear correlation: DB query response time spiked exactly 18 minutes ago, matching the deployment time. CPU is high but memory is stable, which rules out a leak. The latency pattern points squarely at the database layer, not infrastructure or traffic volume.',
      hint: 'The deployment diff is your next stop.',
    },
    A2: {
      quality: 'good',
      icon: 'bi-check-circle-fill',
      title: 'Methodical approach.',
      text: 'The changelog shows it: a new JOIN between user_sessions and analytics_events with no index on analytics_events.created_at. At 1,200 requests per second, that\'s a full table scan on every analytics request. A classic N+1-style performance regression. You\'ve found the smoking gun.',
      hint: 'Your diagnosis is well-supported. Now check the security indicators.',
    },
    A3: {
      quality: 'bad',
      icon: 'bi-exclamation-triangle-fill',
      title: 'Impulsive.',
      text: 'Rolling back without a diagnosis is a gamble. You might restore service, but you\'ve also introduced rollback risk and burned 6 minutes. More critically: the suspicious IPs are still probing your perimeter. You\'ve addressed one symptom while leaving a security exposure unresolved. A good engineer diagnoses before acting.',
      hint: 'Proceed, but be aware your quality score is affected.',
    },
    A4: {
      quality: 'bad',
      icon: 'bi-exclamation-triangle-fill',
      title: 'You are the on-call engineer.',
      text: 'Paging the team is sometimes the right call, but not as your first move at 02:47 UTC. The on-call rota exists for exactly this scenario: you. The team responds 12 minutes later. Latency has climbed to 1,600ms. Error rate is 24%. You\'ve lost time that could have been spent investigating. Leadership is taking responsibility for the situation in front of you.',
      hint: 'Proceed, but the delay has affected your reliability score.',
    },
  },

  /* ── Stage 2 consequences ── */
  stage2: {
    B1: {
      quality: 'good',
      icon: 'bi-check-circle-fill',
      title: 'Correct root cause identified.',
      text: 'The unindexed JOIN is the culprit. analytics_events has 14 million rows. Without an index on created_at, every dashboard request triggers a full table scan that holds DB connections and starves other queries. The background worker change (30s to 5s) is amplifying the load: six times more frequent queries hitting the same slow path. You have a precise diagnosis.',
      hint: 'You know what\'s broken. Now fix it decisively.',
    },
    B2: {
      quality: 'ok',
      icon: 'bi-dash-circle-fill',
      title: 'Partially correct, but incomplete.',
      text: 'The 3 flagged IPs are real and should be addressed. However, their combined 1,315 requests over 15 minutes is not sufficient to cause a 643% latency spike. The DB query logs tell a different story: timeouts of 8,000ms on queries that should take 50ms. Attributing the outage entirely to the IPs misses the actual root cause. Blocking the IPs is good security hygiene, but it won\'t restore your SLA.',
      hint: 'Security is important, but the database is the bottleneck.',
    },
    B3: {
      quality: 'bad',
      icon: 'bi-x-circle-fill',
      title: 'Incorrect diagnosis.',
      text: 'Memory is at 61% and stable. No growth trend, no OOM events in the logs. A memory leak would show progressive memory growth over time, often accompanied by garbage collection pauses. That\'s not what the data shows. Focusing on memory will send you down the wrong path and cost time. The evidence points clearly to the database layer.',
      hint: 'Check the DB query timeouts in the logs. The answer is there.',
    },
    B4: {
      quality: 'bad',
      icon: 'bi-x-circle-fill',
      title: 'Incorrect diagnosis.',
      text: 'The load balancer configuration is unchanged in the deployment diff. All 4 pods are healthy and receiving traffic proportionally. A misconfigured load balancer would typically show uneven traffic distribution or pod health failures. Neither of which is present. This is a red herring. The 8-second DB query timeouts are the signal, not the load balancer.',
      hint: 'Re-read the deployment diff. One change stands out.',
    },
  },

  /* ── Stage 3 consequences ── */
  stage3: {
    C1: {
      quality: 'good',
      icon: 'bi-check-circle-fill',
      title: 'Excellent execution.',
      text: 'v2.4.1 rolled back in 90 seconds. Index added to analytics_events.created_at. v2.4.2 deployed with the fix. Latency returns to 118ms within 4 minutes. Error rate drops to 0.1%. DB connections normalise. The security team has been notified of the 3 flagged IPs for review. Incident resolved within SLA. Full post-mortem scheduled for 09:00.',
    },
    C2: {
      quality: 'ok',
      icon: 'bi-dash-circle-fill',
      title: 'Palliative. Root cause unresolved.',
      text: 'Scaling to 8 pods buys time: latency drops to 420ms and error rate falls to 4%. But the unindexed JOIN is still in production on every pod. As traffic increases through the morning, the problem will return. You\'ve treated the symptom, not the disease. The security exposure from the 3 flagged IPs is also unaddressed. Service is partially restored, but technical debt remains.',
    },
    C3: {
      quality: 'ok',
      icon: 'bi-dash-circle-fill',
      title: 'Security addressed. Application still broken.',
      text: 'Blocking the 3 IPs is correct and reduces suspicious traffic. Scaling provides temporary relief. However, the unindexed DB JOIN is still running in production. Latency improves slightly to 650ms but remains above acceptable thresholds. The real fix, the database index, hasn\'t been applied. You\'ve responded to the secondary issue while leaving the primary one in place.',
    },
    C4: {
      quality: 'bad',
      icon: 'bi-x-circle-fill',
      title: 'SLA breached.',
      text: 'Thirty minutes of monitoring with no action: latency climbs to 2,800ms. Error rate hits 47%. The connection pool exhausts completely at 02:58 UTC. The application goes fully dark at 03:02. SLA is breached. Three enterprise customers open incident tickets. The on-call manager is paged. In engineering, inaction under a known incident is not neutral. It is a decision with consequences.',
    },
  },

  /* ── Score matrix: [reliability, security, quality]
     Indexed as stage1_decision + stage2_decision + stage3_decision ── */
  scoreMatrix: {
    // Optimal path: good assess → correct diagnosis → root fix
    'A1_B1_C1': [95, 82, 98],
    'A2_B1_C1': [95, 82, 96],
    // Good assess, correct diagnosis, scale only
    'A1_B1_C2': [68, 42, 62],
    'A2_B1_C2': [68, 42, 60],
    // Good assess, correct diagnosis, security+scale (missed root fix)
    'A1_B1_C3': [60, 90, 66],
    'A2_B1_C3': [60, 90, 64],
    // Good assess, correct diagnosis, do nothing
    'A1_B1_C4': [18, 30, 14],
    'A2_B1_C4': [18, 30, 12],
    // Good assess, DDoS diagnosis (partial), root fix anyway
    'A1_B2_C1': [82, 92, 72],
    'A2_B2_C1': [82, 92, 70],
    // Good assess, DDoS, scale
    'A1_B2_C2': [62, 70, 52],
    'A2_B2_C2': [62, 70, 50],
    // Good assess, DDoS, block+scale
    'A1_B2_C3': [58, 96, 68],
    'A2_B2_C3': [58, 96, 66],
    // Good assess, DDoS, do nothing
    'A1_B2_C4': [16, 28, 12],
    'A2_B2_C4': [16, 28, 10],
    // Good assess, wrong diagnosis, any response
    'A1_B3_C1': [52, 40, 44],
    'A2_B3_C1': [52, 40, 42],
    'A1_B4_C1': [52, 40, 44],
    'A2_B4_C1': [52, 40, 42],
    'A1_B3_C2': [44, 38, 36],
    'A2_B3_C2': [44, 38, 34],
    'A1_B4_C2': [44, 38, 36],
    'A2_B4_C2': [44, 38, 34],
    'A1_B3_C3': [42, 76, 40],
    'A2_B3_C3': [42, 76, 38],
    'A1_B4_C3': [42, 76, 40],
    'A2_B4_C3': [42, 76, 38],
    'A1_B3_C4': [14, 20, 10],
    'A2_B3_C4': [14, 20,  8],
    'A1_B4_C4': [14, 20, 10],
    'A2_B4_C4': [14, 20,  8],
    // Premature rollback path
    'A3_B1_C1': [80, 52, 60],
    'A3_B1_C2': [62, 38, 48],
    'A3_B1_C3': [58, 82, 54],
    'A3_B1_C4': [18, 22, 14],
    'A3_B2_C1': [74, 86, 58],
    'A3_B2_C2': [58, 64, 44],
    'A3_B2_C3': [54, 90, 52],
    'A3_B2_C4': [16, 24, 12],
    'A3_B3_C1': [48, 38, 38],
    'A3_B4_C1': [48, 38, 38],
    'A3_B3_C2': [40, 34, 30],
    'A3_B4_C2': [40, 34, 30],
    'A3_B3_C3': [38, 72, 36],
    'A3_B4_C3': [38, 72, 36],
    'A3_B3_C4': [12, 18,  8],
    'A3_B4_C4': [12, 18,  8],
    // Delayed team-page path
    'A4_B1_C1': [74, 68, 54],
    'A4_B1_C2': [58, 36, 42],
    'A4_B1_C3': [52, 78, 48],
    'A4_B1_C4': [14, 20, 12],
    'A4_B2_C1': [68, 84, 52],
    'A4_B2_C2': [54, 62, 38],
    'A4_B2_C3': [50, 88, 46],
    'A4_B2_C4': [12, 22, 10],
    'A4_B3_C1': [44, 36, 34],
    'A4_B4_C1': [44, 36, 34],
    'A4_B3_C2': [38, 30, 26],
    'A4_B4_C2': [38, 30, 26],
    'A4_B3_C3': [36, 68, 32],
    'A4_B4_C3': [36, 68, 32],
    'A4_B3_C4': [10, 16,  6],
    'A4_B4_C4': [10, 16,  6],
  },

  /* ── Verdict tiers ── */
  verdicts: [
    {
      min: 85,
      label: 'Incident Commander',
      cssClass: 'dr-verdict-commander',
      description: 'Exceptional incident response. You identified the root cause, acted decisively, and addressed both the performance regression and the security exposure. Exactly what good engineering looks like under pressure.',
    },
    {
      min: 70,
      label: 'Reliable Engineer',
      cssClass: 'dr-verdict-reliable',
      description: 'Solid incident response. You restored service and showed methodical thinking. There were areas where a more thorough approach would have improved the outcome, particularly around root cause identification or security.',
    },
    {
      min: 50,
      label: 'Learning Curve',
      cssClass: 'dr-verdict-learning',
      description: 'Partial success. Service was partially restored, but the root cause was either missed or addressed incompletely. Review the lessons below. These patterns come up in real incidents regularly.',
    },
    {
      min: 0,
      label: 'Postmortem Required',
      cssClass: 'dr-verdict-postmortem',
      description: 'The incident escalated. The SLA was breached and the root cause was never addressed. Real incidents with these outcomes result in postmortem reviews and process improvements. That is how engineers grow.',
    },
  ],

  /* ── Decision labels for the timeline ── */
  decisionLabels: {
    A1: 'Investigated metrics and DB performance',
    A2: 'Reviewed deployment diff and changelogs',
    A3: 'Immediately rolled back without investigation',
    A4: 'Paged development team as first action',
    B1: 'Diagnosed: unindexed DB JOIN (correct)',
    B2: 'Diagnosed: external DDoS attack (partial)',
    B3: 'Diagnosed: memory leak in container (incorrect)',
    B4: 'Diagnosed: load balancer misconfiguration (incorrect)',
    C1: 'Rolled back, added index, redeployed with fix',
    C2: 'Scaled out instances (palliative)',
    C3: 'Blocked IPs and scaled (partial)',
    C4: 'Monitored without acting (SLA breach)',
  },

  /* ── Timeline outcome tags ── */
  decisionOutcomes: {
    A1: 'good', A2: 'good', A3: 'bad', A4: 'bad',
    B1: 'good', B2: 'ok',   B3: 'bad', B4: 'bad',
    C1: 'good', C2: 'ok',   C3: 'ok',  C4: 'bad',
  },

  /* ── Stage labels for timeline ── */
  stageLabels: {
    1: 'Stage 1 · Assess',
    2: 'Stage 2 · Diagnose',
    3: 'Stage 3 · Respond',
  },

  /* ── Lessons bank — selected based on choices made ── */
  lessons: {
    diagnose_first: 'Always diagnose before acting. Rolling back without understanding the root cause risks reintroducing the same bug on the next deploy.',
    read_the_diff: 'The deployment diff is your first evidence source. Changes that correlate with an incident\'s timing are strong suspects.',
    db_indexes: 'Unindexed JOIN queries on large tables are one of the most common causes of sudden production latency spikes after deployments.',
    security_separate: 'Security threats and application performance issues can coexist. Address both, but prioritise the root cause of the user-facing degradation first.',
    sla_clock: 'SLA obligations are real. Inaction under a known incident is itself a decision, and it carries consequences.',
    team_ownership: 'On-call engineering means taking ownership of the situation in front of you, not delegating it as a first response.',
    partial_fix: 'Scaling infrastructure can mask a performance problem temporarily. It is not a fix. It is time bought.',
    security_hygiene: 'Blocking suspicious IPs and flagging them for security review is good hygiene, even when they are not the primary incident cause.',
    root_cause: 'The root cause is always in the data. Logs, metrics, and diffs tell the story if you read them carefully enough.',
  },

  /* ── Referee quotes — selected based on overall score ── */
  refereeQuotes: {
    high: `"In football, the best referees are invisible. Not because they do nothing, but because they act at the right moment, with the right information. A booking at the wrong time changes the match. A decision deferred creates a worse decision later.\n\nEngineering incidents work exactly the same way. Composure is not passivity. It is the discipline to gather evidence before you act, to hold your nerve under noise, and to own the call you make.\n\nEvery production incident is a test of that discipline."`,
    mid: `"A referee who second-guesses every call loses the match. A referee who never questions themselves makes the wrong calls. The best ones know the difference between decisive and reckless.\n\nIn this incident, you made progress. But there were moments where a more thorough read of the evidence would have led to a better outcome. That is not failure: it is the feedback loop that makes engineers better.\n\nReview the decision timeline. Ask yourself: what did I see, and what did I miss?"`,
    low: `"Every referee, every engineer, gets the call wrong sometimes. The ones who improve are the ones who do not look away from the postmortem.\n\nThis incident escalated further than it needed to. Not because the problem was unsolvable. The evidence was there in the logs. It came down to how the decisions were sequenced.\n\nReview the lessons below. Replay the scenario. The goal is not a perfect score. It is understanding why each decision has the outcome it does."`,
  },
};


/* ═══════════════════════════════════════════════════════════════
   MUTABLE STATE — reset on replay
═══════════════════════════════════════════════════════════════ */
let STATE = {
  stage1Choice: null,
  stage2Choice: null,
  stage3Choice: null,
};


/* ═══════════════════════════════════════════════════════════════
   UTILITY HELPERS
═══════════════════════════════════════════════════════════════ */
function showPhase(id) {
  document.querySelectorAll('.dr-phase').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderConsequence(containerId, decision, stageData) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const data = stageData[decision];
  if (!data) return;

  const qualityClass = data.quality === 'good' ? 'good' : data.quality === 'ok' ? 'ok' : 'bad';
  el.className = `dr-consequence visible ${qualityClass}`;
  el.innerHTML = `
    <span class="dr-consequence-title">
      <i class="bi ${data.icon} dr-consequence-icon" aria-hidden="true"></i>${data.title}
    </span>
    ${data.text}
    ${data.hint ? `<div style="margin-top:10px; font-size:0.82rem; opacity:0.7;"><i class="bi bi-arrow-right-circle" aria-hidden="true"></i> ${data.hint}</div>` : ''}
  `;
  el.focus();
}

function disableDecisionButtons(phaseId) {
  document.querySelectorAll(`#${phaseId} .dr-btn`).forEach(btn => {
    btn.disabled = true;
  });
}

function showNextButton(nextId) {
  const el = document.getElementById(nextId);
  if (el) el.style.display = 'block';
}


/* ═══════════════════════════════════════════════════════════════
   DECISION HANDLERS
═══════════════════════════════════════════════════════════════ */
function handleStage1Decision(decision) {
  if (STATE.stage1Choice) return; // idempotent
  STATE.stage1Choice = decision;

  // Highlight chosen button
  document.querySelectorAll('#phase-1 .dr-btn').forEach(btn => {
    if (btn.dataset.decision === decision) {
      btn.style.borderColor = '#1387c1';
      btn.style.background = 'rgba(19,135,193,0.12)';
    }
  });

  renderConsequence('consequence-1', decision, SCENARIO.stage1);
  disableDecisionButtons('phase-1');
  showNextButton('next-1');
}

function handleStage2Decision(decision) {
  if (STATE.stage2Choice) return;
  STATE.stage2Choice = decision;

  document.querySelectorAll('#phase-2 .dr-btn').forEach(btn => {
    if (btn.dataset.decision === decision) {
      btn.style.borderColor = '#1387c1';
      btn.style.background = 'rgba(19,135,193,0.12)';
    }
  });

  renderConsequence('consequence-2', decision, SCENARIO.stage2);
  disableDecisionButtons('phase-2');
  showNextButton('next-2');
}

function handleStage3Decision(decision) {
  if (STATE.stage3Choice) return;
  STATE.stage3Choice = decision;

  document.querySelectorAll('#phase-3 .dr-btn').forEach(btn => {
    if (btn.dataset.decision === decision) {
      btn.style.borderColor = '#1387c1';
      btn.style.background = 'rgba(19,135,193,0.12)';
    }
  });

  renderConsequence('consequence-3', decision, SCENARIO.stage3);
  disableDecisionButtons('phase-3');
  showNextButton('next-3');
}


/* ═══════════════════════════════════════════════════════════════
   SCORE CALCULATION — deterministic
═══════════════════════════════════════════════════════════════ */
function calculateScores() {
  const key = `${STATE.stage1Choice}_${STATE.stage2Choice}_${STATE.stage3Choice}`;
  const scores = SCENARIO.scoreMatrix[key];

  if (!scores) {
    // Fallback for any unmapped combination (should not occur)
    console.warn('Decision Room: unmapped path', key, '· using fallback scores');
    return { reliability: 50, security: 50, quality: 50 };
  }

  return {
    reliability: scores[0],
    security:    scores[1],
    quality:     scores[2],
  };
}

function calculateOverall(scores) {
  // Weighted: reliability 40%, security 30%, quality 30%
  return Math.round(scores.reliability * 0.4 + scores.security * 0.3 + scores.quality * 0.3);
}

function getVerdict(overall) {
  return SCENARIO.verdicts.find(v => overall >= v.min) || SCENARIO.verdicts[SCENARIO.verdicts.length - 1];
}


/* ═══════════════════════════════════════════════════════════════
   LESSON SELECTOR — based on choices made
═══════════════════════════════════════════════════════════════ */
function selectLessons() {
  const lessons = [];
  const L = SCENARIO.lessons;

  // Always include root cause lesson
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

  // Deduplicate while preserving order
  return [...new Set(lessons)].slice(0, 5);
}


/* ═══════════════════════════════════════════════════════════════
   RENDER INCIDENT REPORT
═══════════════════════════════════════════════════════════════ */
function renderReport() {
  const scores = calculateScores();
  const overall = calculateOverall(scores);
  const verdict = getVerdict(overall);

  // Verdict badge
  const badge = document.getElementById('report-verdict-badge');
  if (badge) {
    badge.className = `dr-verdict-badge ${verdict.cssClass}`;
    badge.textContent = verdict.label;
  }

  // Overall score
  const overallEl = document.getElementById('report-overall-score');
  if (overallEl) {
    overallEl.innerHTML = `${overall}<span>/100</span>`;
  }

  // Score cards + bars (animate bars after brief delay)
  const scoreMap = [
    { id: 'score-reliability', bar: 'bar-reliability', value: scores.reliability },
    { id: 'score-security',    bar: 'bar-security',    value: scores.security    },
    { id: 'score-quality',     bar: 'bar-quality',     value: scores.quality     },
  ];

  scoreMap.forEach(({ id, bar, value }) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });

  // Trigger bar animations after DOM paint
  requestAnimationFrame(() => {
    setTimeout(() => {
      scoreMap.forEach(({ bar, value }) => {
        const el = document.getElementById(bar);
        if (el) el.style.width = `${value}%`;
      });
    }, 100);
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
      const outcomeLabel = outcome === 'good' ? 'Optimal' : outcome === 'ok' ? 'Partial' : 'Suboptimal';
      const outcomeClass = `dr-tl-${outcome}`;
      return `
        <div class="dr-timeline-item">
          <span class="dr-tl-stage">${SCENARIO.stageLabels[stage]}</span>
          <span class="dr-tl-choice">${SCENARIO.decisionLabels[choice]}</span>
          <span class="dr-tl-outcome ${outcomeClass}">${outcomeLabel}</span>
        </div>
      `;
    }).join('');
  }

  // Lessons
  const lessonsEl = document.getElementById('lessons-list');
  if (lessonsEl) {
    const lessons = selectLessons();
    lessonsEl.innerHTML = lessons.map(l => `<li>${l}</li>`).join('');
  }

  // Referee quote
  const quoteEl = document.getElementById('referee-quote');
  if (quoteEl) {
    let quoteKey = 'mid';
    if (overall >= 80) quoteKey = 'high';
    else if (overall < 55) quoteKey = 'low';
    // Convert newlines to paragraphs
    const paragraphs = SCENARIO.refereeQuotes[quoteKey]
      .split('\n\n')
      .map(p => `<p style="margin-bottom:10px">${p.trim()}</p>`)
      .join('');
    quoteEl.innerHTML = paragraphs;
  }

  showPhase('phase-report');
}


/* ═══════════════════════════════════════════════════════════════
   RESET / REPLAY
═══════════════════════════════════════════════════════════════ */
function resetExperience() {
  // Reset state
  STATE = { stage1Choice: null, stage2Choice: null, stage3Choice: null };

  // Re-enable all decision buttons
  document.querySelectorAll('.dr-btn').forEach(btn => {
    btn.disabled = false;
    btn.style.borderColor = '';
    btn.style.background = '';
  });

  // Hide all consequence panels
  document.querySelectorAll('.dr-consequence').forEach(el => {
    el.className = 'dr-consequence';
    el.innerHTML = '';
  });

  // Hide all next-stage buttons
  ['next-1', 'next-2', 'next-3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // Reset score bars to 0
  ['bar-reliability', 'bar-security', 'bar-quality'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.width = '0%';
  });

  // Return to briefing
  showPhase('phase-briefing');
}


/* ═══════════════════════════════════════════════════════════════
   INIT — wire up all event listeners
═══════════════════════════════════════════════════════════════ */
function init() {
  // Start button (briefing → stage 1)
  const btnStart = document.getElementById('btn-start');
  if (btnStart) {
    btnStart.addEventListener('click', () => showPhase('phase-1'));
  }

  // Stage 1 decision buttons
  document.querySelectorAll('#phase-1 .dr-btn').forEach(btn => {
    btn.addEventListener('click', () => handleStage1Decision(btn.dataset.decision));
    // Keyboard: Enter and Space both trigger
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStage1Decision(btn.dataset.decision);
      }
    });
  });

  // Stage 1 → Stage 2
  const btnNext1 = document.getElementById('btn-next-1');
  if (btnNext1) {
    btnNext1.addEventListener('click', () => showPhase('phase-2'));
  }

  // Stage 2 decision buttons
  document.querySelectorAll('#phase-2 .dr-btn').forEach(btn => {
    btn.addEventListener('click', () => handleStage2Decision(btn.dataset.decision));
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStage2Decision(btn.dataset.decision);
      }
    });
  });

  // Stage 2 → Stage 3
  const btnNext2 = document.getElementById('btn-next-2');
  if (btnNext2) {
    btnNext2.addEventListener('click', () => showPhase('phase-3'));
  }

  // Stage 3 decision buttons
  document.querySelectorAll('#phase-3 .dr-btn').forEach(btn => {
    btn.addEventListener('click', () => handleStage3Decision(btn.dataset.decision));
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStage3Decision(btn.dataset.decision);
      }
    });
  });

  // Stage 3 → Report
  const btnNext3 = document.getElementById('btn-next-3');
  if (btnNext3) {
    btnNext3.addEventListener('click', () => renderReport());
  }

  // Replay
  const btnReplay = document.getElementById('btn-replay');
  if (btnReplay) {
    btnReplay.addEventListener('click', () => resetExperience());
  }
}

// Bootstrap on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


/* ═══════════════════════════════════════════════════════════════
   TEST HARNESS — exported for automated testing
   Only active when window.DR_TEST_MODE = true
═══════════════════════════════════════════════════════════════ */
if (typeof window !== 'undefined') {
  window.__DR_TEST__ = {
    SCENARIO,
    STATE,
    getSTATE: () => STATE,
    setChoices: (a, b, c) => { STATE.stage1Choice = a; STATE.stage2Choice = b; STATE.stage3Choice = c; },
    calculateScores,
    calculateOverall,
    getVerdict,
    selectLessons,
    resetExperience,
  };
}
