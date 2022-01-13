
export type GetClassesResponse = {
	classesConnection: {
		totalCount: number;
	}
}

export type CreateClassesRequest = {
	name: string;
	shortcode: string;
	organizationId: string;
}

export type CreateClassesResponse = {
	createClasses: {
		classes: [
			{
				id: string;
				name: string;
				status: string;
				shortCode: string;
			}
		]
	}
}

export type AddClassesToSchoolRequest = {
	schoolId: string;
	classIds: string[];
}

export type AddClassesToSchoolResponse = {
	addClassesToSchools: {
		schools: [
			{
				id: string;
				name: string;
				status: string;
				classesConnection: {
					edges: {
						node: {
							id: string
							name: string
						}
					}[]
				}
			}
		]
	}
}