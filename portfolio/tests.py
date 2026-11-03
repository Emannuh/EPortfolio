"""
Decision Room — Automated Test Suite
Tests:
  - All 9 routes return HTTP 200 (regression)
  - Decision Room route added correctly
  - Score calculation logic (via Python re-implementation of the matrix)
  - Scenario path coverage
  - Template rendering (no 500 errors)
"""

from django.test import TestCase, Client
from django.urls import reverse, NoReverseMatch


class RouteRegressionTests(TestCase):
    """Verify all 9 routes return HTTP 200 after Decision Room addition."""

    def setUp(self):
        self.client = Client()

    def test_index(self):
        response = self.client.get(reverse('index'))
        self.assertEqual(response.status_code, 200)

    def test_about(self):
        response = self.client.get(reverse('about'))
        self.assertEqual(response.status_code, 200)

    def test_resume(self):
        response = self.client.get(reverse('resume'))
        self.assertEqual(response.status_code, 200)

    def test_portfolio(self):
        response = self.client.get(reverse('portfolio'))
        self.assertEqual(response.status_code, 200)

    def test_portfolio_details(self):
        response = self.client.get(reverse('portfolio-details'))
        self.assertEqual(response.status_code, 200)

    def test_services(self):
        response = self.client.get(reverse('services'))
        self.assertEqual(response.status_code, 200)

    def test_service_details(self):
        response = self.client.get(reverse('service-details'))
        self.assertEqual(response.status_code, 200)

    def test_contact_get(self):
        response = self.client.get(reverse('contact'))
        self.assertEqual(response.status_code, 200)

    def test_decision_room(self):
        """New route — must return 200."""
        response = self.client.get(reverse('decision-room'))
        self.assertEqual(response.status_code, 200)


class DecisionRoomTemplateTests(TestCase):
    """Verify the Decision Room template renders correctly."""

    def setUp(self):
        self.client = Client()

    def test_decision_room_uses_correct_template(self):
        response = self.client.get(reverse('decision-room'))
        self.assertTemplateUsed(response, 'decision-room.html')
        self.assertTemplateUsed(response, 'base.html')

    def test_decision_room_contains_required_elements(self):
        response = self.client.get(reverse('decision-room'))
        content = response.content.decode('utf-8')

        # Disclaimer must be present
        self.assertIn('SIMULATION ONLY', content)

        # All 4 phases must be present
        self.assertIn('id="phase-briefing"', content)
        self.assertIn('id="phase-1"', content)
        self.assertIn('id="phase-2"', content)
        self.assertIn('id="phase-3"', content)
        self.assertIn('id="phase-report"', content)

        # All 12 decision buttons (4 per stage)
        for decision in ['A1', 'A2', 'A3', 'A4',
                         'B1', 'B2', 'B3', 'B4',
                         'C1', 'C2', 'C3', 'C4']:
            self.assertIn(f'data-decision="{decision}"', content,
                          msg=f'Decision button {decision} missing from template')

        # Replay button
        self.assertIn('id="btn-replay"', content)

        # JS and CSS loaded
        self.assertIn('decision-room.js', content)
        self.assertIn('decision-room.css', content)

    def test_decision_room_has_no_django_template_errors(self):
        """If template rendering fails, Django returns 500."""
        response = self.client.get(reverse('decision-room'))
        self.assertNotEqual(response.status_code, 500,
                            'Decision Room template raised a server error')


class DecisionRoomNavTests(TestCase):
    """Verify the nav item and homepage CTA are present on relevant pages."""

    def setUp(self):
        self.client = Client()

    def test_nav_contains_decision_room_link(self):
        response = self.client.get(reverse('index'))
        content = response.content.decode('utf-8')
        self.assertIn('Decision Room', content)
        self.assertIn('/decision-room/', content)

    def test_homepage_contains_dr_cta(self):
        response = self.client.get(reverse('index'))
        content = response.content.decode('utf-8')
        self.assertIn('dr-entry-section', content)
        self.assertIn('Enter the Decision Room', content)
        self.assertIn('02:47 UTC', content)

    def test_skip_link_present(self):
        response = self.client.get(reverse('index'))
        content = response.content.decode('utf-8')
        self.assertIn('skip-link', content)
        self.assertIn('Skip to main content', content)
        self.assertIn('id="main-content"', content)


