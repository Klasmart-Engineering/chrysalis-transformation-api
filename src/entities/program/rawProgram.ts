import { Prisma } from '@prisma/client';
import { ClientUuid, Uuid } from '../../utils';

export class RawProgram {
  constructor(
    public readonly name: string,
    public readonly kidsloopUuid: Uuid,
    public readonly isKidsLoopProgram: boolean = false,
    public readonly organisationClientId?: ClientUuid
  ) {
    if (!isKidsLoopProgram && !organisationClientId)
      throw new Error(
        'Invalid Data. If the program is not a default KidsLoop Program, a client Organization ID must be provided'
      );
  }

  public async mapToDatabaseInput(): Promise<Prisma.ProgramCreateInput> {
    const program: Prisma.ProgramCreateInput = {
      klUuid: this.kidsloopUuid,
      name: this.name,
    };
    if (!this.isKidsLoopProgram) {
      program.organization = {
        connect: { clientUuid: this.organisationClientId },
      };
    }
    return program;
  }
}
