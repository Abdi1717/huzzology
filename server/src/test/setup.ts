import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Setup test database or other global resources
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup test database or other global resources
  console.log('Cleaning up test environment...');
});

beforeEach(() => {
  // Reset any mocks or test state before each test
});

afterEach(() => {
  // Cleanup after each test
}); 