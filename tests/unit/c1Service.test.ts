import {C1Service} from '../../src/services/c1Service';
import {createFakeClient} from '../utils/createFakeClient';
import chai, {expect} from 'chai';
import spies from 'chai-spies';
chai.use(spies);
import nock from 'nock';
import {c1GetSchoolsResponse} from '../utils/c1GetSchoolsResponse';

const hostname = 'testapi.ezmis.in';
const schoolPath = '/KL/SchoolsForKL';

const service = new C1Service();

const headers = {
  'Authorization': 'Bearer ',
  'Content-Type': 'application/json'
};

const pathSegments = ['test'];

describe('C1 Service', () => {
  describe('#getSchools', () => {
    beforeEach(() => {
      nock('https://' + hostname, {reqheaders: headers})
        .get(schoolPath).reply(200, c1GetSchoolsResponse);
      chai.spy.on(service, 'createClient', () => createFakeClient(hostname, schoolPath));
    });

    afterEach(() => {
      chai.spy.restore(service, 'createClient');
    })

    it('should return schools list', function() {
      return service.getSchools(pathSegments).then((res) => {
        expect(service.createClient).to.have.been.called.once;
        expect(typeof res).to.equal('object');
        expect(Array.isArray(res)).to.equal(true);
        expect(res).to.have.length(2);
      });
    });
  });
});
