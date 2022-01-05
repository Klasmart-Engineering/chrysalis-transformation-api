import chai, { expect } from 'chai';
import spies from 'chai-spies';
import { AdminService } from '../../../src/services/adminService';
import { adminServiceServer } from '../../mocks/adminServiceServer';

chai.use(spies);

describe('Admin Service', () => {
  // Establish API mocking before all tests.
  before(() => adminServiceServer.listen());

  // Clean up after the tests are finished.
  after(() => adminServiceServer.close());

  // Reset any request handlers that we may add during the tests,
  // so they don't affect other tests.
  afterEach(() => adminServiceServer.resetHandlers());

  describe('#getPrograms', () => {
    it('returns all programs when has pagination', async () => {
      const adminService = await AdminService.getInstance();
      const programs = await adminService.getPrograms();

      expect(typeof programs).to.equal('object');
      expect(Array.isArray(programs)).to.equal(true);
      expect(programs).to.have.length(2);
    });
  });

  describe('#getRoles', () => {
    it('returns all roles when has pagination', async () => {
      const adminService = await AdminService.getInstance();
      const roles = await adminService.getRoles();

      expect(typeof roles).to.equal('object');
      expect(Array.isArray(roles)).to.equal(true);
      expect(roles).to.have.length(2);
    });
  });
});
