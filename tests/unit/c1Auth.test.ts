import chai, {expect} from 'chai';
import spies from 'chai-spies';
chai.use(spies);
import {AuthServer} from '../../src/utils/authServer';
import {c1GetTokenResponse} from '../utils/c1GetTokenResponse';

const hostname = 'testapi.ezmis.in';
const loginPath = '/Accounts/Authenticate-KL';
const loginTestData = JSON.stringify({
  'Username': 'test',
  'Password': 'test'
});
const authServer = new AuthServer(hostname, loginTestData);

describe('C1 Auth', () => {
  describe('#login', () => {
    beforeEach(() => {
      chai.spy.on(authServer, 'login', () => authServer.jwtToken = c1GetTokenResponse.JwtToken);
    });

    afterEach(() => {
      chai.spy.restore(authServer, 'login');
    })

    it('should return access token', function() {
      return authServer.getAccessToken(loginPath).then((res) => {
        expect(typeof res).to.equal('string');
        expect(res).length.greaterThan(0)
      });
    });
  });
});
