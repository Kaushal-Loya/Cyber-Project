
export enum UserRole {
    STUDENT = 'student',
    REVIEWER = 'reviewer',
    ADMIN = 'admin',
}

export enum ResourceType {
    PROJECT_FILE = 'project_file',
    EVALUATION_REPORT = 'evaluation_report',
    FINAL_RESULT = 'final_result',
}

export enum Action {
    CREATE = 'create',
    READ = 'read',
    UPDATE = 'update',
    DELETE = 'delete',
    SIGN = 'sign',
    VERIFY = 'verify',
}

type AccessControlMatrix = {
    [key in UserRole]: {
        [resource in ResourceType]?: Action[];
    };
};

export const RBAC_MATRIX: AccessControlMatrix = {
    [UserRole.STUDENT]: {
        [ResourceType.PROJECT_FILE]: [Action.CREATE, Action.READ], // Own files only (enforced by logic)
        [ResourceType.FINAL_RESULT]: [Action.READ],
    },
    [UserRole.REVIEWER]: {
        [ResourceType.PROJECT_FILE]: [Action.READ],
        [ResourceType.EVALUATION_REPORT]: [Action.CREATE, Action.READ, Action.SIGN],
    },
    [UserRole.ADMIN]: {
        [ResourceType.PROJECT_FILE]: [Action.READ, Action.DELETE],
        [ResourceType.EVALUATION_REPORT]: [Action.READ, Action.VERIFY],
        [ResourceType.FINAL_RESULT]: [Action.CREATE, Action.UPDATE, Action.READ, Action.DELETE],
    },
};

export class AccessControlService {
    static hasPermission(role: UserRole, resource: ResourceType, action: Action): boolean {
        const permissions = RBAC_MATRIX[role]?.[resource];
        return permissions?.includes(action) || false;
    }
}
