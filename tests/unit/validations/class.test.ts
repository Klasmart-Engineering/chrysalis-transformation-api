import { expect } from 'chai';
import { classSchema } from '../../../src/validatorsSchemes';
import messages from '../../../src/validatorsSchemes/messages';
import { stringInject } from '../../../src/utils/string';
import { isClassValid } from '../../utils/class';
import { validClass, invalidClass } from '../../utils/class';

describe('class validation', function () {
  it('should return true', function () {
    expect(isClassValid(validClass)).to.be.true;
  });

  it('should return false', function () {
    expect(isClassValid(invalidClass)).to.be.false;
  });

  it('should return all validation errors with custom messages', function () {
    const { error } = classSchema.validate(invalidClass, {
      abortEarly: false,
    });
    const errorDetails = error?.details.map(
      (detail: { message: string }) => detail.message
    );

    expect(error?.details).to.have.length(3);
    expect(errorDetails).to.include(
      stringInject(messages['string.empty'], ['ClassName'])
    );
    expect(errorDetails).to.include(
      stringInject(messages['string.guid'], ['ClassUUID'])
    );
    expect(errorDetails).to.include(
      '"ClassShortCode" is greater than 16 chars'
    );
  });
});
