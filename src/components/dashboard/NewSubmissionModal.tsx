
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CryptoService } from '@/services/CryptoService';
import ApiService from '@/services/ApiService';
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

            // 5. Wrap AES Key with Reviewer Public Key (RSA)
            setStep('Fetching Reviewer Public Key...');
            await new Promise(r => setTimeout(r, 500));

            // Fetch reviewer keys from MongoDB backend
            const reviewerKeysResponse = await ApiService.getReviewerKeys();

            if (!reviewerKeysResponse.reviewers || reviewerKeysResponse.reviewers.length === 0) {
                throw new Error("No reviewers found in the system. Please ask an admin to create a reviewer account and login to generate keys.");
            }

            // Use first available reviewer (in production, this would be assigned by admin)
            const reviewer = reviewerKeysResponse.reviewers[0];

            setStep('Wrapping AES Key with RSA Public Key...');
            await new Promise(r => setTimeout(r, 800));

            const reviewerPubKey = await CryptoService.importPublicKey(reviewer.encPub, 'encrypt');
            const encryptedKey = await CryptoService.wrapKey(aesKey, reviewerPubKey);

            // 6. Submit to MongoDB via ApiService
            setStep('Securely uploading to MongoDB...');
            await new Promise(r => setTimeout(r, 800));

            await ApiService.submitProject({
                title,
                encryptedData: cipherText,
                encryptedKey: encryptedKey,
                iv: iv,
                fileHash: integrityHash,
                reviewerId: reviewer._id?.toString() || reviewer.id?.toString(),
                originalName: file.name
            });

            setStep('Done!');
            toast.success("Encrypted Project Uploaded to MongoDB Successfully! 🔐");
            onSuccess();
            onClose();

            // Reset form
            setTitle('');
            setFile(null);

        } catch (error) {
            console.error(error);
            toast.error("Encryption/Upload failed: " + (error as any).message);
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
                    <DialogDescription>
                        Your file will be encrypted locally before being uploaded.
                    </DialogDescription>
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
