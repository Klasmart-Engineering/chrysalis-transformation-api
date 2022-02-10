import express, { Request, Response } from 'express';
import { HttpError } from '../../utils';
import logger from '../../utils/logging';
import {
  SchoolQuerySchema,
  ClassQuerySchema,
} from '../../interfaces/clientSchemas';
import { C1Service } from '../../services/c1Service';
import { BackendService } from '../../services/backendService';

const router = express.Router();
const service = new C1Service();
const backendService = BackendService.getInstance();

router.post('/:schoolId', async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { classIds } = req.body;

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

  // TODO: Send errors feedback to client (C1)
  // if (errors) {
  //   await service.postFeedback(errors);
  // }

  // Transform classes to proto objects and send to generic API
  if (onboardClasses) {
    await backendService.onboardClasses(onboardClasses);
  }
  res.status(204).json();
});

export default router;
