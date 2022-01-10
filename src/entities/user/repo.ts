import { PrismaClient } from '@prisma/client';
import { log } from '../../utils';
import { ValidatedUser } from './validated';

const prisma = new PrismaClient();

export class UserRepo {
  public static async insertOne(user: ValidatedUser): Promise<void> {
    try {
      await prisma.user.create({
        data: await user.mapToDatabaseInput(),
      });
    } catch (error) {
      log.error('Failed to insert class into database', {
        error,
        id: user.clientUuid,
      });
    }
  }
}
