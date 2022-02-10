import express, { Request, Response } from 'express';
import { schoolSchema } from '../../validations/c1';
import { HttpError } from '../../utils';
import logger from '../../utils/logging';
import {
  SchoolQuerySchema,
  ClassQuerySchema
} from '../../interfaces/clientSchemas';
import { onboardClassesSchema } from '../../validations/requests/onboardClasses';
import { C1Service } from '../../services/c1Service';
import { Cache } from '../../utils/cache';
import { BackendService } from '../../services/backendService';

const router = express.Router();
const service = new C1Service();
const cache = Cache.getInstance();
const backendService = BackendService.getInstance();

router.post('/:schoolId',
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
