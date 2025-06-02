import request from 'supertest';
import express from 'express';
import { createApp } from '../index';

// Create test app instance
export const createTestApp = (): express.Application => {
  return createApp();
};

// Helper function to create supertest instance
export const createTestRequest = () => {
  const app = createTestApp();
  return request(app);
};

// Mock data generators
export const mockArchetype = {
  id: 'test-archetype-1',
  name: 'Test Archetype',
  description: 'A test archetype for unit testing',
  category: 'test',
  traits: ['trait1', 'trait2'],
  platforms: ['instagram', 'tiktok'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockTrend = {
  id: 'test-trend-1',
  name: 'Test Trend',
  description: 'A test trend for unit testing',
  platform: 'instagram',
  popularity: 85,
  archetypeIds: ['test-archetype-1'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Helper to wait for async operations
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
}; 