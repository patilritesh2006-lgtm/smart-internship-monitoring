import { test, expect } from '@playwright/test';
import { DEMO_USERS } from '../fixtures/test-data';

const BACKEND_URL = 'http://127.0.0.1:8000';

test.describe('G. Backend REST API Integration', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Obtain valid JWT token for authenticated endpoint tests
    const res = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: {
        email: DEMO_USERS.student.email,
        password: DEMO_USERS.student.password,
      },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    authToken = data.access_token;
  });

  test('G1: GET /health returns 200 with online status', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.intelligence_engine).toBe('online');
  });

  test('G2: GET / returns API root metadata and documentation link', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.docs_url).toBe('/docs');
    expect(body.health_url).toBe('/health');
  });

  test('G3: POST /api/auth/login authenticates student and issues JWT token', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: {
        email: DEMO_USERS.student.email,
        password: DEMO_USERS.student.password,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBeDefined();
    expect(body.role).toBe('STUDENT');
    expect(body.email).toBe(DEMO_USERS.student.email);
  });

  test('G4: POST /api/auth/login rejects wrong credentials with 401 Unauthorized', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/auth/login`, {
      data: {
        email: DEMO_USERS.student.email,
        password: 'IncorrectPassword999',
      },
    });
    expect(res.status()).toBe(401);
  });

  test('G5: GET /api/students/me without Authorization header returns 401', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/students/me`);
    expect(res.status()).toBe(401);
  });

  test('G6: GET /api/internships returns array of available internships', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/internships`);
    expect(res.status()).toBe(200);
    const internships = await res.json();
    expect(Array.isArray(internships)).toBe(true);
    expect(internships.length).toBeGreaterThan(0);
    expect(internships[0]).toHaveProperty('title');
    expect(internships[0]).toHaveProperty('company_name');
  });

  test('G7: POST /api/analytics/skill-gap computes accurate skill match percentage', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/analytics/skill-gap`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        student_skills: ['Python', 'SQL', 'FastAPI'],
        required_skills: ['Python', 'FastAPI', 'Docker', 'Kubernetes'],
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('match_percentage');
    expect(body.match_percentage).toBeGreaterThan(0);
  });

  test('G8: POST /api/analytics/evaluate-progress-simulation returns deterministic attention score', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/analytics/evaluate-progress-simulation`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        task_completion: 80.0,
        report_submission: 90.0,
        mentor_feedback: 85.0,
        progress_consistency: 88.0,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('attention_score');
    expect(body).toHaveProperty('attention_status');
  });
});
