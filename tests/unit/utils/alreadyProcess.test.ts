import { expect } from 'chai';
import { requestIds } from '../../../src/config/requestIds';
import { BackendResponses } from '../../../src/interfaces/backendResponse';
import { alreadyProcess, Entity } from '../../../src/utils/parseResponse';

const schools: BackendResponses = {
  responsesList: [
    {
      requestId: {
        id: requestIds.CREATE_SCHOOL,
        n: '1',
      },
      entity: 1,
      entityName: Entity.SCHOOL,
      entityId: '0f51601c-6196-4d74-99d3-089ddac90c55',
      success: true,
    }
  ],
}

describe('alreadyProcessed', function () {
  it('should return object', function () {
    console.log(alreadyProcess(schools));
    
    expect(alreadyProcess(schools)).to.be.an('object');
  });
});
