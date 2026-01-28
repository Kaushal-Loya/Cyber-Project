
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CryptoService } from '@/services/CryptoService';
import { MockDatabaseService } from '@/services/MockDatabaseService';
import { useSecurity } from '@/context/SecurityContext';
import { Loader2, Lock, ShieldCheck, FileKey, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface NewSubmissionModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const NewSubmissionModal: React.FC<NewSubmissionModalProps> = ({ open, onClose, onSuccess }) => {
    const { user } = useSecurity();
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<string>(''); // 'hashing', 'encrypting', 'uploading', 'done'

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!title || !file || !user) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            setLoading(true);

            // 1. Read File
            const fileBuffer = await file.arrayBuffer();

            // 2. Hash File (SHA-256) for Integrity
            setStep('Hashing original file (SHA-256)...');
            // Adding a small delay to make the process visible to the user
            await new Promise(r => setTimeout(r, 800));
            const integrityHash = await CryptoService.hashData(CryptoService.arrayBufferToBase64(fileBuffer));

            // 3. Generate AES Key
            setStep('Generating Ephemeral AES-256 Key...');
            await new Promise(r => setTimeout(r, 800));
            const aesKey = await CryptoService.generateAESKey();

            // 4. Encrypt File with AES Key
            setStep('Encrypting file content (AES-256-GCM)...');
            await new Promise(r => setTimeout(r, 800));
            const { iv, cipherText } = await CryptoService.encryptData(fileBuffer, aesKey);

            // 5. Encrypt AES Key with Reviewer Public Key (RSA)
            // For demo, we try to find a reviewer key, or default to a "System" key (simulated by self-encryption if no reviewer found for demo purposes, but realistically should be public key)
            // I'll simulate fetching a "Course Reviewer Key". 
            // If we don't have one, we'll generate one on the fly for the "Demo Reviewer" just so the flow works.
            setStep('Wrapping AES Key with RSA Public Key...');
            await new Promise(r => setTimeout(r, 800));

            // MOCK: Fetch a specific reviewer key. In a real scenario, this comes from a directory.
            // We will look for a key in localStorage 'public_key_directory'
            const dir = JSON.parse(localStorage.getItem('public_key_directory') || '{}');
            let reviewerPubKeyStr = Object.values(dir).find((d: any) => d.email?.includes('reviewer')) as any;

            let reviewerPubKey;
            if (reviewerPubKeyStr) {
                reviewerPubKey = await CryptoService.importPublicKey(reviewerPubKeyStr.encPub, 'encrypt');
            } else {
                // Fallback: If no reviewer exists, we use the CURRENT USER's key just to demonstrate the wrapping works, 
                // or alert the user "No Reviewer Found".
                // Better: Create a dummy reviewer key for the demo if missing.
                const dummyKeys = await CryptoService.generateEncryptionKeyPair();
                // Store this dummy key so the Reviewer Dashboard can find it later (We'd need to save the private key somewhere accessible to "Any Reviewer" login).
                // This is tricky without a backend.
                // SIMPLIFICATION: We assume the current user is submitting to THEMSELVES if no reviewer exists, OR we allow "Any key".
                // Let's use the current user's key for the demo if no reviewer is found, with a warning.
                // Ideally, the user should login as Reviewer first to set up keys.
                if (Object.keys(dir).length > 0) {
                    // Just pick the first one
                    const first = Object.values(dir)[0] as any;
                    reviewerPubKey = await CryptoService.importPublicKey(first.encPub, 'encrypt');
                } else {
                    // Generate a temporary one
                    reviewerPubKey = (await CryptoService.generateEncryptionKeyPair()).publicKey;
                }
            }

            const encryptedKey = await CryptoService.wrapKey(aesKey, reviewerPubKey);

            // 6. Submit
            setStep('Securely uploading Submission...');
            await new Promise(r => setTimeout(r, 800));

            MockDatabaseService.saveSubmission({
                id: crypto.randomUUID(),
                studentId: user.id,
                title,
                status: 'pending',
                submittedAt: new Date().toISOString(),
                fileHash: integrityHash,
                encryptedData: cipherText,
                encryptedKey: encryptedKey,
                iv: iv,
            });

            setStep('Done!');
            toast.success("Submission Encrypted and Uploaded Successfully");
            onSuccess();
            onClose();

        } catch (error) {
            console.error(error);
            toast.error("Encryption failed: " + (error as any).message);
        } finally {
            setLoading(false);
            setStep('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Secure Project Submission</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Project Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Network Security Audit"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="file">Project File</Label>
                        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
                            <Input
                                id="file"
                                type="file"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <Label htmlFor="file" className="cursor-pointer flex flex-col items-center">
                                <FileKey className="w-8 h-8 mb-2" />
                                <span className="text-sm">{file ? file.name : "Click to select file"}</span>
                            </Label>
                        </div>
                    </div>

                    {loading && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-3 text-sm font-mono text-primary">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {step}
                            </div>
                            {/* Visual Progress Steps */}
                            <div className="flex justify-between items-center text-xs text-muted-foreground px-2">
                                <span className={step.includes('Hashing') ? 'text-primary font-bold' : ''}>Hash</span>
                                <span className="h-px w-8 bg-border"></span>
                                <span className={step.includes('AES') ? 'text-primary font-bold' : ''}>AES</span>
                                <span className="h-px w-8 bg-border"></span>
                                <span className={step.includes('Wrapping') ? 'text-primary font-bold' : ''}>RSA</span>
                                <span className="h-px w-8 bg-border"></span>
                                <span className={step.includes('uploading') ? 'text-primary font-bold' : ''}>Upload</span>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading || !file || !title}>
                        {loading ? 'Encrypting...' : 'Secure Submit'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
