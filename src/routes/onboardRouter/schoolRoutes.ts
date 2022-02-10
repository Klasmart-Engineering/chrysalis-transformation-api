import express, { Request, Response } from 'express';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { SchoolQuerySchema } from '../../interfaces/clientSchemas';

const router = express.Router();
const service = new C1Service();
const backendService = BackendService.getInstance();

router.post('/:organizationUUID', async (req: Request, res: Response) => {
  const { organizationUUID } = req.params;
  const { schoolIds = [] }: { schoolIds: string[] } = req.body;

  let schools: Array<SchoolQuerySchema> = await service.getSchools([
    organizationUUID,
    'Schools',
  ]);

  if (!schools || schools.length === 0) {
    return res.json([]);
  }

  // filter out schools that aren't in schoolIds array
  if (schoolIds.length) {
    schools = schools.filter((school) => schoolIds.includes(school.SchoolUUID));
  }

  // call generic backend
  await backendService.onboardSchools(organizationUUID, schools);

  // check in response for validation errors

  res.status(204).json();
});
export default router;
