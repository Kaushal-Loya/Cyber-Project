import React, { createContext, useContext, useState, useEffect } from "react";
import { CryptoService } from "@/services/CryptoService";
import ApiService from "@/services/ApiService";
import { UserRole } from "@/services/AccessControlService";

interface SecurityContextType {
    user: any | null;
    role: UserRole | null;
    encryptionKeys: CryptoKeyPair | null; // My keys
    signingKeys: CryptoKeyPair | null; // My keys
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, role: UserRole) => Promise<void>;
    mockLogin: (email: string, role: UserRole, username?: string) => Promise<void>;
    logout: () => Promise<void>;
    generateAndStoreKeys: () => Promise<void>;
    getPublicKey: (userId: string, type: "sign" | "encrypt") => Promise<CryptoKey | null>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [encryptionKeys, setEncryptionKeys] = useState<CryptoKeyPair | null>(null);
    const [signingKeys, setSigningKeys] = useState<CryptoKeyPair | null>(null);

    const [isLoading, setIsLoading] = useState(true);

    // Load user from local session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                // Authenticate from local persistence
                const storedUser = localStorage.getItem('user') || localStorage.getItem('demo_user');
                const storedRole = localStorage.getItem('role') || localStorage.getItem('demo_role');

                if (storedUser && storedRole) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    setRole(storedRole as UserRole);
                    await loadKeys(parsedUser.id || parsedUser._id);
                }
            } catch (error) {
                console.error("Session check failed", error);
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const loadKeys = async (userId: string) => {
        // Try to load keys from LocalStorage (Simulate "Secure Key Store")
        const encPriv = localStorage.getItem(`enc_priv_${userId}`);
        const encPub = localStorage.getItem(`enc_pub_${userId}`);
        const signPriv = localStorage.getItem(`sign_priv_${userId}`);
        const signPub = localStorage.getItem(`sign_pub_${userId}`);

        if (encPriv && encPub && signPriv && signPub) {
            const encKeyPair = {
                privateKey: await CryptoService.importPrivateKey(encPriv, "decrypt"),
                publicKey: await CryptoService.importPublicKey(encPub, "encrypt")
            };
            const signKeyPair = {
                privateKey: await CryptoService.importPrivateKey(signPriv, "sign"),
                publicKey: await CryptoService.importPublicKey(signPub, "verify")
            };
            setEncryptionKeys(encKeyPair);
            setSigningKeys(signKeyPair);

            // Sync public keys to MongoDB (in case they were only local before)
            // This is idempotent and ensures the backend has the keys
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    await ApiService.updatePublicKeys(encPub, signPub);
                } catch (e) {
                    console.warn("Failed to sync keys to backend, might be already updated or unauthorized:", e);
                }
            }
        } else {
            // Generate new keys (Simulate Registration)
            await generateAndStoreKeys(userId);
        }
    };

    const generateAndStoreKeys = async (userId: string = user?.id) => {
        if (!userId) return;

        const encKeys = await CryptoService.generateEncryptionKeyPair();
        const signKeys = await CryptoService.generateKeyPair();

        setEncryptionKeys(encKeys);
        setSigningKeys(signKeys);

        // Store in LocalStorage (private keys stay local!)
        const encPriv = await CryptoService.exportPrivateKey(encKeys.privateKey);
        const encPub = await CryptoService.exportPublicKey(encKeys.publicKey);
        const signPriv = await CryptoService.exportPrivateKey(signKeys.privateKey);
        const signPub = await CryptoService.exportPublicKey(signKeys.publicKey);

        localStorage.setItem(`enc_priv_${userId}`, encPriv);
        localStorage.setItem(`enc_pub_${userId}`, encPub);
        localStorage.setItem(`sign_priv_${userId}`, signPriv);
        localStorage.setItem(`sign_pub_${userId}`, signPub);

        // Store public keys in MongoDB for other users to access
        try {
            await ApiService.updatePublicKeys(encPub, signPub);
            console.log('✅ Public keys uploaded to MongoDB');
        } catch (error) {
            console.error('Failed to upload public keys to backend:', error);
        }

        const dir = JSON.parse(localStorage.getItem('public_key_directory') || '{}');
        dir[userId] = { encPub, signPub, email: userId.includes('@') ? userId : undefined }; // simple email check
        localStorage.setItem('public_key_directory', JSON.stringify(dir));
    };

    const login = async (email: string, role: UserRole) => {
        if (user) {
            localStorage.setItem(`role_${user.id}`, role);
            setRole(role);
            await loadKeys(user.id);
        }
    };

    const mockLogin = async (email: string, role: UserRole, username?: string) => {
        const mockUser = {
            id: email, // Use email as ID for demo
            email: email,
            username: username || email.split('@')[0],
            aud: 'authenticated',
            created_at: new Date().toISOString(),
        };
        await new Promise(r => setTimeout(r, 100));
        setUser(mockUser);
        setRole(role);

        // PERSIST Demo User
        localStorage.setItem('demo_user', JSON.stringify(mockUser));
        localStorage.setItem('demo_role', role);
        localStorage.setItem(`role_${mockUser.id}`, role); // Keep existing pattern too

        await loadKeys(mockUser.id);

        // Update public directory with this email so others can find me
        const dir = JSON.parse(localStorage.getItem('public_key_directory') || '{}');
        if (!dir[mockUser.id]) {
            await generateAndStoreKeys(mockUser.id);
        }
    };

    const logout = async () => {
        if (user) localStorage.removeItem(`role_${user.id}`);
        // Clear demo persistence
        localStorage.removeItem('demo_user');
        localStorage.removeItem('demo_role');
        localStorage.removeItem('token');

        setUser(null);
        setRole(null);
        setEncryptionKeys(null);
        setSigningKeys(null);
    };

    const getPublicKey = async (userId: string, type: "sign" | "encrypt") => {
        const dir = JSON.parse(localStorage.getItem('public_key_directory') || '{}');
        const userData = dir[userId];
        if (!userData) return null;

        if (type === "encrypt") {
            return await CryptoService.importPublicKey(userData.encPub, "encrypt");
        } else {
            return await CryptoService.importPublicKey(userData.signPub, "verify");
        }
    };

    return (
        <SecurityContext.Provider value={{
            user, role, encryptionKeys, signingKeys, isAuthenticated: !!user, isLoading, login, mockLogin, logout, generateAndStoreKeys, getPublicKey
        }}>
            {children}
        </SecurityContext.Provider>
    );
};

export const useSecurity = () => {
    const context = useContext(SecurityContext);
    if (context === undefined) {
        throw new Error("useSecurity must be used within a SecurityProvider");
    }
    return context;
};
