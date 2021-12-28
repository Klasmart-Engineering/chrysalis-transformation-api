import {C1Service} from '../../src/services/c1Service';
import {createFakeClient} from '../utils/createFakeClient';
import chai, {expect} from 'chai';
import spies from 'chai-spies';
import jsonSchema from 'chai-json-schema';
chai.use(spies);
chai.use(jsonSchema);
import nock from 'nock';
import {c1GetSchoolsResponse} from '../utils/c1GetSchoolsResponse';
import logger from '../../src/utils/logging';
import {c1SchoolSchema} from '../utils/c1SchoolSchema';

const hostname = 'testapi.ezmis.in';
const schoolPath = '/KL/SchoolsForKL';

let service: C1Service;

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
      chai.spy.on(logger, 'error', () => true);
      service = new C1Service();
      chai.spy.on(service, 'createClient', () => createFakeClient(hostname, schoolPath));
    });

    afterEach(() => {
      chai.spy.restore(logger, 'error');
      chai.spy.restore(service, 'createClient');
    })

    it('should return schools array of defined school schema', function() {
      return service.getSchools(pathSegments).then((res) => {
        expect(service.createClient).to.have.been.called.once;
        expect(res).to.be.an('array');
        if (Array.isArray(res))
        res.forEach(product => expect(product).to.be.jsonSchema(c1SchoolSchema));
      });
    });
  });
});
