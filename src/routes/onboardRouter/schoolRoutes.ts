import express, { Request, Response } from 'express';
import { C1Service } from '../../services/c1Service';
import { Cache } from '../../utils/cache';
import { BackendService } from '../../services/backendService';
import { SuccessResponse } from '../../utils';
import { SchoolQuerySchema } from '../../interfaces/clientSchemas';

const router = express.Router();
const service = new C1Service();
const cache = Cache.getInstance();
const backendService = BackendService.getInstance();

router.post('/:organizationId', async (req: Request, res: Response) => {
  const { schoolIds = [] }: { schoolIds: string[] } = req.body;

  const response = new SuccessResponse();
  let schools: Array<SchoolQuerySchema> = await service.getSchools([req.params.organizationId, 'Schools']);

  if (!schools || schools.length === 0) {
    return res.json(response);
  }

  // cache schools
  schools.forEach((school: SchoolQuerySchema) => {
    cache.addSchoolId(school.SchoolName, school.SchoolUUID);
  });

  // filter out schools that aren't in schoolIds array
  if (schoolIds.length) {
    schools = schools.filter(school => schoolIds.includes(school.SchoolUUID));
  }

  // call generic backend
  await backendService.onboardSchools(schools);

  // check in response for validation errors

  return response;
});
export default router;
