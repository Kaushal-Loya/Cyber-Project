import { ReactNode, useEffect } from "react";
import { UserRole } from "@/services/AccessControlService";
import { useSecurity } from "@/context/SecurityContext";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, role, isLoading } = useSecurity();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // When user successfully accesses a protected route while authenticated,
        // clear any logout flags
        if (isAuthenticated) {
            sessionStorage.removeItem('loggedOutFromLanding');
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // If user is not authenticated but there's a logout flag,
        // it means they logged out from landing page and are trying to navigate forward
        const wasLoggedOut = sessionStorage.getItem('loggedOutFromLanding');
        
        if (!isAuthenticated && wasLoggedOut === 'true') {
            // Clear the flag and redirect to login
            sessionStorage.removeItem('loggedOutFromLanding');
            navigate('/login', { replace: true });
        }
    }, [isAuthenticated, navigate, location.pathname]);

    if (isLoading) {
        // Return a simple loading spinner or blank screen while verifying session
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
        // User is authorized but doesn't have the correct role
        // Redirect to their appropriate dashboard or home
        if (role === UserRole.ADMIN) return <Navigate to="/dashboard/admin" replace />;
        if (role === UserRole.REVIEWER) return <Navigate to="/dashboard/reviewer" replace />;
        if (role === UserRole.STUDENT) return <Navigate to="/dashboard/student" replace />;

        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};