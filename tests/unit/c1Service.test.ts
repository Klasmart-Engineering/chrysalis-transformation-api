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
  feedbackSchema,
  organizationSchema,
} from '../utils/schemas/c1';
import { createFakeClient } from '../utils/createFakeClient';
import {
  getSchools,
  getClasses,
  getUsers,
  getOrganizations,
  getSchool,
  postFeedback,
} from '../utils/responses/c1';

chai.use(spies);
chai.use(jsonSchema);

let service: C1Service;
const hostname = 'testapi.ezmis.in';
const pathSegments = ['test'];
const queryParams = { Skip: '1', Take: '100', ID: 'test' };

const headers = {
  Authorization: 'Bearer ',
  'Content-Type': 'application/json',
};

const feedbackData = [
  {
    UUID: 'c0def826-e930-75bc-620f-b9eec5f43b76',
    Entity: 'fugiat sint dolor anim',
    HasSuccess: false,
    ErrorMessage: 'nostrud anim occaecat',
  },
];
const feedbackBody = JSON.stringify(feedbackData);

describe('C1 Service', () => {
  before(() => {
    service = new C1Service('test');
    chai.spy.on(logger, 'error', () => true);
  });
  after(() => {
    chai.spy.restore(logger, 'error');
  });
  describe('#getSchools', () => {
    beforeEach(() => {
      nock('https://' + hostname, { reqheaders: headers })
        .get(C1Endpoints.schoolsApiEndpoint)
        .reply(200, getSchools);
      chai.spy.on(service, 'createClient', () =>
        createFakeClient(hostname, C1Endpoints.schoolsApiEndpoint)
      );
    });

    afterEach(() => {
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
      chai.spy.on(service, 'createClient', () =>
        createFakeClient(hostname, C1Endpoints.classApiEndpoint)
      );
    });

    afterEach(() => {
      chai.spy.restore(service, 'createClient');
    });

    it('should return classes list', function () {
      return service.getClasses(pathSegments).then((res) => {
        expect(service.createClient).to.have.been.called.once;
        expect(res).to.be.an('array');
        expect(res).to.have.length(2);
        if (Array.isArray(res)) {
          res.forEach((c) => expect(c).to.be.jsonSchema(classSchema));
        }
      });
    });
  });

  describe('#getOrganizations', () => {
    beforeEach(() => {
      nock('https://' + hostname, { reqheaders: headers })
        .get(C1Endpoints.organizationApiEndpoint)
        .reply(200, getOrganizations);
      chai.spy.on(service, 'createClient', () =>
        createFakeClient(hostname, C1Endpoints.organizationApiEndpoint)
      );
    });

    afterEach(() => {
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
      chai.spy.on(service, 'createClient', () =>
        createFakeClient(hostname, C1Endpoints.userApiEndpoint)
      );
    });

    afterEach(() => {
      chai.spy.restore(service, 'createClient');
    });

    it('should return users list', function () {
      return service.getUsers(pathSegments, queryParams).then((res) => {
        expect(service.createClient).to.have.been.called.once;
        expect(res).to.be.an('array');
        expect(res).to.have.length(3);
        if (Array.isArray(res)) {
          res.forEach((user) => expect(user).to.be.jsonSchema(userSchema));
        }
      });
    });
  });

  describe('#postFeedback', () => {
    beforeEach(() => {
      nock('https://' + hostname, { reqheaders: headers })
        .replyContentLength()
        .post(C1Endpoints.feedbackApiEndpoint)
        .reply(200, postFeedback);
      chai.spy.on(service, 'createClient', () =>
        createFakeClient(
          hostname,
          C1Endpoints.feedbackApiEndpoint,
          'POST',
          feedbackBody.length
        )
      );
    });

    afterEach(() => {
      chai.spy.restore(service, 'createClient');
    });

    it('should send feedback to client and return result', function () {
      return service.postFeedback(feedbackData).then((res) => {
        expect(service.createClient).to.have.been.called.once;
        expect(res).to.be.an('object');
        if (Array.isArray(res)) {
          res.forEach((user) => expect(user).to.be.jsonSchema(feedbackSchema));
        }
      });
    });
  });

  describe('#getSchool', () => {
    beforeEach(() => {
      nock('https://' + hostname, { reqheaders: headers })
        .get(C1Endpoints.schoolApiEndpoint)
        .reply(200, getSchool);
      chai.spy.on(service, 'createClient', () =>
        createFakeClient(hostname, C1Endpoints.schoolApiEndpoint)
      );
    });

    afterEach(() => {
      chai.spy.restore(logger, 'error');
      chai.spy.restore(service, 'createClient');
    });

    it('should return school details', function () {
      return service.getSchool(pathSegments).then((res) => {
        expect(service.createClient).to.have.been.called.once;
        expect(res).to.be.an('object');
        expect(res).to.be.jsonSchema(schoolSchema);
      });
    });
  });
});
