import chai, { expect } from 'chai';
import spies from 'chai-spies';
chai.use(spies);
import { AuthServer } from '../../src/utils/authServer';
import { getToken } from '../utils/responses/c1';

const hostname = 'testapi.ezmis.in';
const loginPath = '/Accounts/Authenticate-KL';
const refreshPath = '/Accounts/Refresh-Token';
const loginTestData = JSON.stringify({
  Username: 'test',
  Password: 'test',
});
const authServer = new AuthServer(hostname, loginTestData);

describe('C1 Auth', () => {
  describe('#login', () => {
    beforeEach(() => {
      chai.spy.on(
        authServer,
        'login',
        () => (authServer.jwtToken = getToken.JwtToken)
      );
    });

    afterEach(() => {
      chai.spy.restore(authServer, 'login');
    });

    it('should return access token', function () {
      return authServer.getAccessToken(loginPath).then((res) => {
        expect(typeof res).to.equal('string');
        expect(res).length.greaterThan(0);
      });
    });
  });
});

describe('C1 Refresh token', () => {
  describe('#refreshToken', () => {
    beforeEach(() => {
      chai.spy.on(
        authServer,
        'makeRequest',
        () => {
          return new Promise((resolve) => {
            resolve(getToken)
          });
        }
      );
    });

    afterEach(() => {
      chai.spy.restore(authServer, 'makeRequest');
    });
    it('should return access token', function () {
      return authServer.doRefreshToken(refreshPath).then((res) => {
        expect(authServer["makeRequest"]).to.have.been.called;
        expect(authServer["jwtToken"]).length.to.be.greaterThan(0);
        expect(typeof res).to.equal('string');
        expect(res).length.greaterThan(0);
      });
    });
  });
});
