import chai, { expect } from 'chai';
import { isSchoolValid } from '../utils/school';
import { validSchool, invalidSchool } from '../utils/school';
import spies from 'chai-spies';
chai.use(spies);

describe('validation', function () {
  describe('#validateSchool', function () {
    it('should return true', function () {
      expect(isSchoolValid(validSchool)).to.be.true;
    });

    it('should return false', function () {
      expect(isSchoolValid(invalidSchool)).to.be.false;
    });
  });
});
