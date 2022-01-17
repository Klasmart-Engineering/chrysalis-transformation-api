import { expect } from 'chai';
import { schoolSchema } from '../../../src/validatorsSchemes';
import messages from '../../../src/validatorsSchemes/messages';
import { stringInject } from '../../../src/utils/string';
import { isSchoolValid } from '../../utils/school';
import { validSchool, invalidSchool } from '../../utils/school';

describe('school validation', function () {
  it('should return true', function () {
    expect(isSchoolValid(validSchool)).to.be.true;
  });

  it('should return false', function () {
    expect(isSchoolValid(invalidSchool)).to.be.false;
  });

  it('should return all validation errors with custom messages', function () {
    const { error } = schoolSchema.validate(invalidSchool, {
      abortEarly: false,
    });
    const errorDetails = error?.details.map(
      (detail: { message: string }) => detail.message
    );

    expect(error?.details).to.have.length(2);
    expect(errorDetails).to.include(
      stringInject(messages['string.empty'], ['SchoolName'])
    );
    expect(errorDetails).to.include(
      stringInject(messages['string.guid'], ['SchoolUUID'])
    );
  });
});
