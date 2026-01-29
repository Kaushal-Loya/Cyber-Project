/**
 * Authentication Service
 * Implements Single-Factor and Multi-Factor Authentication
 * with secure password hashing using PBKDF2 with salt
 */

export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    salt: string;
    role: string;
    otpSecret?: string;
    createdAt: string;
    lastLogin?: string;
}

export interface AuthSession {
    userId: string;
    username: string;
    email: string;
    role: string;
    isAuthenticated: boolean;
    mfaVerified: boolean;
    sessionId: string;
    createdAt: string;
    expiresAt: string;
}

export class AuthenticationService {
    private static readonly PBKDF2_ITERATIONS = 100000;
    private static readonly HASH_LENGTH = 256;
    private static readonly SALT_LENGTH = 16;

    /**
     * 1. PASSWORD HASHING WITH SALT (PBKDF2)
     * Generates a cryptographically secure salt and hashes the password
     */
    static async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
        // Generate salt if not provided
        const saltBytes = salt
            ? new Uint8Array(this.base64ToArrayBuffer(salt))
            : window.crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));

        // Encode password
        const encoder = new TextEncoder();
        const passwordBytes = encoder.encode(password);

        // Import password as key material
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            passwordBytes,
            'PBKDF2',
            false,
            ['deriveBits']
        );

        // Derive bits using PBKDF2
        const hashBuffer = await window.crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: saltBytes,
                iterations: this.PBKDF2_ITERATIONS,
                hash: 'SHA-256'
            },
            keyMaterial,
            this.HASH_LENGTH
        );

        return {
            hash: this.arrayBufferToBase64(hashBuffer),
            salt: this.arrayBufferToBase64(saltBytes.buffer)
        };
    }

    /**
     * Verify password against stored hash
     */
    static async verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
        const { hash } = await this.hashPassword(password, salt);
        return hash === storedHash;
    }

    /**
     * 2. SINGLE-FACTOR AUTHENTICATION
     * Username/Password based authentication
     */
    static async authenticateSingleFactor(username: string, password: string): Promise<{
        success: boolean;
        user?: User;
        error?: string;
    }> {
        // Get user from storage
        const user = this.getUserByUsername(username);

        if (!user) {
            return { success: false, error: 'Invalid username or password' };
        }

        // Verify password
        const isValid = await this.verifyPassword(password, user.passwordHash, user.salt);

        if (!isValid) {
            return { success: false, error: 'Invalid username or password' };
        }

        return { success: true, user };
    }

    /**
     * 3. MULTI-FACTOR AUTHENTICATION - Generate OTP
     * Generates a Time-based One-Time Password (TOTP)
     */
    static generateOTP(secret?: string): string {
        // For demo purposes, generate a random 6-digit OTP
        // In production, use a TOTP library like otplib
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * 4. MULTI-FACTOR AUTHENTICATION - Verify OTP
     */
    static async verifyOTP(userId: string, otp: string): Promise<boolean> {
        // In demo mode, accept any 6-digit number
        // In production, verify against stored OTP or TOTP secret
        const storedOTP = sessionStorage.getItem(`otp_${userId}`);

        if (!storedOTP) {
            return false;
        }

        // Simple time-based verification (5 minutes expiry)
        const otpData = JSON.parse(storedOTP);
        const now = Date.now();
        const otpAge = now - otpData.timestamp;

        if (otpAge > 5 * 60 * 1000) {
            sessionStorage.removeItem(`otp_${userId}`);
            return false;
        }

        return otpData.code === otp;
    }

    /**
     * Send OTP (simulate sending via email/SMS)
     */
    static async sendOTP(userId: string, email: string): Promise<string> {
        const otp = this.generateOTP();

        // Store OTP with timestamp
        sessionStorage.setItem(`otp_${userId}`, JSON.stringify({
            code: otp,
            timestamp: Date.now(),
            email
        }));

        console.log(`[OTP SENT] To: ${email}, Code: ${otp}`);
        return otp;
    }

    /**
     * 5. USER REGISTRATION
     * Creates a new user with hashed password
     */
    static async registerUser(
        username: string,
        email: string,
        password: string,
        role: string = 'student'
    ): Promise<{ success: boolean; user?: User; error?: string }> {
        // Check if user already exists
        const existingUser = this.getUserByUsername(username);
        if (existingUser) {
            return { success: false, error: 'Username already exists' };
        }

        const existingEmail = this.getUserByEmail(email);
        if (existingEmail) {
            return { success: false, error: 'Email already registered' };
        }

        // Hash password with salt
        const { hash, salt } = await this.hashPassword(password);

        // Create user object
        const user: User = {
            id: this.generateUserId(),
            username,
            email,
            passwordHash: hash,
            salt,
            role,
            otpSecret: this.generateOTP(),
            createdAt: new Date().toISOString()
        };

        // Store user
        this.storeUser(user);

        return { success: true, user };
    }

    /**
     * 6. SESSION MANAGEMENT
     * Create authentication session
     */
    static createSession(user: User, mfaVerified: boolean = false): AuthSession {
        const session: AuthSession = {
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isAuthenticated: true,
            mfaVerified,
            sessionId: this.generateSessionId(),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };

        // Store session
        sessionStorage.setItem('auth_session', JSON.stringify(session));

        return session;
    }

    /**
     * Get current session
     */
    static getSession(): AuthSession | null {
        const sessionStr = sessionStorage.getItem('auth_session');
        if (!sessionStr) return null;

        const session: AuthSession = JSON.parse(sessionStr);

        // Check if session expired
        if (new Date(session.expiresAt) < new Date()) {
            this.destroySession();
            return null;
        }

        return session;
    }

    /**
     * Destroy session (logout)
     */
    static destroySession(): void {
        sessionStorage.removeItem('auth_session');
        sessionStorage.clear(); // Clear all OTPs and temp data
    }

    /**
     * Update last login time
     */
    static updateLastLogin(userId: string): void {
        const user = this.getUserById(userId);
        if (user) {
            user.lastLogin = new Date().toISOString();
            this.storeUser(user);
        }
    }

    // ============ STORAGE HELPERS ============

    private static storeUser(user: User): void {
        const users = this.getAllUsers();
        const index = users.findIndex(u => u.id === user.id);

        if (index >= 0) {
            users[index] = user;
        } else {
            users.push(user);
        }

        localStorage.setItem('users_db', JSON.stringify(users));
    }

    private static getAllUsers(): User[] {
        const usersStr = localStorage.getItem('users_db');
        return usersStr ? JSON.parse(usersStr) : [];
    }

    private static getUserById(id: string): User | null {
        const users = this.getAllUsers();
        return users.find(u => u.id === id) || null;
    }

    private static getUserByUsername(username: string): User | null {
        const users = this.getAllUsers();
        return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    }

    private static getUserByEmail(email: string): User | null {
        const users = this.getAllUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }

    // ============ UTILITY FUNCTIONS ============

    private static generateUserId(): string {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    private static generateSessionId(): string {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    private static arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    private static base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Initialize demo users for testing
     */
    static initializeDemoUsers(): void {
        const users = this.getAllUsers();
        if (users.length > 0) return; // Already initialized

        // Create demo users asynchronously
        const demoUsers = [
            { username: 'student1', email: 'student1@example.com', password: 'student123', role: 'student' },
            { username: 'reviewer1', email: 'reviewer1@example.com', password: 'reviewer123', role: 'reviewer' },
            { username: 'admin1', email: 'admin1@example.com', password: 'admin123', role: 'admin' },
        ];

        Promise.all(
            demoUsers.map(({ username, email, password, role }) =>
                this.registerUser(username, email, password, role)
            )
        ).then(() => {
            console.log('[Auth] Demo users initialized');
        });
    }
}
