import { PrismaClient } from '@prisma/client';
import { Entity } from '..';
import { Category, logError } from '../../utils';
import { ValidatedUser } from './validated';

const prisma = new PrismaClient();

export class UserRepo {
  public static async insertOne(user: ValidatedUser): Promise<void> {
    try {
      await prisma.user.create({
        data: await user.mapToDatabaseInput(),
      });
    } catch (error) {
      throw logError(error, Entity.USER, user.clientUuid, Category.POSTGRES, {
        msg: 'Failed to create user in database',
      });
    }
  }
}
