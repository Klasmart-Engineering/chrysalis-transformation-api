import { config } from 'dotenv';
import { expect } from 'chai';

import { HttpClient } from '../../../src/utils/httpClient';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('httpClient', () => {
  before(() => {
    config();
    if (!process.env.C1_API_HOSTNAME)
      throw new Error('C1_API_HOSTNAME must be defined for this test');
    if (!process.env.C1_API_USERNAME)
      throw new Error('C1_API_USERNAME must be defined for this test');
    if (!process.env.C1_API_PASSWORD)
      throw new Error('C1_API_PASSWORD must be defined for this test');
  });

  it('should initialize correctly', async () => {
    const client = await HttpClient.initialize(
      process.env.C1_API_HOSTNAME || ''
    );
    expect(client['accessToken']).to.have.length.greaterThan(5);
    expect(client['refreshToken']).to.have.length.greaterThan(5);
  });

  it('should refresh the token automatically', async () => {
    const client = await HttpClient.initialize(
      process.env.C1_API_HOSTNAME || '',
      500
    );
    const access = client['accessToken'];
    const refresh = client['refreshToken'];
    let sleptTime = 0;
    while (sleptTime < 2500) {
      sleptTime += 750;
      await sleep(750);
      if (client['accessToken'] !== access) break;
    }

    expect(client['accessToken']).to.have.length.greaterThan(5);
    expect(client['accessToken']).to.not.equal(access);
    expect(client['refreshToken']).to.have.length.greaterThan(5);
    expect(client['refreshToken']).to.not.equal(refresh);
  });
});
