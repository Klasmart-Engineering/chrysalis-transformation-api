import { expect } from 'chai';
import messages from '../../../src/validatorsSchemes/messages';
import { stringInject } from '../../../src/utils/string';
import { invalidUser, isUserValid, validUser } from '../../utils/user';
import { userSchema } from '../../../src/validatorsSchemes';

describe('user validation', function () {
  it('should return true', function () {
    expect(isUserValid(validUser)).to.be.true;
  });

  it('should return false', function () {
    expect(isUserValid(invalidUser)).to.be.false;
  });

  it('should return all validation errors with custom messages', function () {
    const { error } = userSchema.validate(invalidUser, {
      abortEarly: false,
    });
    const errorDetails = error?.details.map(
      (detail: { message: string }) => detail.message
    );

    expect(error?.details).to.have.length(3);
    expect(errorDetails).to.include(
      stringInject(messages['string.empty'], ['UserGivenName'])
    );
    expect(errorDetails).to.include(
      stringInject(messages['string.guid'], ['UserUUID'])
    );
    expect(errorDetails).to.include(
      'The "Email" format is wrong'
    );
  });
});
