import {
  FeedbackResponse,
  SchoolQuerySchema,
} from './../../../src/interfaces/clientSchemas';
import { expect } from 'chai';
import { alreadyProcess, Entity } from '../../../src/utils/parseResponse';
import { alreadyProcessed } from '../../utils/schemas/alreadyProcess';

const schools: SchoolQuerySchema[] = [
  {
    SchoolUUID: '0f51601c-6196-4d74-99d3-089ddac90c55',
    SchoolName: 'School Test',
    SchoolShortCode: 'test',
    Source: 'test',
    OrganizationName: 'OrganizationName',
    ProgramName: ['program name'],
    OrganizationUUID: '0f51601c-6196-4d74-99d3-089ddac90c55',
  },
];

const feedback: FeedbackResponse[] = [
  {
    UUID: '07652888-b2d7-4608-8aee-605d104f4d01',
    Entity: 'User',
    HasSuccess: false,
    ErrorMessage: ['error message'],
    OutputResult: {
      Status: true,
      Messages: 'Success',
    },
  },
];

describe('alreadyProcessed', function () {
  it('works for no data to onboard', function () {
    expect(alreadyProcess(null, Entity.SCHOOL, feedback)).to.be.jsonSchema(
      alreadyProcessed
    );
  });

  it('works for full data to onboard', function () {
    expect(alreadyProcess(schools, Entity.SCHOOL, feedback)).to.be.jsonSchema(
      alreadyProcessed
    );
  });
});
