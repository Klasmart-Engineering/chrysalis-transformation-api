import express from 'express';
import OrganizationRoutes from './organizationRoutes';
import SchoolRoutes from './schoolRoutes';
import ClassRoutes from './classRoutes';
import UserRoutes from './userRoutes';

const router = express.Router();

router.use('/organizations', OrganizationRoutes);
router.use('/schools', SchoolRoutes);
router.use('/classes', ClassRoutes);
router.use('/users', UserRoutes);

export default router;
