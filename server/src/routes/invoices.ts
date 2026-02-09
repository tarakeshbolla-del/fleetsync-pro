import { Router } from 'express';
import { prisma } from '../index.js';
import { BillingService } from '../services/BillingService.js';
import { InvoiceStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';

const router = Router();

// Get all invoices
router.get('/', async (req, res) => {
    try {
        const { status, rentalId, driverId } = req.query;

        const invoices = await BillingService.getInvoices({
            status: status as InvoiceStatus | undefined,
            rentalId: rentalId as string | undefined,
            driverId: driverId as string | undefined
        });

        res.json(invoices);
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

// Download invoice as PDF
router.get('/:id/pdf', async (req, res) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id },
            include: {
                rental: {
                    include: { driver: true, vehicle: true }
                },
                tollCharges: true
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.id.slice(0, 8)}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('FleetSync Pro', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('Fleet Management & Rental Invoicing', { align: 'center' });
        doc.moveDown(2);

        // Invoice Details
        doc.fontSize(18).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
        doc.moveDown();

        // Invoice Info Box
        doc.fontSize(10).font('Helvetica');
        doc.text(`Invoice ID: ${invoice.id.slice(0, 8).toUpperCase()}`);
        doc.text(`Issue Date: ${new Date().toLocaleDateString('en-AU')}`);
        doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-AU')}`);
        doc.text(`Status: ${invoice.status}`);
        doc.moveDown();

        // Driver Details
        doc.font('Helvetica-Bold').text('Bill To:');
        doc.font('Helvetica');
        doc.text(invoice.rental.driver.name);
        doc.text(invoice.rental.driver.email);
        doc.text(invoice.rental.driver.phone || '');
        doc.moveDown();

        // Vehicle Details
        doc.font('Helvetica-Bold').text('Vehicle:');
        doc.font('Helvetica');
        doc.text(`${invoice.rental.vehicle.plate} - ${invoice.rental.vehicle.make} ${invoice.rental.vehicle.model}`);
        doc.moveDown(2);

        // Line Items Table
        doc.font('Helvetica-Bold');
        doc.text('Description', 50, doc.y, { width: 300 });
        doc.text('Amount', 400, doc.y - 12, { width: 100, align: 'right' });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        doc.font('Helvetica');

        // Weekly Rate
        doc.text('Weekly Rental Rate', 50, doc.y, { width: 300 });
        doc.text(`$${parseFloat(invoice.weeklyRate.toString()).toFixed(2)}`, 400, doc.y - 12, { width: 100, align: 'right' });
        doc.moveDown();

        // Tolls
        if (parseFloat(invoice.tolls.toString()) > 0) {
            doc.text('Toll Charges', 50, doc.y, { width: 300 });
            doc.text(`$${parseFloat(invoice.tolls.toString()).toFixed(2)}`, 400, doc.y - 12, { width: 100, align: 'right' });
            doc.moveDown();
        }

        // Fines
        if (parseFloat(invoice.fines.toString()) > 0) {
            doc.text('Traffic Fines', 50, doc.y, { width: 300 });
            doc.text(`$${parseFloat(invoice.fines.toString()).toFixed(2)}`, 400, doc.y - 12, { width: 100, align: 'right' });
            doc.moveDown();
        }

        // Credits
        if (parseFloat(invoice.credits.toString()) > 0) {
            doc.text('Credits Applied', 50, doc.y, { width: 300 });
            doc.text(`-$${parseFloat(invoice.credits.toString()).toFixed(2)}`, 400, doc.y - 12, { width: 100, align: 'right' });
            doc.moveDown();
        }

        // Total Line
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        doc.font('Helvetica-Bold');
        doc.text('TOTAL (AUD)', 50, doc.y, { width: 300 });
        doc.text(`$${parseFloat(invoice.amount.toString()).toFixed(2)}`, 400, doc.y - 12, { width: 100, align: 'right' });
        doc.moveDown(2);

        // Footer
        doc.fontSize(8).font('Helvetica').fillColor('gray');
        doc.text('FleetSync Pro Pty Ltd | ABN: 12 345 678 901', { align: 'center' });
        doc.text('Sydney, NSW, Australia', { align: 'center' });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// Get invoice by ID
router.get('/:id', async (req, res) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id },
            include: {
                rental: {
                    include: { driver: true, vehicle: true }
                },
                tollCharges: true
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
});

// Generate invoice for rental
router.post('/generate', async (req, res) => {
    try {
        const { rentalId, tolls, fines, credits } = req.body;

        const invoice = await BillingService.generateInvoice(rentalId, {
            tolls: tolls ? parseFloat(tolls) : undefined,
            fines: fines ? parseFloat(fines) : undefined,
            credits: credits ? parseFloat(credits) : undefined
        });

        res.status(201).json(invoice);
    } catch (error: any) {
        console.error('Generate invoice error:', error);
        res.status(400).json({ error: error.message || 'Failed to generate invoice' });
    }
});

// Mark invoice as paid
router.post('/:id/pay', async (req, res) => {
    try {
        const invoice = await BillingService.markAsPaid(req.params.id);
        res.json(invoice);
    } catch (error: any) {
        console.error('Pay invoice error:', error);
        res.status(400).json({ error: error.message || 'Failed to mark invoice as paid' });
    }
});

// Run billing cycle (cron trigger)
router.post('/run-billing-cycle', async (req, res) => {
    try {
        const results = await BillingService.runBillingCycle();
        res.json({
            message: 'Billing cycle completed',
            results
        });
    } catch (error) {
        console.error('Billing cycle error:', error);
        res.status(500).json({ error: 'Failed to run billing cycle' });
    }
});

// Check and mark overdue invoices
router.post('/check-overdue', async (req, res) => {
    try {
        const result = await BillingService.checkOverdueInvoices();
        res.json({
            message: 'Overdue check completed',
            count: result.count
        });
    } catch (error) {
        console.error('Overdue check error:', error);
        res.status(500).json({ error: 'Failed to check overdue invoices' });
    }
});

export default router;
