import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logging';
import { HttpError } from '../../utils';
import { RetryQueue } from '../../utils';
import { AdminService } from '../../services/adminService';
import { C1Service } from '../../services/c1Service';
import { validateSchool } from '../../utils/validations';

const router = express.Router();
const prisma = new PrismaClient();
const service = new C1Service();

const retryQueue = new RetryQueue('test');
retryQueue.createWorker(getSchools);

router.get('/', async (req: Request, res: Response) => {
  const job = await retryQueue.createJob();
  job.on('succeeded', (result) => res.status(200).json(result));
  job.on('failed', (error) => {
    logger.error(error.message);
    res.status(400).json(error.message);
  });
});

//example worker function, this should be deleted in the future
function getSchools() {
  return new Promise((resolve, reject) => {
    prisma.school
      .findMany()
      .then((value) => {
        resolve(value);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

//this function should be de deleted in the future
router.get('/schools/:OrganizationUUID', async (req: Request, res: Response) => {
  try {
    const pathSegments = [req.params.OrganizationUUID, 'Schools']
    const schools = await service.getSchools(pathSegments);
    if (Array.isArray(schools)) {
      schools.forEach(school => {
        const mappedSchool = {
          name: school.SchoolName,
          clientUuid: school.SchoolUUID,
          programNames: school.ProgramName,
          organizationName: school.OrganizationName,
          clientOrgUuid: req.params.OrganizationUUID,
          shortCode: school.SchoolShortCode,
          klOrgUuid: req.params.OrganizationUUID
        };
        if (validateSchool(mappedSchool)) {
          //insert into db
        }
      })
    }
    res.json(schools);
  } catch (e) {
    e instanceof HttpError
      ? res.status(e.status).json(e)
      : res.status(500).json(e);
  }
});

// (testing purpose, will delete later) get programs from Admin User service
router.get('/programs', async (req: Request, res: Response) => {
  try {
    // While loop to get all programs from Admin User service
    const adminService = await AdminService.getInstance();
    const programs = await adminService.getPrograms();
    res.json(programs);

    if (programs) {
      await prisma.program.createMany({
        data: programs,
        skipDuplicates: true,
      });
    }
  } catch (e) {
    e instanceof HttpError
      ? res.status(e.status).json(e)
      : res.status(500).json(e);
  }
});

// (testing purpose, will delete later) get programs from Admin User service
router.get('/roles', async (req: Request, res: Response) => {
  try {
    // While loop to get all roles from Admin User service
    const adminService = await AdminService.getInstance();
    const roles = await adminService.getRoles();
    res.json(roles);

    if (roles) {
      await prisma.role.createMany({
        data: roles,
        skipDuplicates: true,
      });
    }
  } catch (e) {
    e instanceof HttpError
      ? res.status(e.status).json(e)
      : res.status(500).json(e);
  }
});

export default router;
