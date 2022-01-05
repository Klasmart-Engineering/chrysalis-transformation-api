import { expect } from 'chai';
import { isClassValid } from '../utils/class';
import { validClass, invalidClass } from '../../tests/utils/class';

describe('Class data validation', function () {
  describe('validate class schema', function () {
    it('should return true', function () {
      expect(isClassValid(validClass)).to.be.true;
    });

    it('should return false', function () {
      expect(isClassValid(invalidClass)).to.be.false;
    });
  });
});
