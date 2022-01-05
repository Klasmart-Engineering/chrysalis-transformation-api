import { dbError } from '../utils/handleErrorUtils';
import { handleError } from './../../src/utils/errorHandler';
import chai, { expect } from 'chai';
import spies from 'chai-spies';
import logger from '../../src/utils/logging';
import { RetryQueue } from '../../src/utils/retryQueue';
chai.use(spies);

const retry = new RetryQueue('test');

describe('errorHandler', function () {
  describe('#testingErrorHanlder', function () {
    beforeEach(async function () {
      chai.spy.on(logger, 'error', () => true);
      chai.spy.on(retry, 'createJob', () => true);

      await handleError(dbError);
      await handleError(dbError, () => {
        return new Promise((resolve, reject) => {
          reject(dbError);
        });
      });
    });

    it('should retry db error happens', function () {
      expect(logger.error).to.have.been.called.twice;
      expect(retry.createJob).to.have.been.called;
    });
  });
});