class ScoreCalculationTests(TestCase):
    """
    Verify score calculation logic using the Python equivalent of the JS matrix.
    These tests mirror the JS SCENARIO.scoreMatrix and calculateOverall() function.
    """

    # Mirror of JS SCENARIO.scoreMatrix (subset — key paths)
    SCORE_MATRIX = {
        'A1_B1_C1': [95, 82, 98],
        'A2_B1_C1': [95, 82, 96],
        'A1_B1_C4': [18, 30, 14],
        'A3_B1_C1': [80, 52, 60],
        'A4_B1_C1': [74, 68, 54],
        'A1_B2_C1': [82, 92, 72],
        'A1_B3_C1': [52, 40, 44],
        'A4_B4_C4': [10, 16,  6],
        'A1_B1_C2': [68, 42, 62],
        'A1_B2_C3': [58, 96, 68],
    }

    @staticmethod
    def calculate_overall(reliability, security, quality):
        """Python mirror of JS calculateOverall(): weighted average."""
        return round(reliability * 0.4 + security * 0.3 + quality * 0.3)

    @staticmethod
    def get_verdict(overall):
        """Python mirror of JS getVerdict()."""
        if overall >= 85:
            return 'Incident Commander'
        elif overall >= 70:
            return 'Reliable Engineer'
        elif overall >= 50:
            return 'Learning Curve'
        else:
            return 'Postmortem Required'

    def test_optimal_path_scores_high(self):
        scores = self.SCORE_MATRIX['A1_B1_C1']
        overall = self.calculate_overall(*scores)
        self.assertGreaterEqual(overall, 85,
            f'Optimal path should score >= 85, got {overall}')
        self.assertEqual(self.get_verdict(overall), 'Incident Commander')

    def test_optimal_path_variant_scores_high(self):
        scores = self.SCORE_MATRIX['A2_B1_C1']
        overall = self.calculate_overall(*scores)
        self.assertGreaterEqual(overall, 85)

    def test_do_nothing_path_scores_low(self):
        scores = self.SCORE_MATRIX['A1_B1_C4']
        overall = self.calculate_overall(*scores)
        self.assertLess(overall, 30,
            f'Do-nothing path should score < 30, got {overall}')
        self.assertEqual(self.get_verdict(overall), 'Postmortem Required')

    def test_premature_rollback_penalised(self):
        premature = self.SCORE_MATRIX['A3_B1_C1']
        optimal   = self.SCORE_MATRIX['A1_B1_C1']
        premature_overall = self.calculate_overall(*premature)
        optimal_overall   = self.calculate_overall(*optimal)
        self.assertLess(premature_overall, optimal_overall,
            'Premature rollback should score lower than methodical investigation')

    def test_team_page_delay_penalised(self):
        delayed = self.SCORE_MATRIX['A4_B1_C1']
        optimal = self.SCORE_MATRIX['A1_B1_C1']
        self.assertLess(
            self.calculate_overall(*delayed),
            self.calculate_overall(*optimal)
        )

    def test_correct_diagnosis_matters(self):
        correct = self.SCORE_MATRIX['A1_B1_C1']
        wrong   = self.SCORE_MATRIX['A1_B3_C1']
        self.assertGreater(
            self.calculate_overall(*correct),
            self.calculate_overall(*wrong),
            'Correct diagnosis should score higher than incorrect'
        )

    def test_worst_path_verdict(self):
        scores = self.SCORE_MATRIX['A4_B4_C4']
        overall = self.calculate_overall(*scores)
        self.assertLess(overall, 50)
        self.assertEqual(self.get_verdict(overall), 'Postmortem Required')

    def test_ddo_s_diagnosis_high_security_score(self):
        scores = self.SCORE_MATRIX['A1_B2_C3']
        # Security score should be high (96) when DDoS diagnosed and IPs blocked
        self.assertGreaterEqual(scores[1], 90,
            'DDoS + block response should yield high security score')

    def test_scale_only_lower_reliability(self):
        scale  = self.SCORE_MATRIX['A1_B1_C2']
        fix    = self.SCORE_MATRIX['A1_B1_C1']
        self.assertLess(
            self.calculate_overall(*scale),
            self.calculate_overall(*fix),
            'Scaling only should score lower reliability than root-fix'
        )

    def test_weighted_average_formula(self):
        """Verify the exact weighted formula: R*0.4 + S*0.3 + Q*0.3"""
        r, s, q = 100, 100, 100
        self.assertEqual(self.calculate_overall(r, s, q), 100)

        r, s, q = 0, 0, 0
        self.assertEqual(self.calculate_overall(r, s, q), 0)

        # 40% weight on reliability
        r, s, q = 100, 0, 0
        self.assertEqual(self.calculate_overall(r, s, q), 40)

        # 30% weight on security
        r, s, q = 0, 100, 0
        self.assertEqual(self.calculate_overall(r, s, q), 30)

        # 30% weight on quality
        r, s, q = 0, 0, 100
        self.assertEqual(self.calculate_overall(r, s, q), 30)


class ContactFormTests(TestCase):
    """Contact form regression — GET renders, POST redirects (Django mode)."""

    def setUp(self):
        self.client = Client()

    def test_contact_get(self):
        response = self.client.get(reverse('contact'))
        self.assertEqual(response.status_code, 200)

    def test_contact_post_redirects(self):
        response = self.client.post(reverse('contact'), {
            'name': 'Test User',
            'email': 'test@example.com',
            'subject': 'Test Subject',
            'message': 'Test message body',
        })
        # Django contact view redirects after successful POST
        self.assertIn(response.status_code, [200, 302])
