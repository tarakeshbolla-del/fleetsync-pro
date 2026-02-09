import { Router } from 'express';
import { prisma } from '../index.js';
import { DriverService } from '../services/DriverService.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads (simulating S3)
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(uploadDir, 'onboarding');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Generate magic link for driver onboarding
router.post('/generate-link', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if driver already exists
        const existingDriver = await prisma.driver.findUnique({
            where: { email }
        });

        if (existingDriver) {
            return res.status(400).json({ error: 'Driver with this email already exists' });
        }

        // Generate unique token
        const token = uuidv4();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48); // 48 hour expiry

        // Save token
        await prisma.onboardingToken.create({
            data: {
                token,
                email,
                expiresAt
            }
        });

        // In production, this would be sent via email
        const magicLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/onboarding/${token}`;

        res.json({
            message: 'Onboarding link generated',
            link: magicLink,
            expiresAt
        });
    } catch (error) {
        console.error('Generate link error:', error);
        res.status(500).json({ error: 'Failed to generate onboarding link' });
    }
});

// Validate onboarding token
router.get('/validate/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const onboardingToken = await prisma.onboardingToken.findUnique({
            where: { token }
        });

        if (!onboardingToken) {
            return res.status(404).json({ error: 'Invalid token', valid: false });
        }

        if (onboardingToken.used) {
            return res.status(400).json({ error: 'Token already used', valid: false });
        }

        if (new Date() > onboardingToken.expiresAt) {
            return res.status(400).json({ error: 'Token expired', valid: false });
        }

        res.json({
            valid: true,
            email: onboardingToken.email
        });
    } catch (error) {
        console.error('Validate token error:', error);
        res.status(500).json({ error: 'Failed to validate token', valid: false });
    }
});

// Submit driver application with VEVO check
router.post('/submit', upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'license', maxCount: 1 }
]), async (req, res) => {
    try {
        const { token, name, licenseNo, licenseExpiry, passportNo, phone } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        // Validate token
        const onboardingToken = await prisma.onboardingToken.findUnique({
            where: { token }
        });

        if (!onboardingToken || onboardingToken.used || new Date() > onboardingToken.expiresAt) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        // Run VEVO check
        const vevoStatus = DriverService.checkVevoMock(passportNo);

        if (vevoStatus === 'DENIED') {
            // Auto-reject if VEVO denied
            await prisma.onboardingToken.update({
                where: { token },
                data: { used: true, usedAt: new Date() }
            });

            return res.status(403).json({
                error: 'Application rejected - VEVO check failed',
                vevoStatus: 'DENIED'
            });
        }

        // Create driver record
        const driver = await prisma.driver.create({
            data: {
                name,
                email: onboardingToken.email,
                phone,
                licenseNo,
                licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
                passportNo,
                vevoStatus,
                vevoCheckedAt: new Date(),
                status: 'PENDING_APPROVAL',
                passportDoc: files['passport']?.[0]?.path || null,
                licenseDoc: files['license']?.[0]?.path || null
            }
        });

        // Mark token as used
        await prisma.onboardingToken.update({
            where: { token },
            data: { used: true, usedAt: new Date() }
        });

        res.status(201).json({
            message: 'Application submitted successfully',
            driver: {
                id: driver.id,
                name: driver.name,
                email: driver.email,
                vevoStatus: driver.vevoStatus,
                status: driver.status
            }
        });
    } catch (error: any) {
        console.error('Submit application error:', error);
        res.status(400).json({ error: error.message || 'Failed to submit application' });
    }
});

// Verify passport (standalone VEVO check)
router.post('/verify', async (req, res) => {
    try {
        const { passportNo } = req.body;

        if (!passportNo) {
            return res.status(400).json({ error: 'Passport number required' });
        }

        const vevoStatus = DriverService.checkVevoMock(passportNo);

        res.json({
            passportNo,
            vevoStatus,
            checkedAt: new Date()
        });
    } catch (error) {
        console.error('VEVO verify error:', error);
        res.status(500).json({ error: 'VEVO verification failed' });
    }
});

export default router;
