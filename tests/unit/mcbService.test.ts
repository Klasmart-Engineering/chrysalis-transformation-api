import {McbService} from '../../src/services/mcbService';
import {createFakeClient} from '../utils/createFakeClient';
import {expect} from 'chai';
import nock from 'nock';
import {mcbGetSchoolsResponse} from '../utils/mcbGetSchoolsResponse';

const hostname = 'klapi.myclassboard.com';
const schoolPath = '/api/KidsLoop/Get_SchoolsList';

const service = new McbService();

const headers = {
  'Authorization': 'Bearer ',
  'Content-Type': 'application/json'
};

const params = {programmeGuid: 'test'}
let createClientCalled = false;

describe('MCB Service', () => {
  describe('#getSchools', () => {
    beforeEach(() => {
      nock('https://' + hostname, {reqheaders: headers})
        .get(schoolPath).reply(200, mcbGetSchoolsResponse);

      service.createClient = () => {
        createClientCalled = true;
        return createFakeClient(hostname, schoolPath);
      };
    });

    it('should return schools list', function() {
      return service.getSchools(params).then((res) => {
        expect(createClientCalled).to.be.true;
        expect(typeof res).to.equal('object');
        expect(Array.isArray(res)).to.equal(true);
        expect(res).to.have.length(2);
      });
    });
  });
});
