/**
 * Access Control Service - Role-Based Access Control (RBAC)
 * Implements security policies as defined in RBAC_POLICY.md
 * 
 * Security Principles:
 * - Principle of Least Privilege
 * - Separation of Duties
 * - Need-to-Know Basis
 */

export enum UserRole {
    STUDENT = 'student',
    REVIEWER = 'reviewer',
    ADMIN = 'admin',
}

export enum ResourceType {
    ACADEMIC_ARTIFACTS = 'academic_artifacts',
    ASSESSMENT_METRICS = 'assessment_metrics',
    INSTITUTIONAL_RECORDS = 'institutional_records',
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

/**
 * RBAC Matrix - Defines which actions each role can perform on each resource
 * See RBAC_POLICY.md for detailed justifications
 */
export const RBAC_MATRIX: AccessControlMatrix = {
    [UserRole.STUDENT]: {
        // Students can create and read their OWN academic artifacts only
        [ResourceType.ACADEMIC_ARTIFACTS]: [Action.CREATE, Action.READ],
        // Students can read their OWN institutional records only
        [ResourceType.INSTITUTIONAL_RECORDS]: [Action.READ],
        // Students have NO access to raw assessment metrics
    },
    [UserRole.REVIEWER]: {
        // Reviewers can read ASSIGNED academic artifacts only
        [ResourceType.ACADEMIC_ARTIFACTS]: [Action.READ],
        // Reviewers can create, read, and sign their OWN assessment metrics
        [ResourceType.ASSESSMENT_METRICS]: [Action.CREATE, Action.READ, Action.SIGN],
        // Reviewers have NO access to institutional records (separation of duties)
    },
    [UserRole.ADMIN]: {
        // Admins can read and delete any academic artifact (oversight)
        [ResourceType.ACADEMIC_ARTIFACTS]: [Action.READ, Action.DELETE],
        // Admins can read and verify assessment metrics (audit)
        [ResourceType.ASSESSMENT_METRICS]: [Action.READ, Action.VERIFY],
        // Admins have full control over institutional records
        [ResourceType.INSTITUTIONAL_RECORDS]: [Action.CREATE, Action.UPDATE, Action.READ, Action.DELETE],
    },
};

/**
 * Policy descriptions for each role-resource combination
 */
export const POLICY_DESCRIPTIONS = {
    [UserRole.STUDENT]: {
        [ResourceType.ACADEMIC_ARTIFACTS]: 'Students can create and view their own academic artifacts. No modification or deletion allowed to maintain academic integrity.',
        [ResourceType.INSTITUTIONAL_RECORDS]: 'Students can view their own published institutional records and evaluation outcomes.',
        [ResourceType.ASSESSMENT_METRICS]: 'No access - students do not see raw assessment metrics.',
    },
    [UserRole.REVIEWER]: {
        [ResourceType.ACADEMIC_ARTIFACTS]: 'Read-only access to assigned academic artifacts for evaluation purposes.',
        [ResourceType.ASSESSMENT_METRICS]: 'Can create, read, and digitally sign local assessment metrics. Once signed, metrics are immutable.',
        [ResourceType.INSTITUTIONAL_RECORDS]: 'No access - maintains separation between evaluation and final record publishing.',
    },
    [UserRole.ADMIN]: {
        [ResourceType.ACADEMIC_ARTIFACTS]: 'Full oversight with read and delete permissions for academic artifact moderation.',
        [ResourceType.ASSESSMENT_METRICS]: 'Can read and verify digital signatures for assessment metrics. Cannot create or modify.',
        [ResourceType.INSTITUTIONAL_RECORDS]: 'Complete control for institutional record management, appeals processing, and system administration.',
    },
};

export interface AccessContext {
    userId: string;
    role: UserRole;
    resourceOwnerId?: string;  // For ownership checks
    assignedReviewerId?: string;  // For assignment checks
}

export interface AccessDecision {
    allowed: boolean;
    reason?: string;
    policy?: string;
}

export class AccessControlService {
    /**
     * Basic permission check - verifies if role has action permission on resource type
     */
    static hasPermission(role: UserRole, resource: ResourceType, action: Action): boolean {
        const permissions = RBAC_MATRIX[role]?.[resource];
        return permissions?.includes(action) || false;
    }

    /**
     * Comprehensive access control check with ownership and assignment validation
     * 
     * @param context - User context including role, userId, and resource metadata
     * @param resource - Resource type being accessed
     * @param action - Action being attempted
     * @returns AccessDecision with allowed status and reason
     */
    static checkAccess(
        context: AccessContext,
        resource: ResourceType,
        action: Action
    ): AccessDecision {
        // Step 1: Check basic RBAC permission
        if (!this.hasPermission(context.role, resource, action)) {
            return {
                allowed: false,
                reason: `Role ${context.role} does not have ${action} permission on ${resource}`,
                policy: POLICY_DESCRIPTIONS[context.role]?.[resource] || 'No access defined',
            };
        }

        // Step 2: Ownership checks for STUDENT role
        if (context.role === UserRole.STUDENT) {
            if (resource === ResourceType.ACADEMIC_ARTIFACTS || resource === ResourceType.INSTITUTIONAL_RECORDS) {
                if (context.resourceOwnerId && context.resourceOwnerId !== context.userId) {
                    return {
                        allowed: false,
                        reason: 'Students can only access their own artifacts and records',
                        policy: 'Ownership enforcement - prevents viewing other students\' work',
                    };
                }
            }
        }

        // Step 3: Assignment checks for REVIEWER role
        if (context.role === UserRole.REVIEWER) {
            if (resource === ResourceType.ACADEMIC_ARTIFACTS && action === Action.READ) {
                if (context.assignedReviewerId && context.assignedReviewerId !== context.userId) {
                    return {
                        allowed: false,
                        reason: 'Reviewers can only access assigned academic artifacts',
                        policy: 'Assignment-based access control',
                    };
                }
            }
        }

        // Step 4: All checks passed
        return {
            allowed: true,
            policy: POLICY_DESCRIPTIONS[context.role]?.[resource],
        };
    }

    /**
     * Get all permissions for a role
     */
    static getRolePermissions(role: UserRole): AccessControlMatrix[UserRole] {
        return RBAC_MATRIX[role] || {};
    }

    /**
     * Get policy description for role and resource
     */
    static getPolicyDescription(role: UserRole, resource: ResourceType): string {
        return POLICY_DESCRIPTIONS[role]?.[resource] || 'No policy defined';
    }

    /**
     * Audit log helper - formats access attempt for logging
     */
    static formatAuditLog(
        context: AccessContext,
        resource: ResourceType,
        action: Action,
        decision: AccessDecision
    ): string {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            userId: context.userId,
            role: context.role,
            resource,
            action,
            allowed: decision.allowed,
            reason: decision.reason,
            resourceOwnerId: context.resourceOwnerId,
            assignedReviewerId: context.assignedReviewerId,
        });
    }
}
