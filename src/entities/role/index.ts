import { Prisma } from '@prisma/client';
import { ClientUuid, Uuid } from '../../utils';

export { Roles } from './roles';
export { RoleRepo } from './repo';

export type RoleName = string;

export class Role {
  constructor(
    public readonly name: string,
    public readonly kidsloopUuid: Uuid,
    public readonly isKidsLoopRole: boolean = false,
    public readonly organisationClientId?: ClientUuid
  ) {
    if (!isKidsLoopRole && !organisationClientId)
      throw new Error(
        'Invalid Data. If the role is not a default KidsLoop role, a client Organization ID must be provided'
      );
  }

  public async mapToDatabaseInput(): Promise<Prisma.RoleCreateInput> {
    const role: Prisma.RoleCreateInput = {
      klUuid: this.kidsloopUuid,
      name: this.name,
    };
    if (!this.isKidsLoopRole) {
      role.organization = {
        connect: { clientUuid: this.organisationClientId },
      };
    }
    return role;
  }
}
