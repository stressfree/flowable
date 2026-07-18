import { execSync } from 'child_process';
import { expect, request as apiRequest } from '@playwright/test';

async function globalSetup() {
  console.log('[Global Setup] Waiting for backend API...');
  const requestContext = await apiRequest.newContext({
    baseURL: 'http://localhost:8080/v1',
  });

  let retries = 0;
  while (retries < 30) {
    try {
      const response = await requestContext.get('/v1/bundle-types');
      if (response.ok()) break;
    } catch {
      // not ready
    }
    retries++;
    console.log(`[Global Setup] Waiting for backend... (${retries}/30)`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  if (retries >= 30) {
    throw new Error('Backend did not become available within 60 seconds');
  }

  console.log('[Global Setup] Running seed script...');
  try {
    execSync('./scripts/seed-samples.sh', {
      stdio: 'inherit',
      env: { ...process.env, BASE_URL: 'http://localhost:8080/v1' },
    });
    console.log('[Global Setup] Seed script completed successfully.');
  } catch (error) {
    console.error('[Global Setup] Seed script failed:', error);
    throw error;
  }

  console.log('[Global Setup] Verifying seeded data...');
  const response = await requestContext.get('/v1/bundles');
  const bundles = await response.json();
  expect(bundles.length).toBeGreaterThanOrEqual(5);
  console.log(`[Global Setup] Found ${bundles.length} bundles. Setup complete.`);
}

export default globalSetup;
