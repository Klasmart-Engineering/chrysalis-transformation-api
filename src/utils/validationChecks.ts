import { PROGRAM_NOT_EXIST } from '../config/errorMessages';
import { school as schoolSchema } from '../validatorsSchemes'
import logger from "./logging";
import { PrismaClient } from '@prisma/client';
import { MappedSchool } from "./mapResKeys";

const prisma = new PrismaClient();

export const isSchoolValid = (school: MappedSchool) => {
    try {
        const { error, value } = schoolSchema.validate(school);

        error && logger.error(JSON.stringify({
            school: value,
            messages: error.details.map((detail: {message: string}) => detail.message)
        }));

        return !error;
    } catch (error) {
        logger.error(error);
        return false;
    }
}

export const isSchoolProgramValid = async (programName: string, organizationUuid: string) => {
    try {
        const programs = await prisma.program.count({
            where: { 
                name: programName,
                clientOrgUuid: organizationUuid
            }
        })
        const isValid = (programs > 0);

        !isValid && logger.error(JSON.stringify({
            program: programName,
            organization: organizationUuid,
            messages: PROGRAM_NOT_EXIST
        }));

        return isValid;
    } catch (error) {
        logger.error(error);
        return false;
    }
}