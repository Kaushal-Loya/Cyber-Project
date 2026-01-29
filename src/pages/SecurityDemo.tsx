import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AuthenticationService } from "@/services/AuthenticationService";
import { CryptoService } from "@/services/CryptoService";
import { AccessControlService, UserRole, ResourceType, Action } from "@/services/AccessControlService";
import { Check, X, Shield, Lock, Key, Hash, FileCode } from "lucide-react";

export default function SecurityDemo() {
    const [password, setPassword] = useState("");
    const [hashResult, setHashResult] = useState<{ hash: string; salt: string } | null>(null);
    const [verifyPassword, setVerifyPassword] = useState("");
    const [verifyResult, setVerifyResult] = useState<boolean | null>(null);

    const [plaintext, setPlaintext] = useState("");
    const [encrypted, setEncrypted] = useState<{ iv: string; cipherText: string } | null>(null);
    const [decrypted, setDecrypted] = useState<string>("");
    const [aesKey, setAesKey] = useState<CryptoKey | null>(null);

    const [signData, setSignData] = useState("");
    const [signature, setSignature] = useState<string>("");
    const [signKeys, setSignKeys] = useState<CryptoKeyPair | null>(null);
    const [verifySignResult, setVerifySignResult] = useState<boolean | null>(null);

    const [base64Input, setBase64Input] = useState("");
    const [base64Output, setBase64Output] = useState("");

    // ========== HASHING WITH SALT ==========
    const handleHashPassword = async () => {
        if (!password) {
            toast.error("Enter a password to hash");
            return;
        }
        const result = await AuthenticationService.hashPassword(password);
        setHashResult(result);
        toast.success("Password hashed with PBKDF2 + Salt!");
    };

    const handleVerifyPassword = async () => {
        if (!hashResult || !verifyPassword) {
            toast.error("Hash password first, then verify");
            return;
        }
        const isValid = await AuthenticationService.verifyPassword(
            verifyPassword,
            hashResult.hash,
            hashResult.salt
        );
        setVerifyResult(isValid);
        toast[isValid ? "success" : "error"](
            isValid ? "Password matches!" : "Password does not match!"
        );
    };

    // ========== ENCRYPTION & DECRYPTION ==========
    const handleGenerateAESKey = async () => {
        const key = await CryptoService.generateAESKey();
        setAesKey(key);
        toast.success("AES-256 key generated!");
    };

    const handleEncrypt = async () => {
        if (!aesKey) {
            toast.error("Generate AES key first");
            return;
        }
        if (!plaintext) {
            toast.error("Enter plaintext to encrypt");
            return;
        }
        const encoder = new TextEncoder();
        const data = encoder.encode(plaintext);
        const result = await CryptoService.encryptData(data.buffer, aesKey);
        setEncrypted(result);
        toast.success("Data encrypted with AES-GCM!");
    };

    const handleDecrypt = async () => {
        if (!encrypted || !aesKey) {
            toast.error("Encrypt data first");
            return;
        }
        const decryptedBuffer = await CryptoService.decryptData(
            encrypted.cipherText,
            encrypted.iv,
            aesKey
        );
        const decoder = new TextDecoder();
        const decryptedText = decoder.decode(decryptedBuffer);
        setDecrypted(decryptedText);
        toast.success("Data decrypted successfully!");
    };

    // ========== DIGITAL SIGNATURES ==========
    const handleGenerateSignKeys = async () => {
        const keys = await CryptoService.generateKeyPair();
        setSignKeys(keys);
        toast.success("RSA-PSS key pair generated!");
    };

    const handleSign = async () => {
        if (!signKeys) {
            toast.error("Generate signing keys first");
            return;
        }
        if (!signData) {
            toast.error("Enter data to sign");
            return;
        }
        const sig = await CryptoService.signData(signData, signKeys.privateKey);
        setSignature(sig);
        toast.success("Data signed with RSA-PSS!");
    };

    const handleVerifySign = async () => {
        if (!signKeys || !signature || !signData) {
            toast.error("Sign data first");
            return;
        }
        const isValid = await CryptoService.verifySignature(
            signData,
            signature,
            signKeys.publicKey
        );
        setVerifySignResult(isValid);
        toast[isValid ? "success" : "error"](
            isValid ? "Signature is valid!" : "Signature is invalid!"
        );
    };

    // ========== BASE64 ENCODING ==========
    const handleEncode = () => {
        if (!base64Input) {
            toast.error("Enter text to encode");
            return;
        }
        const encoded = window.btoa(base64Input);
        setBase64Output(encoded);
        toast.success("Text encoded to Base64!");
    };

    const handleDecode = () => {
        if (!base64Output) {
            toast.error("Encode text first");
            return;
        }
        try {
            const decoded = window.atob(base64Output);
            setBase64Input(decoded);
            toast.success("Base64 decoded!");
        } catch (error) {
            toast.error("Invalid Base64 string");
        }
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold font-mono flex items-center justify-center gap-3">
                        <Shield className="w-10 h-10 text-primary" />
                        Security Implementation Demo
                    </h1>
                    <p className="text-muted-foreground">
                        Interactive demonstration of all implemented security features
                    </p>
                </div>

                <Tabs defaultValue="auth" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="auth">Authentication</TabsTrigger>
                        <TabsTrigger value="access">Access Control</TabsTrigger>
                        <TabsTrigger value="encryption">Encryption</TabsTrigger>
                        <TabsTrigger value="signing">Digital Signature</TabsTrigger>
                        <TabsTrigger value="encoding">Encoding</TabsTrigger>
                    </TabsList>

                    {/* AUTHENTICATION TAB */}
                    <TabsContent value="auth" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="w-5 h-5" />
                                    Password Hashing with Salt (PBKDF2)
                                </CardTitle>
                                <CardDescription>
                                    Hash passwords using PBKDF2 with SHA-256 (100,000 iterations) and unique salt
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Password to Hash</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter password"
                                            className="font-mono"
                                        />
                                        <Button onClick={handleHashPassword}>
                                            <Hash className="w-4 h-4 mr-2" />
                                            Hash
                                        </Button>
                                    </div>
                                </div>

                                {hashResult && (
                                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Salt (Base64)</Label>
                                            <p className="text-xs font-mono break-all bg-background p-2 rounded">
                                                {hashResult.salt}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Hash (Base64)</Label>
                                            <p className="text-xs font-mono break-all bg-background p-2 rounded">
                                                {hashResult.hash}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-4 space-y-2">
                                    <Label>Verify Password</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="password"
                                            value={verifyPassword}
                                            onChange={(e) => setVerifyPassword(e.target.value)}
                                            placeholder="Enter password to verify"
                                            className="font-mono"
                                        />
                                        <Button onClick={handleVerifyPassword} variant="outline">
                                            Verify
                                        </Button>
                                    </div>
                                    {verifyResult !== null && (
                                        <div
                                            className={`flex items-center gap-2 p-2 rounded ${verifyResult ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                                                }`}
                                        >
                                            {verifyResult ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Password matches!
                                                </>
                                            ) : (
                                                <>
                                                    <X className="w-4 h-4" />
                                                    Password does not match!
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ACCESS CONTROL TAB */}
                    <TabsContent value="access" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Role-Based Access Control (RBAC)
                                </CardTitle>
                                <CardDescription>
                                    Access Control Matrix with 3 subjects and 3 objects
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="p-2 text-left font-mono text-sm">Role / Resource</th>
                                                    <th className="p-2 text-left font-mono text-sm">Academic Artifacts</th>
                                                    <th className="p-2 text-left font-mono text-sm">Assessment Metrics</th>
                                                    <th className="p-2 text-left font-mono text-sm">Institutional Records</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-b">
                                                    <td className="p-2 font-semibold text-blue-500">Student</td>
                                                    <td className="p-2 text-xs">
                                                        {AccessControlService.hasPermission(
                                                            UserRole.STUDENT,
                                                            ResourceType.ACADEMIC_ARTIFACTS,
                                                            Action.CREATE
                                                        ) && <span className="text-green-500">CREATE </span>}
                                                        {AccessControlService.hasPermission(
                                                            UserRole.STUDENT,
                                                            ResourceType.ACADEMIC_ARTIFACTS,
                                                            Action.READ
                                                        ) && <span className="text-green-500">READ</span>}
                                                    </td>
                                                    <td className="p-2 text-xs text-muted-foreground">-</td>
                                                    <td className="p-2 text-xs">
                                                        {AccessControlService.hasPermission(
                                                            UserRole.STUDENT,
                                                            ResourceType.INSTITUTIONAL_RECORDS,
                                                            Action.READ
                                                        ) && <span className="text-green-500">READ</span>}
                                                    </td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="p-2 font-semibold text-purple-500">Reviewer</td>
                                                    <td className="p-2 text-xs">
                                                        {AccessControlService.hasPermission(
                                                            UserRole.REVIEWER,
                                                            ResourceType.ACADEMIC_ARTIFACTS,
                                                            Action.READ
                                                        ) && <span className="text-green-500">READ</span>}
                                                    </td>
                                                    <td className="p-2 text-xs">
                                                        {AccessControlService.hasPermission(
                                                            UserRole.REVIEWER,
                                                            ResourceType.ASSESSMENT_METRICS,
                                                            Action.CREATE
                                                        ) && <span className="text-green-500">CREATE </span>}
                                                        {AccessControlService.hasPermission(
                                                            UserRole.REVIEWER,
                                                            ResourceType.ASSESSMENT_METRICS,
                                                            Action.READ
                                                        ) && <span className="text-green-500">READ </span>}
                                                        {AccessControlService.hasPermission(
                                                            UserRole.REVIEWER,
                                                            ResourceType.ASSESSMENT_METRICS,
                                                            Action.SIGN
                                                        ) && <span className="text-green-500">SIGN</span>}
                                                    </td>
                                                    <td className="p-2 text-xs text-muted-foreground">-</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2 font-semibold text-orange-500">Admin</td>
                                                    <td className="p-2 text-xs">
                                                        {AccessControlService.hasPermission(
                                                            UserRole.ADMIN,
                                                            ResourceType.ACADEMIC_ARTIFACTS,
                                                            Action.READ
                                                        ) && <span className="text-green-500">READ </span>}
                                                        {AccessControlService.hasPermission(
                                                            UserRole.ADMIN,
                                                            ResourceType.ACADEMIC_ARTIFACTS,
                                                            Action.DELETE
                                                        ) && <span className="text-green-500">DELETE</span>}
                                                    </td>
                                                    <td className="p-2 text-xs">
                                                        {AccessControlService.hasPermission(
                                                            UserRole.ADMIN,
                                                            ResourceType.ASSESSMENT_METRICS,
                                                            Action.READ
                                                        ) && <span className="text-green-500">READ </span>}
                                                        {AccessControlService.hasPermission(
                                                            UserRole.ADMIN,
                                                            ResourceType.ASSESSMENT_METRICS,
                                                            Action.VERIFY
                                                        ) && <span className="text-green-500">VERIFY</span>}
                                                    </td>
                                                    <td className="p-2 text-xs">
                                                        {AccessControlService.hasPermission(
                                                            UserRole.ADMIN,
                                                            ResourceType.INSTITUTIONAL_RECORDS,
                                                            Action.CREATE
                                                        ) && <span className="text-green-500">CREATE </span>}
                                                        {AccessControlService.hasPermission(
                                                            UserRole.ADMIN,
                                                            ResourceType.INSTITUTIONAL_RECORDS,
                                                            Action.UPDATE
                                                        ) && <span className="text-green-500">UPDATE </span>}
                                                        {AccessControlService.hasPermission(
                                                            UserRole.ADMIN,
                                                            ResourceType.INSTITUTIONAL_RECORDS,
                                                            Action.READ
                                                        ) && <span className="text-green-500">READ </span>}
                                                        {AccessControlService.hasPermission(
                                                            UserRole.ADMIN,
                                                            ResourceType.INSTITUTIONAL_RECORDS,
                                                            Action.DELETE
                                                        ) && <span className="text-green-500">DELETE</span>}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ENCRYPTION TAB */}
                    <TabsContent value="encryption" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="w-5 h-5" />
                                    AES-256-GCM Encryption
                                </CardTitle>
                                <CardDescription>
                                    Symmetric encryption with Authenticated Encryption (AES-GCM)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button onClick={handleGenerateAESKey} variant="outline">
                                    {aesKey ? "✓ AES Key Generated" : "Generate AES-256 Key"}
                                </Button>

                                <div className="space-y-2">
                                    <Label>Plaintext</Label>
                                    <Input
                                        value={plaintext}
                                        onChange={(e) => setPlaintext(e.target.value)}
                                        placeholder="Enter text to encrypt"
                                        className="font-mono"
                                    />
                                    <Button onClick={handleEncrypt} disabled={!aesKey}>
                                        Encrypt
                                    </Button>
                                </div>

                                {encrypted && (
                                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">IV (96-bit)</Label>
                                            <p className="text-xs font-mono break-all bg-background p-2 rounded">
                                                {encrypted.iv}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Ciphertext</Label>
                                            <p className="text-xs font-mono break-all bg-background p-2 rounded">
                                                {encrypted.cipherText}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <Button onClick={handleDecrypt} disabled={!encrypted} variant="outline">
                                        Decrypt
                                    </Button>
                                    {decrypted && (
                                        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded">
                                            <Label className="text-xs text-muted-foreground">Decrypted Text</Label>
                                            <p className="font-mono text-sm">{decrypted}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* DIGITAL SIGNATURE TAB */}
                    <TabsContent value="signing" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileCode className="w-5 h-5" />
                                    Digital Signatures (RSA-PSS)
                                </CardTitle>
                                <CardDescription>
                                    Sign data with RSA private key and verify with public key
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button onClick={handleGenerateSignKeys} variant="outline">
                                    {signKeys ? "✓ RSA Key Pair Generated" : "Generate RSA-2048 Key Pair"}
                                </Button>

                                <div className="space-y-2">
                                    <Label>Data to Sign</Label>
                                    <Input
                                        value={signData}
                                        onChange={(e) => setSignData(e.target.value)}
                                        placeholder="Enter data to sign"
                                        className="font-mono"
                                    />
                                    <Button onClick={handleSign} disabled={!signKeys}>
                                        Sign Data
                                    </Button>
                                </div>

                                {signature && (
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <Label className="text-xs text-muted-foreground">Digital Signature (Base64)</Label>
                                        <p className="text-xs font-mono break-all bg-background p-2 rounded mt-2">
                                            {signature}
                                        </p>
                                    </div>
                                )}

                                <div className="border-t pt-4 space-y-2">
                                    <Button onClick={handleVerifySign} disabled={!signature} variant="outline">
                                        Verify Signature
                                    </Button>
                                    {verifySignResult !== null && (
                                        <div
                                            className={`flex items-center gap-2 p-2 rounded ${verifySignResult
                                                ? "bg-green-500/10 text-green-600"
                                                : "bg-red-500/10 text-red-600"
                                                }`}
                                        >
                                            {verifySignResult ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Signature is valid! Data integrity verified.
                                                </>
                                            ) : (
                                                <>
                                                    <X className="w-4 h-4" />
                                                    Signature is invalid! Data has been tampered.
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ENCODING TAB */}
                    <TabsContent value="encoding" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Base64 Encoding/Decoding</CardTitle>
                                <CardDescription>Binary-to-text encoding scheme</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Input Text</Label>
                                    <Input
                                        value={base64Input}
                                        onChange={(e) => setBase64Input(e.target.value)}
                                        placeholder="Enter text to encode"
                                        className="font-mono"
                                    />
                                    <Button onClick={handleEncode}>Encode to Base64</Button>
                                </div>

                                {base64Output && (
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <Label className="text-xs text-muted-foreground">Base64 Output</Label>
                                        <p className="text-xs font-mono break-all bg-background p-2 rounded mt-2">
                                            {base64Output}
                                        </p>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <Button onClick={handleDecode} variant="outline">
                                        Decode from Base64
                                    </Button>
                                </div>

                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
                                    <strong>⚠️ Security Note:</strong> Base64 is encoding, NOT encryption. It provides
                                    no security and can be easily decoded. Always use proper encryption for sensitive
                                    data.
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
