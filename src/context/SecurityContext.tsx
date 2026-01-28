
import React, { createContext, useContext, useState, useEffect } from "react";
import { CryptoService } from "@/services/CryptoService";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/services/AccessControlService";

interface SecurityContextType {
    user: any | null;
    role: UserRole | null;
    encryptionKeys: CryptoKeyPair | null; // My keys
    signingKeys: CryptoKeyPair | null; // My keys
    isAuthenticated: boolean;
    login: (email: string, role: UserRole) => Promise<void>;
    mockLogin: (email: string, role: UserRole) => Promise<void>;
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

    // Load user from Supabase session on mount
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                const storedRole = localStorage.getItem(`role_${session.user.id}`) as UserRole;
                setRole(storedRole || UserRole.STUDENT);
                await loadKeys(session.user.id);
            }
        };
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setUser(session.user);
                const storedRole = localStorage.getItem(`role_${session.user.id}`) as UserRole;
                setRole(storedRole || UserRole.STUDENT);
                await loadKeys(session.user.id);
            } else {
                setUser(null);
                setRole(null);
                setEncryptionKeys(null);
                setSigningKeys(null);
            }
        });

        return () => subscription.unsubscribe();
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

        // Store in LocalStorage
        const encPriv = await CryptoService.exportPrivateKey(encKeys.privateKey);
        const encPub = await CryptoService.exportPublicKey(encKeys.publicKey);
        const signPriv = await CryptoService.exportPrivateKey(signKeys.privateKey);
        const signPub = await CryptoService.exportPublicKey(signKeys.publicKey);

        localStorage.setItem(`enc_priv_${userId}`, encPriv);
        localStorage.setItem(`enc_pub_${userId}`, encPub);
        localStorage.setItem(`sign_priv_${userId}`, signPriv);
        localStorage.setItem(`sign_pub_${userId}`, signPub);

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

    const mockLogin = async (email: string, role: UserRole) => {
        const mockUser = {
            id: email, // Use email as ID for demo
            email: email,
            aud: 'authenticated',
            created_at: new Date().toISOString(),
        };
        // Simulate slight delay
        await new Promise(r => setTimeout(r, 100));
        setUser(mockUser);
        localStorage.setItem(`role_${mockUser.id}`, role);
        setRole(role);
        await loadKeys(mockUser.id);

        // Update public directory with this email so others can find me
        const dir = JSON.parse(localStorage.getItem('public_key_directory') || '{}');
        if (!dir[mockUser.id]) {
            await generateAndStoreKeys(mockUser.id);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem(`role_${user?.id}`);
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
            user, role, encryptionKeys, signingKeys, isAuthenticated: !!user, login, mockLogin, logout, generateAndStoreKeys, getPublicKey
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
