/**
 * API Service for communicating with MongoDB backend
 * Handles all HTTP requests to the Express server
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
    /**
     * Register a new user
     */
    static async register(username: string, email: string, password: string, role: string) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password, role }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            return data;
        } catch (error) {
            console.error('Registration API error:', error);
            throw error;
        }
    }

    /**
     * Login Step 1: Verify credentials and send OTP
     */
    static async login(username: string, password: string) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            return data;
        } catch (error) {
            console.error('Login API error:', error);
            throw error;
        }
    }

    /**
     * Login Step 2: Verify OTP
     */
    static async verifyOTP(email: string, otp: string) {
        try {
            const response = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'OTP verification failed');
            }

            return data;
        } catch (error) {
            console.error('OTP verification API error:', error);
            throw error;
        }
    }

    /**
     * Verify JWT token
     */
    static async verifyToken(token: string) {
        try {
            const response = await fetch(`${API_URL}/auth/verify-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Token verification failed');
            }

            return data;
        } catch (error) {
            console.error('Token verification API error:', error);
            throw error;
        }
    }

    /**
     * Logout
     */
    static async logout(token: string) {
        try {
            const response = await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Logout API error:', error);
            // Don't throw, just log
            return { success: false };
        }
    }

    /**
     * Check API health
     */
    static async healthCheck() {
        try {
            const response = await fetch(`${API_URL.replace('/api', '')}/api/health`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'ERROR', message: 'API server not reachable' };
        }
    }
}

export default ApiService;
