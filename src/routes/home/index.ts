import express, { Request, Response } from 'express';
import logger from '../../utils/logging';
import Database from '../../utils/database';
import { HttpError } from '../../utils';
import { RetryQueue } from '../../utils';
import { AdminService } from '../../services/adminService';
import { C1Service } from '../../services/c1Service';
import { MappedClass, MappedSchool } from '../../utils/mapResKeys';
import { validateClasses, validateSchool } from '../../utils/validations';
import { ClassQuerySchema, SchoolQuerySchema } from '../../services/c1Schemas';

const router = express.Router();
const service = new C1Service();

const retryQueue = new RetryQueue('test');
retryQueue.createWorker(Database.getAllSchools);

router.get('/', async (req: Request, res: Response) => {
  const job = await retryQueue.createJob();
  job.on('succeeded', (result) => res.status(200).json(result));
  job.on('failed', (error) => {
    logger.error(error.message);
    res.status(400).json(error.message);
  });
});

//this function should be de deleted in the future
router.get(
  '/schools/:OrganizationUUID',
  async (req: Request, res: Response) => {
    try {
      const { OrganizationUUID } = req.params;
      const pathSegments = [OrganizationUUID, 'Schools'];
      const schools = (await service.getSchools(
        pathSegments
      )) as SchoolQuerySchema[];

      if (Array.isArray(schools)) {
        schools.forEach((school) => {
          const mappedSchool = new MappedSchool(OrganizationUUID, school);

          if (validateSchool(mappedSchool)) {
            //insert into db
          }
        });
      }
      res.json(schools);
    } catch (e) {
      e instanceof HttpError
        ? res.status(e.status).json(e)
        : res.status(500).json(e);
    }
  }
);

// this function should be de deleted in the future
router.get(
  '/school/:SchoolUUID/classes',
  async (req: Request, res: Response) => {
    try {
      const { SchoolUUID } = req.params;
      const classes = (await service.getClasses([
        SchoolUUID,
      ])) as ClassQuerySchema[];

      if (!classes) {
        throw new HttpError(404, { message: 'Classes not found.' });
      }

      const mappedClasses = classes.map((c) => new MappedClass(c));
      const classesValid = await validateClasses(mappedClasses);

      if (classesValid) {
        logger.info('classes are valid');
        // insert into db
      }

      res.json(classes);
    } catch (e) {
      e instanceof HttpError
        ? res.status(e.status).json(e)
        : res.status(500).json(e);
    }
  }
);

// (testing purpose, will delete later) get programs from Admin User service
router.get('/programs', async (req: Request, res: Response) => {
  try {
    // While loop to get all programs from Admin User service
    const adminService = await AdminService.getInstance();
    const programs = await adminService.getPrograms();
    res.json(programs);

    if (programs) {
      await Database.createPrograms(programs);
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
      await Database.createRoles(roles);
    }
  } catch (e) {
    e instanceof HttpError
      ? res.status(e.status).json(e)
      : res.status(500).json(e);
  }
});

export default router;
