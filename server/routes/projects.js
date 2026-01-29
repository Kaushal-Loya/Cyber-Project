const express = require('express');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const { authenticate, checkPermission, ResourceType, Action } = require('../middleware/accessControl');

const router = express.Router();

/**
 * SUBMIT PROJECT - Student uploads encrypted project
 * POST /api/projects/submit
 */
router.post('/submit', authenticate, checkPermission(ResourceType.PROJECT_FILE, Action.CREATE), async (req, res) => {
    try {
        const {
            title,
            encryptedData,
            encryptedKey,
            iv,
            fileHash,
            reviewerId,
            originalName
        } = req.body;

        // Validation
        if (!title || !encryptedData || !encryptedKey || !iv || !fileHash) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const db = getDB();
        const projectsCollection = db.collection('projects');

        // Create project submission
        const newProject = {
            studentId: req.user.userId.toString(),
            studentEmail: req.user.email,
            title,
            encryptedData,      // AES-256-GCM encrypted file
            encryptedKey,       // AES key wrapped with reviewer's RSA public key
            iv,                 // Initialization vector
            fileHash,           // SHA-256 hash for integrity
            originalName: originalName || 'file.bin',
            reviewerId: reviewerId || null,
            status: 'pending',
            submittedAt: new Date(),
            evaluationId: null,
        };

        const result = await projectsCollection.insertOne(newProject);

        console.log('✅ Encrypted project submitted:', {
            id: result.insertedId,
            student: req.user.email,
            title,
        });

        res.status(201).json({
            success: true,
            message: 'Project submitted successfully',
            projectId: result.insertedId,
        });

    } catch (error) {
        console.error('Project submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Project submission failed',
            message: error.message
        });
    }
});

/**
 * GET MY PROJECTS - Student retrieves their own projects
 * GET /api/projects/my-projects
 */
router.get('/my-projects', authenticate, async (req, res) => {
    try {
        const db = getDB();
        const projectsCollection = db.collection('projects');

        // Students can only see their own projects
        const projects = await projectsCollection.find({
            studentId: req.user.userId.toString()
        }).sort({ submittedAt: -1 }).toArray();

        const evaluationsCollection = db.collection('evaluations');

        const results = await Promise.all(projects.map(async (p) => {
            // Robust lookup: Try by evaluationId first, then by submissionId
            let evalData = null;
            if (p.evaluationId) {
                evalData = await evaluationsCollection.findOne({ _id: p.evaluationId });
            }
            if (!evalData) {
                evalData = await evaluationsCollection.findOne({ submissionId: p._id });
            }

            const usersCollection = db.collection('users');
            let reviewerInfo = null;
            if (evalData) {
                const reviewer = await usersCollection.findOne({ _id: new ObjectId(evalData.evaluatorId) });
                reviewerInfo = {
                    username: reviewer?.username || 'Unknown Reviewer',
                    email: evalData.evaluatorEmail
                };
            }

            return {
                id: p._id,
                title: p.title,
                status: p.status,
                submittedAt: p.submittedAt,
                fileHash: p.fileHash,
                grade: evalData?.grading || p.grade || null,
                feedback: evalData?.feedback || null,
                evaluationDate: evalData?.timestamp || null,
                verified: p.verified || false,
                reviewer: reviewerInfo
            };
        }));

        res.json({
            success: true,
            projects: results
        });

    } catch (error) {
        console.error('Fetch projects error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch projects',
            message: error.message
        });
    }
});

/**
 * GET ASSIGNED PROJECTS - Reviewer retrieves assigned projects
 * GET /api/projects/assigned
 */
router.get('/assigned', authenticate, checkPermission(ResourceType.PROJECT_FILE, Action.READ), async (req, res) => {
    try {
        const db = getDB();
        const projectsCollection = db.collection('projects');

        // Reviewers can only see projects assigned to them
        const projects = await projectsCollection.find({
            $or: [
                { reviewerId: req.user.userId.toString() },
                { reviewerId: null } // Unassigned projects (for demo)
            ]
        }).sort({ submittedAt: -1 }).toArray();

        res.json({
            success: true,
            projects: projects.map(p => ({
                id: p._id,
                studentId: p.studentId,
                studentEmail: p.studentEmail,
                title: p.title,
                status: p.status,
                submittedAt: p.submittedAt,
                encryptedData: p.encryptedData,  // Reviewer needs this to decrypt
                encryptedKey: p.encryptedKey,    // Wrapped AES key
                iv: p.iv,                        // IV for decryption
                fileHash: p.fileHash,            // For integrity check
                originalName: p.originalName,    // Original file name
            }))
        });

    } catch (error) {
        console.error('Fetch assigned projects error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch projects',
            message: error.message
        });
    }
});

/**
 * EVALUATE PROJECT - Reviewer submits evaluation
 * POST /api/projects/evaluate
 */
