
export interface UsersToOrganizationSchema {
    ExternalOrganizationUUID: string;
    ExternalUserUUIDs: string[];
    RoleIdentifiers: string[];
}

export interface UsersToClassSchema {
    ExternalClassUUID: string;
    ExternalTeacherUUIDs: string[];
    ExternalStudentUUIDs: string[];
}