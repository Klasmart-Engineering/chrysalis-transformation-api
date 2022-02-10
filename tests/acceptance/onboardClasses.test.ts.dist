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
const schoolId = 'C83928CB-2CA5-441A-8CFB-2576F732F27B';
const classIds = [
  'A1001217-35D5-4223-A146-33AB18720D33',
  'E65D5767-377D-4447-9CE9-4C039D14D437',
];

describe('POST /onboard/classes/:schoolId', () => {
  beforeEach(async () => {
    // something here
  });

  it('returns 404 error if :schoolId is empty', async () => {
    const res = await requestWithSupertest
      .post('/onboard/classes/')
      .send({ classIds });

    expect(res.status).to.eq(404);
  });

  describe('returns 401 error', () => {
    it('if X_API_SECRET is empty', async () => {
      const res = await requestWithSupertest
        .post(`/onboard/classes/${schoolId}`)
        .send({ classIds });

      expect(res.status).to.eq(401);
      expect(res.body.message).to.eq('Unauthorized.');
    });

    it('if X_API_SECRET is invalid', async () => {
      const res = await requestWithSupertest
        .post(`/onboard/classes/${schoolId}`)
        .set('X_API_SECRET', 'invalid')
        .send({ classIds });

      expect(res.status).to.eq(401);
      expect(res.body.message).to.eq('Unauthorized.');
    });
  });

  describe('returns 400 error', () => {
    it('if schoolId is invalid', async () => {
      const res = await requestWithSupertest
        .post('/onboard/classes/a')
        .set('X_API_SECRET', process.env.API_SECRET || 'API_SECRET')
        .send({ classIds });

      expect(res.status).to.eq(400);
      expect(res.body.errors).to.have.length(1);
    });

    it('if classIds have any invalid items', async () => {
      const res = await requestWithSupertest
        .post(`/onboard/classes/${schoolId}`)
        .set('X_API_SECRET', process.env.API_SECRET || 'API_SECRET')
        .send({ classIds: ['a', 'A1001217-35D5-4223-A146-33AB18720D33'] });

      expect(res.status).to.eq(400);
      expect(res.body.errors).to.have.length(1);
    });
  });
});
