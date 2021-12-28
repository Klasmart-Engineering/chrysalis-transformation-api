import { expect } from 'chai';
import { isSchoolValid } from '../utils/school';
import { validSchool, invalidSchool } from '../../tests/utils/school';

describe('validation', function() {
    describe('#validateSchool', function() {
        it('should return true', function() {
            expect(isSchoolValid(validSchool)).to.be.true;
        });
        
        it('should return false', function() {
            expect(isSchoolValid(invalidSchool)).to.be.false;
        });
    })
});