import { school as schoolSchema } from "../../src/validatorsSchemes";

export const validSchool = {
  name: "name",
  clientUuid: "cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3",
  klOrgUuid: "cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3",
  programNames: ["program name", "program name2"],
  clientOrgUuid: "cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3",
  organizationName: "organization name"
};

export const invalidSchool = {
  name: "",
  clientUuid: "cdc9a77f-ac83-",
  klOrgUuid: "cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3",
  programNames: ["program name", "program name2"],
  clientOrgUuid: "cdc9a77f-ac83-45d1-a99b-c0cc27d6e1f3",
  organizationName: "organization name"
};

interface School {
  name: string;
  clientUuid: string;
  klOrgUuid: string;
  programNames: string[];
  clientOrgUuid: string;
  organizationName: string;
}

export const isSchoolValid = (school: School) => {
  try {
    const { error } = schoolSchema.validate(school);
    return !error;
  } catch (error) {
    return false;
  }
};
