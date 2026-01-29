/**
 * Access Control Middleware for Express
 * Enforces RBAC policies at the API layer
 */

const jwt = require('jsonwebtoken');

/**
 * User Roles
 */
const UserRole = {
    STUDENT: 'student',
    REVIEWER: 'reviewer',
    ADMIN: 'admin',
};

/**
 * Resource Types
 */
const ResourceType = {
    PROJECT_FILE: 'project_file',
    EVALUATION_REPORT: 'evaluation_report',
    FINAL_RESULT: 'final_result',
};

/**
 * Actions
 */
const Action = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    SIGN: 'sign',
    VERIFY: 'verify',
};

/**
 * RBAC Matrix - Must match frontend AccessControlService
 */
const RBAC_MATRIX = {
    [UserRole.STUDENT]: {
        [ResourceType.PROJECT_FILE]: [Action.CREATE, Action.READ],
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

/**
 * Check if role has permission for action on resource
 */
function hasPermission(role, resource, action) {
    const permissions = RBAC_MATRIX[role]?.[resource];
    return permissions?.includes(action) || false;
}

/**
 * Middleware: Authenticate and attach user to request
 */
function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'No valid authentication token provided'
            });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key-change-in-production'
        );

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid authentication token',
            message: error.message
        });
    }
}

/**
 * Middleware: Require specific role(s)
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            // Log unauthorized access attempt
            console.warn('🚫 Unauthorized access attempt:', {
                user: req.user.email,
                role: req.user.role,
                requiredRoles: allowedRoles,
                path: req.path,
            });

            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: `Access denied. Required roles: ${allowedRoles.join(' or ')}`
            });
        }

        next();
    };
}

/**
 * Middleware: Check RBAC permission
 */
function checkPermission(resource, action) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!hasPermission(req.user.role, resource, action)) {
            // Log access denial
            const auditLog = {
                timestamp: new Date().toISOString(),
                userId: req.user.userId,
                email: req.user.email,
                role: req.user.role,
                resource,
                action,
                allowed: false,
                path: req.path,
                method: req.method,
            };

            console.warn('🚫 Access Denied:', JSON.stringify(auditLog));

            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: `Role ${req.user.role} does not have ${action} permission on ${resource}`
            });
        }

        // Log successful authorization (for audit)
        console.log('✅ Access Granted:', {
            user: req.user.email,
            role: req.user.role,
            resource,
            action,
        });

        next();
    };
}

/**
 * Middleware: Check resource ownership (for students)
 */
function checkOwnership(resourceOwnerIdGetter) {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Admins bypass ownership checks
        if (req.user.role === UserRole.ADMIN) {
            return next();
        }

        // Get resourceOwnerId from request (could be in params, body, or DB query)
        const resourceOwnerId = typeof resourceOwnerIdGetter === 'function'
            ? await resourceOwnerIdGetter(req)
            : req.params[resourceOwnerIdGetter] || req.body[resourceOwnerIdGetter];

        if (resourceOwnerId && resourceOwnerId !== req.user.userId.toString()) {
            console.warn('🚫 Ownership check failed:', {
                user: req.user.userId,
                resourceOwner: resourceOwnerId,
                path: req.path,
            });

            // Return 404 to prevent information disclosure
            return res.status(404).json({
                success: false,
                error: 'Resource not found'
            });
        }

        next();
    };
}

module.exports = {
    UserRole,
    ResourceType,
    Action,
    RBAC_MATRIX,
    hasPermission,
    authenticate,
    requireRole,
    checkPermission,
    checkOwnership,
};
