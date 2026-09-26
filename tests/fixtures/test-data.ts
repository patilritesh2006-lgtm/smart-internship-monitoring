/**
 * Safe test credentials and dynamic test data generator for SIMMS E2E tests.
 * All credentials correspond to pre-seeded demo accounts from backend/app/core/seed.py.
 */

export const DEMO_USERS = {
  student: {
    name: 'Rohan Patil',
    email: 'student@demo.com',
    password: 'Student@123',
    role: 'STUDENT',
    expectedPath: '/student',
  },
  studentMonitor: {
    name: 'Sneha Kulkarni',
    email: 'student.sara@university.edu',
    password: 'Student@123',
    role: 'STUDENT',
    expectedPath: '/student',
  },
  studentAttention: {
    name: 'Aditya Joshi',
    email: 'student.david@university.edu',
    password: 'Student@123',
    role: 'STUDENT',
    expectedPath: '/student',
  },
  mentor: {
    name: 'Dr. Alan Turing',
    email: 'mentor@demo.com',
    password: 'Mentor@123',
    role: 'MENTOR',
    expectedPath: '/mentor',
  },
  admin: {
    name: 'Dean of Engineering',
    email: 'admin@demo.com',
    password: 'Admin@123',
    role: 'ADMIN',
    expectedPath: '/admin',
  },
};

export const INVALID_USER = {
  email: 'nonexistent.user@university.edu',
  password: 'WrongPassword@999',
};

export function generateRandomStudent() {
  const timestamp = Date.now();
  return {
    fullName: `Test Student ${timestamp}`,
    email: `test.student.${timestamp}@university.edu`,
    password: 'TestPassword@123',
    department: 'Computer Science & Engineering',
    rollNumber: `CS-${timestamp.toString().slice(-4)}`,
    academicYear: 3,
  };
}

export function generateRandomMentor() {
  const timestamp = Date.now();
  return {
    fullName: `Prof. Test Mentor ${timestamp}`,
    email: `test.mentor.${timestamp}@university.edu`,
    password: 'TestPassword@123',
    department: 'Information Technology',
    designation: 'Assistant Professor',
    employeeId: `EMP-${timestamp.toString().slice(-4)}`,
  };
}

export function generateRandomInternship() {
  const timestamp = Date.now();
  return {
    title: `Automated Test Engineer ${timestamp}`,
    companyName: `QualityLabs ${timestamp}`,
    description: 'E2E automated testing role working with Playwright and modern web apps.',
    location: 'Remote',
    stipend: 3500,
    durationWeeks: 12,
    skills: 'TypeScript, Playwright, Next.js, FastAPI',
  };
}

export function generateWeeklyReportData() {
  const timestamp = Date.now();
  return {
    weekNumber: 6,
    title: `Week 6 Comprehensive Progress Report ${timestamp}`,
    hoursLogged: 38.5,
    workCompleted: 'Implemented complete automated testing pipeline with Playwright and validated CI/CD health checks.',
    challengesFaced: 'Configured local webServer timeouts and SQLite multi-process locking safeguards.',
    skillsUsed: ['TypeScript', 'FastAPI', 'Playwright', 'Next.js'],
    nextWeekPlan: 'Expand performance benchmarking and stress test API routes.',
  };
}
