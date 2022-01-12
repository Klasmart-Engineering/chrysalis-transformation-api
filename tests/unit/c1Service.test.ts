import chai, { expect } from 'chai';
import spies from 'chai-spies';
import nock from 'nock';
import jsonSchema from 'chai-json-schema';
import logger from '../../src/utils/logging';
import { C1Service } from '../../src/services/c1Service';
import { C1Endpoints } from '../../src/config/c1Endpoints';
import {
  schoolSchema,
  classSchema,
  userSchema,
  organizationSchema,
} from '../utils/schemas/c1';
import { createFakeClient } from '../utils/createFakeClient';
import {
  getSchools,
  getClasses,
  getUsers,
  getOrganizations,
} from '../utils/responses/c1';

chai.use(spies);
chai.use(jsonSchema);

let service: C1Service;
const hostname = 'testapi.ezmis.in';
const pathSegments = ['test'];

const headers = {
  Authorization: 'Bearer ',
  'Content-Type': 'application/json',
};

describe('C1 Service', () => {
  describe('#getSchools', () => {
    beforeEach(() => {
      nock('https://' + hostname, { reqheaders: headers })
        .get(C1Endpoints.schoolApiEndpoint)
        .reply(200, getSchools);
      chai.spy.on(logger, 'error', () => true);
      service = new C1Service();
      chai.spy.on(service, 'createClient', () =>
        createFakeClient(hostname, C1Endpoints.schoolApiEndpoint)
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
          res.forEach((c) =>
            expect(c).to.be.jsonSchema(classSchema)
          );
        }
      });
    });
  });

  describe('#getOrganizations', () => {
    beforeEach(() => {
      nock('https://' + hostname, { reqheaders: headers })
        .get(C1Endpoints.organizationApiEndpoint)
        .reply(200, getOrganizations);
      service = new C1Service();
      chai.spy.on(logger, 'error', () => true);
      chai.spy.on(service, 'createClient', () =>
        createFakeClient(hostname, C1Endpoints.organizationApiEndpoint)
      );
    });

    afterEach(() => {
      chai.spy.restore(logger, 'error');
      chai.spy.restore(service, 'createClient');
    });

    it('should return organizations list', function () {
      return service.getOrganizations().then((res) => {
        expect(service.createClient).to.have.been.called.once;
        expect(res).to.be.an('array');
        expect(res).to.have.length(3);
        if (Array.isArray(res)) {
          res.forEach((organization) =>
            expect(organization).to.be.jsonSchema(organizationSchema)
          );
        }
      });
    });
  });

  describe('#getUsers', () => {
    beforeEach(() => {
      nock('https://' + hostname, { reqheaders: headers })
        .get(C1Endpoints.userApiEndpoint)
        .reply(200, getUsers);
      service = new C1Service();
      chai.spy.on(logger, 'error', () => true);
      chai.spy.on(service, 'createClient', () =>
        createFakeClient(hostname, C1Endpoints.userApiEndpoint)
      );
    });

    afterEach(() => {
      chai.spy.restore(logger, 'error');
      chai.spy.restore(service, 'createClient');
    });

    it('should return users list', function () {
      return service.getUsers(pathSegments).then((res) => {
        expect(service.createClient).to.have.been.called.once;
        expect(res).to.be.an('array');
        expect(res).to.have.length(3);
        if (Array.isArray(res)) {
          res.forEach((user) =>
            expect(user).to.be.jsonSchema(userSchema)
          );
        }
      });
    });
  });
});
