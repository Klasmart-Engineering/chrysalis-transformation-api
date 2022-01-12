import fs from 'fs';
import path from 'path';
import chaiAsPromised from 'chai-as-promised';
import supertest from 'supertest';
import { expect, use } from 'chai';
import dotenv from 'dotenv';
import app from '../../src/app';

use(chaiAsPromised);

// Override environment variables
const envConfig = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname, '../../.env.test'))
);
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const requestWithSupertest = supertest(app);

describe('POST /onboarding', () => {
  beforeEach(async () => {
    // something here
  });

  it('returns 401 error if X_API_SECRET is empty', async () => {
    const res = await requestWithSupertest
      .post('/onboarding')
      .send({ organizationName: 'organization', schoolName: 'school' });

    expect(res.status).to.eq(401);
  });

  it('returns 401 error if X_API_SECRET is invalid', async () => {
    const res = await requestWithSupertest
      .post('/onboarding')
      .set('X_API_SECRET', 'invalid')
      .send({ organizationName: 'organization', schoolName: 'school' });

    expect(res.status).to.eq(401);
  });

  it('returns 400 error if organizationName is empty', async () => {
    const res = await requestWithSupertest
      .post('/onboarding')
      .set('X_API_SECRET', process.env.API_SECRET || 'API_SECRET')
      .send({ organizationName: '', schoolName: 'school' });

    expect(res.status).to.eq(400);
  });

  it('returns 400 error if schoolName is empty', async () => {
    const res = await requestWithSupertest
      .post('/onboarding')
      .set('X_API_SECRET', process.env.API_SECRET || 'API_SECRET')
      .send({ organizationName: 'organization', schoolName: '' });

    expect(res.status).to.eq(400);
  });
});
