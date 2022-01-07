import { PrismaClient, Role } from "@prisma/client";

import log from '../utils/logging';

const prisma = new PrismaClient();

export class Roles {
    private static _instance: Roles;

    private constructor(private data: Map<string, Role>) {}

    public static async initialize(): Promise<Roles> {
        if (this._instance) return this._instance;
        try {
            const roles = await prisma.role.findMany();
            const data = new Map();
            for (const role of roles) {
                data.set(role.name, role);
            }
            this._instance = new Roles(data);
            return this._instance;
        } catch (error) {
            log.error('Failed to fetch roles from database', { error });
            throw new Error('Failed to initialize roles')
        }
    }

    public isValid(name: string): boolean {
        return this.data.has(name);
    }

    public idForRole(name: string): string {
        const role = this.data.get(name);
        if (!role)
            throw new Error('Invalid role name');
        return role.klUuid
    }
}