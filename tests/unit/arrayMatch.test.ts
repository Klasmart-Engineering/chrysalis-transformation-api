import { expect } from 'chai';
import { arraysMatch } from '../../src/utils/arraysMatch';

describe('arrayMatch', function () {
  it('should return true', function () {
    expect(arraysMatch(['program1', 'program2'],['program2', 'program1'])).to.be.true;
  });

  it('should return false', function () {
    expect(arraysMatch(['program1', 'program2'],['invalidProgram', 'program2'])).to.be.false;
  });
});
