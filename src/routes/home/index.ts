import express, { Request, Response } from 'express';
import logger from '../../utils/logging';
import Database from '../../utils/database';
import { HttpError } from '../../utils';
import { RetryQueue } from '../../utils';
import { AdminService } from '../../services/adminService';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';
import { MappedClass, MappedSchool } from '../../utils/mapResKeys';
import { validateClasses, validateSchool } from '../../utils/validations';
import {
  ClassQuerySchema,
  SchoolQuerySchema,
} from '../../interfaces/c1Schemas';
import { schoolSchema } from '../../validations/c1';
import { onboardingSchema } from '../../validations/requests/onboarding';
import { onboardClassesSchema } from '../../validations/requests/onboardClasses';
import { shorten } from '../../utils/string';
import { validationRules } from '../../config/validationRules';
import { Cache } from '../../utils/cache';

const router = express.Router();
const cache = Cache.getInstance();
const service = new C1Service();
const backendService = BackendService.getInstance();

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

router.post('/onboarding', async (req: Request, res: Response) => {
  const apiSecret = req.get('X_API_SECRET');
  if (apiSecret != process.env.API_SECRET) {
    return res.status(401).json({
      errors: [`Invalid API secret, please check again!`],
    });
  }

  const { organizationName, schoolName } = req.body;
  const { error } = onboardingSchema.validate({
    organizationName,
    schoolName,
  });
  if (error) {
    return res.status(400).json({
      errors: error.details.map(
        (detail: { message: string }) => detail.message
      ),
    });
  }

  // There should only one organization (if any) because the name is unique on KidsLoop platform
  const findOrg = await Database.getOrganizationByName(organizationName);
  if (findOrg) {
    return res.json(findOrg);
  }

  // Get organizations form Admin Service
  let klOrganizations;
  let errCode;
  const adminService = await AdminService.getInstance();
  try {
    klOrganizations = await adminService.getOrganizations(organizationName);
  } catch (e) {
    logger.error(e);
    errCode = e instanceof HttpError ? e.status : 500;
    return res.status(errCode).json(e);
  }
  if (!klOrganizations) {
    return res.status(400).json({
      errors: [`Organization doesn't exist in KidsLoop.`],
    });
  }
  if (klOrganizations.length > 1) {
    return res.status(400).json({
      errors: [
        `There are more than one organization with name ${organizationName}.`,
      ],
    });
  }

  // There should only one organization because the name is unique
  let organization = klOrganizations[0];

  let c1Organizations;
  try {
    // Get organizations from C1
    c1Organizations = await service.getOrganizations();
    if (!c1Organizations) {
      return res.status(400).json({
        errors: [`Organization doesn't exist in C1.`],
      });
    }
  } catch (e) {
    logger.error(e);
    errCode = e instanceof HttpError ? e.status : 500;
    return res.status(errCode).json(e);
  }

  if (Array.isArray(c1Organizations)) {
    organization.clientUuid = c1Organizations.find(
      (org) => org.OrganizationName === organizationName
    ).OrganizationUUID;
  }
  if (!organization.clientUuid) {
    return res.status(400).json({
      errors: [`Organization doesn't exist in C1.`],
    });
  }

  // Save the organization into CIL DB
  organization = await Database.createOrganization(organization);

  // TODO: connect with other steps, i.e. fetch programs/roles from US, onboarding school/classes/users...

  res.json(organization);
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

//get users by class
//this function should be de deleted in the future
router.get('/class-users/:ClassUUID', async (req: Request, res: Response) => {
  try {
    const pathSegments = [req.params.ClassUUID];
    const users = await service.getUsers(pathSegments);
    res.json(users);
  } catch (e) {
    e instanceof HttpError
      ? res.status(e.status).json(e)
      : res.status(500).json(e);
  }
});

//get users by school
//this function should be de deleted in the future
router.get('/school-users/:SchoolUUID', async (req: Request, res: Response) => {
  try {
    const pathSegments = [req.params.SchoolUUID, 'School'];
    const users = await service.getUsers(pathSegments);

    if (Array.isArray(users)) {
      users.forEach((user, index, result) => {
        user['UserGivenName'] = shorten(
          user['UserGivenName'],
          validationRules.USER_GIVEN_NAME_MAX_LENGTH
        );
        user['UserFamilyName'] = shorten(
          user['UserFamilyName'],
          validationRules.USER_FAMILY_NAME_MAX_LENGTH
        );
        result[index] = user;
      });
    }

    res.json(users);
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

router.post(
  '/onboard/classes/:schoolId',
  async (req: Request, res: Response) => {
    // Authorize & validate request body
    const apiSecret = req.get('X_API_SECRET');
    if (apiSecret != process.env.API_SECRET) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const { schoolId } = req.params;
    const { classIds } = req.body;

    const { error } = onboardClassesSchema.validate(
      {
        schoolId,
        classIds,
      },
      {
        abortEarly: false,
      }
    );

    if (error) {
      return res.status(400).json({
        errors: error.details.map((detail) => ({
          msg: detail.message,
          value: detail.context?.value,
          param: detail.context?.label,
          entity: 'class',
        })),
      });
    }

    // Check whether school exists or not
    const school = (await service.getSchool([schoolId])) as SchoolQuerySchema;
    if (!school) {
      return res.status(404).json({ errors: 'School not found.' });
    }

    // Fetch classes from C1
    let classes: ClassQuerySchema[] = [];
    try {
      classes = (await service.getClasses([schoolId])) as ClassQuerySchema[];

      if (!classes) {
        return res.status(404).json({ message: 'Classes not found.' });
      }
    } catch (err) {
      // TODO: retry here
      logger.error(err);
      return res.status(500).json({ message: 'Cannot fetch classes from C1.' });
    }

    let onboardClasses: ClassQuerySchema[] = [];
    if (classIds) {
      classes.map((c) => {
        if (classIds.includes(c.ClassUUID)) {
          onboardClasses.push(c);
        }
      });
      if (onboardClasses.length <= 0) {
        throw new HttpError(404, { message: 'Classes not found.' });
      }
    } else {
      onboardClasses = [...classes];
    }

    // Validate & add classes to LRU cache if class is valid
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors: Record<string, any>[] = [];
    onboardClasses.forEach((c: ClassQuerySchema, index: number) => {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const { error } = schoolSchema.validate(c, { abortEarly: false });
      if (error) {
        const errorMessages = error.details.map(
          (detail: { message: string }) => detail.message
        );

        errors.push({
          UUID: c.ClassUUID,
          Entity: 'class',
          HasSuccess: false,
          ErrorMessage: errorMessages,
        });
        onboardClasses.splice(index, 1); // remove from onboard classes
      } else {
        cache.addClassId(c.ClassName, c.ClassUUID);
      }
    });

    // TODO: Send errors feedback to client (C1)
    // if (errors) {
    //   await service.postFeedback(errors);
    // }

    // Transform classes to proto objects and send to generic API
    if (onboardClasses) {
      await backendService.onboardClasses(onboardClasses);
    }

    res.status(204).json();
  }
);

export default router;
