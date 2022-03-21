import logger from "../../../src/utils/logging";
import chai, { expect } from 'chai';
import spies from 'chai-spies';
import {dedupeClasses, dedupeSchools, dedupeUsers} from "../../../src/utils/dedupe";
import {getClasses, getSchools, getUsers} from "../../utils/responses/c1";
import {classSchema, schoolSchema, userSchema} from "../../utils/schemas/c1";
chai.use(spies);

describe('dedupe entities', function () {
  before(() => {
    chai.spy.on(logger, 'info', () => true);
  });
  after(() => {
    chai.spy.restore(logger, 'error');
  })
  describe('#dedupe schools', () => {
    it('should return unique schools', () => {
      const uniqueSchools = dedupeSchools(getSchools);
      expect(uniqueSchools).to.be.an('array');
      expect(uniqueSchools).to.have.length(2);
      if (Array.isArray(uniqueSchools)) {
        uniqueSchools.forEach((s) => expect(s).to.be.jsonSchema(schoolSchema));
      }
    });
  });
  describe('#dedupe classes', () => {
    it('should return unique classes', () => {
      const uniqueClasses = dedupeClasses(getClasses);
      expect(uniqueClasses).to.be.an('array');
      expect(uniqueClasses).to.have.length(2);
      if (Array.isArray(uniqueClasses)) {
        uniqueClasses.forEach((c) => expect(c).to.be.jsonSchema(classSchema));
      }
    });
  });

  describe('#dedupe users', () => {
    it('should return unique users', () => {
      const uniqueUsers = dedupeUsers(getUsers);
      expect(uniqueUsers).to.be.an('array');
      expect(uniqueUsers).to.have.length(2);
      if (Array.isArray(uniqueUsers)) {
        uniqueUsers.forEach((u) => expect(u).to.be.jsonSchema(userSchema));
      }
    });
  });
});
