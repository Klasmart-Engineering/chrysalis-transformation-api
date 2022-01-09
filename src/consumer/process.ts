import { OrganizationRepo, OrganizationToBeValidated } from '../entities';

export async function process(): Promise<void> {
  const toValidate = await OrganizationToBeValidated.fetch('1234');
  const validated = await toValidate.validate();
  await OrganizationRepo.insertOne(validated);
}
