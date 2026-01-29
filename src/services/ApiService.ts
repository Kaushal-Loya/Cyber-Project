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
    static async login(username: string, password: string, mfaToken: string | null = null) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, mfaToken }),
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
    static async verifyOTP(email: string, otp: string, rememberMe: boolean = false) {
        try {
            const response = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp, rememberMe }),
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

    /**
     * Update user's public keys
     */
    static async updatePublicKeys(encPub: string, signPub: string) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_URL}/auth/update-keys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, encPub, signPub }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update keys');
            }

            return data;
        } catch (error) {
            console.error('Update keys API error:', error);
            throw error;
        }
    }

    /**
     * Get reviewer public keys
     */
    static async getReviewerKeys() {
        try {
            const response = await fetch(`${API_URL}/auth/reviewer-keys`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch reviewer keys');
            }

            return data;
        } catch (error) {
            console.error('Get reviewer keys API error:', error);
            throw error;
        }
    }

    // ============ PROJECT MANAGEMENT ============

    /**
     * Submit encrypted project (Student)
     */
    static async submitProject(projectData: {
        title: string;
        encryptedData: string;
        encryptedKey: string;
        iv: string;
        fileHash: string;
        reviewerId?: string;
        originalName?: string;
    }) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_URL}/projects/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(projectData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Project submission failed');
            }

            return data;
        } catch (error) {
            console.error('Submit project API error:', error);
            throw error;
        }
    }

    /**
     * Get my projects (Student)
     */
    static async getMyProjects() {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            // Add cache buster to ensure fresh data
            const response = await fetch(`${API_URL}/projects/my-projects?t=${Date.now()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch projects');
            }

            return data;
        } catch (error) {
            console.error('Get my projects API error:', error);
            throw error;
        }
    }

    /**
     * Get assigned projects (Reviewer)
     */
    static async getAssignedProjects() {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_URL}/projects/assigned`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch projects');
            }

            return data;
        } catch (error) {
            console.error('Get assigned projects API error:', error);
            throw error;
        }
    }

    /**
     * Get all projects (Admin)
     */
    static async getAllProjects() {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_URL}/projects/all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch projects');
            }

            return data;
        } catch (error) {
            console.error('Get all projects API error:', error);
            throw error;
        }
    }

    /**
     * Delete project (Admin)
     */
    static async deleteProject(projectId: string) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_URL}/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete project');
            }

            return data;
        } catch (error) {
            console.error('Delete project API error:', error);
            throw error;
        }
    }

    /**
     * Submit evaluation (Reviewer)
     */
    static async submitEvaluation(evaluationData: {
        submissionId: string;
        score: number;
        grading: string;
        feedback: string;
        signature: string;
    }) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_URL}/projects/evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(evaluationData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Evaluation submission failed');
            }

            return data;
        } catch (error) {
            console.error('Submit evaluation API error:', error);
            throw error;
        }
    }

    /**
     * Get all users (Admin)
     */
    static async getAllUsers() {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_URL}/auth/users`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch users');
            return data;
        } catch (error) {
            console.error('Get users API error:', error);
            throw error;
        }
    }

    /**
     * Get pending evaluations (Admin)
     */
    static async getPendingEvaluations() {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_URL}/projects/pending-evaluations`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch pending evaluations');
            return data;
        } catch (error) {
            console.error('Get pending evaluations API error:', error);
            throw error;
        }
    }

    /**
     * Verify and Publish (Admin)
     */
    static async verifyAndPublish(projectId: string) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${API_URL}/projects/verify-publish`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ projectId }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Verification/Publish failed');
            return data;
        } catch (error) {
            console.error('Verify and publish API error:', error);
            throw error;
        }
    }
}

export default ApiService;
