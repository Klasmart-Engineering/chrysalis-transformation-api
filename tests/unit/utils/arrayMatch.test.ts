import { expect } from 'chai';
import { arraysMatch } from '../../../src/utils/arraysMatch';

const matchArray = [
  'ee92e3a3-c8be-4425-9904-d908c4641491',
  'fc446202-84a2-43d7-8fdf-a915f9101046',
  '4859a113-e204-485d-bc60-a14161130101',
];

const test1 = [
  'fc446202-84a2-43d7-8fdf-a915f9101046',
  'ee92e3a3-c8be-4425-9904-d908c4641491',
  '4859a113-e204-485d-bc60-a14161130101',
];

const test2 = [
  '08f7aacb-25e4-47ee-8da3-aa2f6088f7ad',
  'd3180000-d7da-47b5-9ebd-b3257a3ecdaf',
  'a0e5b042-32a5-43de-a8d4-15b1dee43c2c',
];

const test3 = [
  'ee92e3a3-c8be-4425-9904-d908c4641491',
  'fc446202-84a2-43d7-8fdf-a915f9101046',
];

describe('arraysMatch', function () {
  it('should return true', function () {
    expect(arraysMatch(matchArray, test1)).to.be.true;
  });

  it('should return false', function () {
    expect(arraysMatch(matchArray, test2)).to.be.false;
  });

  it('should return false', function () {
    expect(arraysMatch(matchArray, test3)).to.be.false;
  });
});