router.post('/evaluate', authenticate, checkPermission(ResourceType.EVALUATION_REPORT, Action.CREATE), async (req, res) => {
    try {
        const {
            submissionId,
            score,
            grading,
            feedback,
            signature
        } = req.body;

        if (!submissionId || score === undefined || !feedback || !signature) {
            return res.status(400).json({
                success: false,
                error: 'Missing required evaluation fields'
            });
        }

        const db = getDB();
        const projectsCollection = db.collection('projects');
        const evaluationsCollection = db.collection('evaluations');

        // Check if project exists
        const project = await projectsCollection.findOne({ _id: new ObjectId(submissionId) });
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        // Create evaluation record
        const evaluation = {
            submissionId: new ObjectId(submissionId),
            evaluatorId: req.user.userId,
            evaluatorEmail: req.user.email,
            score,
            grading,
            feedback,
            signature,
            timestamp: new Date()
        };

        const result = await evaluationsCollection.insertOne(evaluation);

        // Update project status
        await projectsCollection.updateOne(
            { _id: new ObjectId(submissionId) },
            {
                $set: {
                    status: 'evaluated',
                    evaluationId: result.insertedId,
                    grade: grading || score.toString()
                }
            }
        );

        console.log('✅ Project evaluated and signed:', {
            submissionId,
            reviewer: req.user.email,
            score
        });

        res.status(201).json({
            success: true,
            message: 'Evaluation submitted and signed successfully',
            evaluationId: result.insertedId
        });

    } catch (error) {
        console.error('Evaluation submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit evaluation',
            message: error.message
        });
    }
});

/**
 * GET ALL PROJECTS - Admin retrieves all projects
 * GET /api/projects/all
 */
router.get('/all', authenticate, async (req, res) => {
    try {
        // Only admins can see all projects
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Forbidden - Admin only'
            });
        }

        const db = getDB();
        const projectsCollection = db.collection('projects');

        const projects = await projectsCollection.find({})
            .sort({ submittedAt: -1 })
            .toArray();

        const evaluationsCollection = db.collection('evaluations');
        const results = await Promise.all(projects.map(async (p) => {
            const evalData = await evaluationsCollection.findOne({ _id: p.evaluationId });
            return {
                id: p._id,
                studentId: p.studentId,
                studentEmail: p.studentEmail,
                title: p.title,
                status: p.status,
                submittedAt: p.submittedAt,
                fileHash: p.fileHash,
                reviewerId: p.reviewerId,
                verified: p.verified || false,
                grade: evalData?.grading || null
            };
        }));

        res.json({
            success: true,
            projects: results
        });

    } catch (error) {
        console.error('Fetch all projects error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch projects',
            message: error.message
        });
    }
});

/**
 * GET PENDING EVALUATIONS - Admin retrieves all evaluated projects for verification
 * GET /api/projects/pending-evaluations
 */
router.get('/pending-evaluations', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admin only' });
        }

        const db = getDB();
        const projectsCollection = db.collection('projects');
        const evaluationsCollection = db.collection('evaluations');

        // Find all projects with status 'evaluated' and NOT yet verified by admin
        const projects = await projectsCollection.find({ status: 'evaluated', verified: { $ne: true } }).toArray();
        const usersCollection = db.collection('users');

        // Join with evaluation details
        const results = await Promise.all(projects.map(async (p) => {
            const evaluationData = await evaluationsCollection.findOne({ _id: p.evaluationId });
            const student = await usersCollection.findOne({ _id: new ObjectId(p.studentId) });
            const reviewer = evaluationData ? await usersCollection.findOne({ _id: new ObjectId(evaluationData.evaluatorId) }) : null;

            return {
                id: p._id,
                title: p.title,
                studentId: p.studentId,
                studentEmail: p.studentEmail,
                studentUsername: student?.username || 'Unknown Student',
                status: p.status,
                submittedAt: p.submittedAt,
                evaluation: evaluationData ? {
                    id: evaluationData._id,
                    score: evaluationData.score,
                    grading: evaluationData.grading,
                    feedback: evaluationData.feedback,
                    signature: evaluationData.signature,
                    timestamp: evaluationData.timestamp,
                    reviewerId: evaluationData.evaluatorId,
                    reviewerEmail: evaluationData.evaluatorEmail,
                    reviewerUsername: reviewer?.username || 'Unknown Reviewer'
                } : null
            };
        }));

        res.json({ success: true, evaluations: results });

    } catch (error) {
        console.error('Fetch pending evaluations error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch pending evaluations' });
    }
});

/**
 * VERIFY AND PUBLISH - Admin verifies signature and publishes result
 * POST /api/projects/verify-publish
 */
router.post('/verify-publish', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admin only' });
        }

        const { projectId } = req.body;
        if (!projectId) return res.status(400).json({ success: false, error: 'Project ID required' });

        const db = getDB();
        const projectsCollection = db.collection('projects');

        // Update verified flag and status to 'published'
        const result = await projectsCollection.updateOne(
            { _id: new ObjectId(projectId) },
            { $set: { verified: true, status: 'published' } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        res.json({ success: true, message: 'Result verified and published' });

    } catch (error) {
        console.error('Verify and publish error:', error);
        res.status(500).json({ success: false, error: 'Failed to publish result' });
    }
});

/**
 * DELETE PROJECT - Student or Admin deletes project
 * DELETE /api/projects/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid project ID'
            });
        }

        const db = getDB();
        const projectsCollection = db.collection('projects');

        // Check if project belongs to student OR user is admin
        const project = await projectsCollection.findOne({ _id: new ObjectId(id) });

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        if (project.studentId !== req.user.userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Forbidden - You can only delete your own projects'
            });
        }

        // Prevent deletion of evaluated projects
        if (project.status === 'evaluated' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Forbidden - Cannot delete evaluated projects'
            });
        }

        await projectsCollection.deleteOne({ _id: new ObjectId(id) });

        // Also delete associated evaluations if any
        if (project.evaluationId) {
            const evaluationsCollection = db.collection('evaluations');
            await evaluationsCollection.deleteOne({ _id: project.evaluationId });
        }

        console.log(`🗑️  Project deleted by ${req.user.role}:`, {
            projectId: id,
            user: req.user.email
        });

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });

    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete project',
            message: error.message
        });
    }
});

module.exports = router;
