import chai from 'chai';

// this file is just for testing the mocha, this should be removed in the future

describe('Array', function () {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      chai.should().equal([1, 2, 3].indexOf(4), -1);
    });
  });
});
