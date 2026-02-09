import { Router } from 'express';
import { prisma } from '../index.js';
import { parse } from 'csv-parse';
import multer from 'multer';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/tolls' });

// Upload toll CSV file
// Format: Plate, Date, Amount, Location (optional)
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileContent = fs.readFileSync(req.file.path, 'utf-8');
        const records: any[] = [];

        // Parse CSV
        await new Promise<void>((resolve, reject) => {
            parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            }, (err, data) => {
                if (err) reject(err);
                records.push(...data);
                resolve();
            });
        });

        const results: any[] = [];
        const errors: any[] = [];

        for (const record of records) {
            try {
                const plate = record.Plate || record.plate;
                const date = new Date(record.Date || record.date);
                const amount = parseFloat(record.Amount || record.amount);
                const location = record.Location || record.location || null;

                if (!plate || isNaN(date.getTime()) || isNaN(amount)) {
                    errors.push({
                        record,
                        error: 'Invalid data format'
                    });
                    continue;
                }

                // Find vehicle by plate
                const vehicle = await prisma.vehicle.findUnique({
                    where: { plate },
                    include: {
                        rentals: {
                            where: { status: 'ACTIVE' },
                            include: { invoices: { where: { status: 'PENDING' }, take: 1 } }
                        }
                    }
                });

                if (!vehicle) {
                    errors.push({
                        record,
                        error: 'Vehicle not found'
                    });
                    continue;
                }

                // Create toll charge record
                const tollCharge = await prisma.tollCharge.create({
                    data: {
                        plate,
                        date,
                        amount,
                        location,
                        // Link to pending invoice if exists
                        invoiceId: vehicle.rentals[0]?.invoices[0]?.id || null
                    }
                });

                // If there's an active rental with pending invoice, update the invoice tolls
                const activeRental = vehicle.rentals[0];
                if (activeRental?.invoices[0]) {
                    await prisma.invoice.update({
                        where: { id: activeRental.invoices[0].id },
                        data: {
                            tolls: { increment: amount },
                            amount: { increment: amount }
                        }
                    });
                }

                results.push({
                    plate,
                    date,
                    amount,
                    tollChargeId: tollCharge.id,
                    linkedToInvoice: !!activeRental?.invoices[0]
                });
            } catch (err: any) {
                errors.push({
                    record,
                    error: err.message
                });
            }
        }

        // Cleanup temp file
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'Toll upload processed',
            processed: results.length,
            errors: errors.length,
            results,
            errorDetails: errors
        });
    } catch (error) {
        console.error('Toll upload error:', error);
        res.status(500).json({ error: 'Failed to process toll upload' });
    }
});

// Get toll charges
router.get('/', async (req, res) => {
    try {
        const { plate, startDate, endDate } = req.query;

        const where: any = {};
        if (plate) where.plate = plate;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate as string);
            if (endDate) where.date.lte = new Date(endDate as string);
        }

        const tolls = await prisma.tollCharge.findMany({
            where,
            include: { invoice: true },
            orderBy: { date: 'desc' }
        });

        res.json(tolls);
    } catch (error) {
        console.error('Get tolls error:', error);
        res.status(500).json({ error: 'Failed to fetch tolls' });
    }
});

export default router;
