import { McbService } from '../../src/services/mcbService';
import { createFakeClient } from '../utils/createFakeClient';
import chai, { expect } from 'chai';
import spies from 'chai-spies';
chai.use(spies);
import nock from 'nock';
import { getSchools } from '../utils/responses/mcb';

const hostname = 'klapi.myclassboard.com';
const schoolPath = '/api/KidsLoop/Get_SchoolsList';

const service = new McbService();

const headers = {
  Authorization: 'Bearer ',
  'Content-Type': 'application/json',
};

const params = { programmeGuid: 'test' };

describe('MCB Service', () => {
  describe('#getSchools', () => {
    beforeEach(() => {
      nock('https://' + hostname, { reqheaders: headers })
        .get(schoolPath)
        .reply(200, getSchools);
      chai.spy.on(service, 'createClient', () =>
        createFakeClient(hostname, schoolPath)
      );
    });

    afterEach(() => {
      chai.spy.restore(service, 'createClient');
    });

    it('should return schools list', function () {
      return service.getSchools(params).then((res) => {
        expect(service.createClient).to.have.been.called.once;
        expect(typeof res).to.equal('object');
        expect(res).to.have.property('status');
        expect(res).property('status').to.equal('1');
        expect(res).to.have.property('data');
        expect(res).property('data').to.have.length(2);
      });
    });
  });
});
