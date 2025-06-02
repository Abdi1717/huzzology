import { describe, it, expect } from 'vitest';
import { createTestRequest } from '../test/utils';

describe('Health Endpoint', () => {
  it('should return health status', async () => {
    const request = createTestRequest();
    
    const response = await request
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      environment: expect.any(String),
      timestamp: expect.any(String),
    });
  });

  it('should return valid timestamp', async () => {
    const request = createTestRequest();
    
    const response = await request
      .get('/health')
      .expect(200);

    const timestamp = new Date(response.body.timestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).not.toBeNaN();
  });
}); 