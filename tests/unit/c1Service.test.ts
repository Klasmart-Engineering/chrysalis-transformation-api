import chai, { expect } from 'chai';
import spies from 'chai-spies';
import nock from 'nock';
import jsonSchema from 'chai-json-schema';
import logger from '../../src/utils/logging';
import { C1Service } from '../../src/services/c1Service';
import { C1Endpoints } from '../../src/config/c1Endpoints';
import { schoolSchema, classSchema } from '../utils/schemas/c1';
import { createFakeClient } from '../utils/createFakeClient';
import { getSchools, getClasses } from '../utils/responses/c1';

chai.use(spies);
chai.use(jsonSchema);

let service: C1Service;
const hostname = 'testapi.ezmis.in';
const schoolPath = '/KL/SchoolsForKL';
const pathSegments = ['test'];

const headers = {
  Authorization: 'Bearer ',
  'Content-Type': 'application/json',
};

describe('C1 Service', () => {
  describe('#getSchools', () => {
    beforeEach(() => {
      nock('https://' + hostname, { reqheaders: headers })
        .get(schoolPath)
        .reply(200, getSchools);
      chai.spy.on(logger, 'error', () => true);
      service = new C1Service();
      chai.spy.on(service, 'createClient', () =>
        createFakeClient(hostname, schoolPath)
      );
    });

    afterEach(() => {
      chai.spy.restore(logger, 'error');
      chai.spy.restore(service, 'createClient');
    });

    it('should return schools array of defined school schema', function () {
      return service.getSchools(pathSegments).then((res) => {
        expect(service.createClient).to.have.been.called.once;
        expect(res).to.be.an('array');
        if (Array.isArray(res))
          res.forEach((product) =>
            expect(product).to.be.jsonSchema(schoolSchema)
          );
      });
    });
  });

  describe('#getClasses', () => {
    beforeEach(() => {
      nock('https://' + hostname, { reqheaders: headers })
        .get(C1Endpoints.classApiEndpoint)
        .reply(200, getClasses);
      service = new C1Service();
      chai.spy.on(logger, 'error', () => true);
      chai.spy.on(service, 'createClient', () =>
        createFakeClient(hostname, C1Endpoints.classApiEndpoint)
      );
    });

    afterEach(() => {
      chai.spy.restore(logger, 'error');
      chai.spy.restore(service, 'createClient');
    });

    it('should return classes list', function () {
      return service.getClasses(pathSegments).then((res) => {
        expect(service.createClient).to.have.been.called.once;
        expect(res).to.be.an('array');
        expect(res).to.have.length(2);
        if (Array.isArray(res)) {
          res.forEach((product) =>
            expect(product).to.be.jsonSchema(classSchema)
          );
        }
      });
    });
  });
});
