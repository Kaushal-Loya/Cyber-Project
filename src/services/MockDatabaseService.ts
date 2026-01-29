
export interface Submission {
    id: string;
    studentId: string;
    title: string;
    status: 'pending' | 'under_review' | 'evaluated' | 'rejected';
    submittedAt: string;
    fileHash: string; // SHA-256 of original file
    originalName?: string;
    encryptedData: string; // Base64
    encryptedKey: string; // Base64 (Wrapped AES Key)
    iv: string; // Base64
    evaluatorId?: string;
    evaluationId?: string;
    _id?: string;
}

export interface Evaluation {
    id: string;
    submissionId: string;
    evaluatorId: string;
    score: number;
    grading?: string;
    feedback: string;
    signature: string; // Digital Signature of (score + feedback + submissionId)
    timestamp: string;
}

const STORAGE_KEYS = {
    SUBMISSIONS: 'demo_submissions',
    EVALUATIONS: 'demo_evaluations',
};

export class MockDatabaseService {
    static getSubmissions(): Submission[] {
        const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
        return data ? JSON.parse(data) : [];
    }

    static saveSubmission(submission: Submission): void {
        const submissions = this.getSubmissions();
        submissions.push(submission);
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
    }

    static updateSubmissionStatus(id: string, status: Submission['status'], evaluatorId?: string): void {
        const submissions = this.getSubmissions();
        const index = submissions.findIndex(s => s.id === id);
        if (index !== -1) {
            submissions[index].status = status;
            if (evaluatorId) submissions[index].evaluatorId = evaluatorId;
            localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
        }
    }

    static getEvaluations(): Evaluation[] {
        const data = localStorage.getItem(STORAGE_KEYS.EVALUATIONS);
        return data ? JSON.parse(data) : [];
    }

    static saveEvaluation(evaluation: Evaluation): void {
        const evaluations = this.getEvaluations();
        evaluations.push(evaluation);
        localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(evaluations));

        // Update submission status
        this.updateSubmissionStatus(evaluation.submissionId, 'evaluated', evaluation.evaluatorId);
    }
}
