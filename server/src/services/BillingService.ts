import { prisma } from '../index.js';
import { InvoiceStatus } from '@prisma/client';
import { RentalService } from './RentalService.js';

export class BillingService {
    /**
     * Generate invoice for a rental
     * Formula: (Weekly_Rate + Tolls + Fines) - Credits
     */
    static async generateInvoice(rentalId: string, additionalData?: {
        tolls?: number;
        fines?: number;
        credits?: number;
    }) {
        const rental = await prisma.rental.findUnique({
            where: { id: rentalId },
            include: { driver: true }
        });

        if (!rental) {
            throw new Error('Rental not found');
        }

        const weeklyRate = Number(rental.weeklyRate);
        const tolls = additionalData?.tolls || 0;
        const fines = additionalData?.fines || 0;
        const credits = additionalData?.credits || 0;

        // Calculate final amount using Australian billing formula
        const amount = (weeklyRate + tolls + fines) - credits;

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        const invoice = await prisma.invoice.create({
            data: {
                rentalId,
                weeklyRate,
                tolls,
                fines,
                credits,
                amount,
                dueDate,
                status: InvoiceStatus.PENDING
            },
            include: {
                rental: {
                    include: { driver: true, vehicle: true }
                }
            }
        });

        // Update next payment date on rental
        const nextPaymentDate = new Date(rental.nextPaymentDate);
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);

        await prisma.rental.update({
            where: { id: rentalId },
            data: { nextPaymentDate }
        });

        return invoice;
    }

    /**
     * Run billing cycle - check all active rentals and generate invoices as needed
     * This is the cron job logic (called daily)
     */
    static async runBillingCycle() {
        const rentals = await RentalService.getRentalsDueForInvoicing();
        const results: any[] = [];

        for (const rental of rentals) {
            try {
                // Check if invoice already exists for this period
                const existingInvoice = await prisma.invoice.findFirst({
                    where: {
                        rentalId: rental.id,
                        dueDate: {
                            gte: rental.nextPaymentDate
                        }
                    }
                });

                if (!existingInvoice) {
                    const invoice = await this.generateInvoice(rental.id);
                    results.push({
                        rentalId: rental.id,
                        invoiceId: invoice.id,
                        amount: invoice.amount,
                        status: 'generated'
                    });
                } else {
                    results.push({
                        rentalId: rental.id,
                        invoiceId: existingInvoice.id,
                        status: 'already_exists'
                    });
                }
            } catch (error: any) {
                results.push({
                    rentalId: rental.id,
                    status: 'error',
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Mark invoice as paid
     */
    static async markAsPaid(invoiceId: string) {
        const invoice = await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                status: InvoiceStatus.PAID,
                paidAt: new Date()
            },
            include: {
                rental: {
                    include: { driver: true }
                }
            }
        });

        // Adjust driver balance
        const amount = Number(invoice.amount);
        await prisma.driver.update({
            where: { id: invoice.rental.driverId },
            data: {
                balance: { decrement: amount }
            }
        });

        return invoice;
    }

    /**
     * Check and mark overdue invoices
     */
    static async checkOverdueInvoices() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const overdueInvoices = await prisma.invoice.updateMany({
            where: {
                status: InvoiceStatus.PENDING,
                dueDate: { lt: today }
            },
            data: { status: InvoiceStatus.OVERDUE }
        });

        return overdueInvoices;
    }

    /**
     * Get all invoices with optional filters
     */
    static async getInvoices(filters?: {
        status?: InvoiceStatus;
        rentalId?: string;
        driverId?: string;
    }) {
        const where: any = {};

        if (filters?.status) where.status = filters.status;
        if (filters?.rentalId) where.rentalId = filters.rentalId;
        if (filters?.driverId) {
            where.rental = { driverId: filters.driverId };
        }

        return prisma.invoice.findMany({
            where,
            include: {
                rental: {
                    include: { driver: true, vehicle: true }
                }
            },
            orderBy: { dueDate: 'desc' }
        });
    }
}
