export class MappedSchool {
  name: string;
  clientUuid: string;
  klOrgUuid: string;
  programName: string[];
  organizationName: string;

  constructor(name: string,
              schoolUuid: string,
              programName: string[],
              organizationName: string,
              orgUuid: string) {
    this.name = name;
    this.clientUuid = schoolUuid;
    this.programName = programName;
    this.organizationName = organizationName;
    this.klOrgUuid = orgUuid;
  }
}
