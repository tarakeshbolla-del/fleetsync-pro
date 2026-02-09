import { prisma } from '../index.js';
import { RentalStatus, VehicleStatus, DriverStatus, InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class RentalService {
    /**
     * Create a new rental
     * Constraints: Vehicle cannot be SUSPENDED, Driver cannot be BLOCKED
     */
    static async createRental(data: {
        driverId: string;
        vehicleId: string;
        bondAmount: number;
        weeklyRate: number;
        startDate?: Date;
    }) {
        // Check vehicle status
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: data.vehicleId }
        });

        if (!vehicle) {
            throw new Error('Vehicle not found');
        }

        if (vehicle.status === VehicleStatus.SUSPENDED) {
            throw new Error('Cannot assign a suspended vehicle');
        }

        if (vehicle.status === VehicleStatus.RENTED) {
            throw new Error('Vehicle is already rented');
        }

        // Check driver status
        const driver = await prisma.driver.findUnique({
            where: { id: data.driverId }
        });

        if (!driver) {
            throw new Error('Driver not found');
        }

        if (driver.status === DriverStatus.BLOCKED) {
            throw new Error('Cannot assign vehicle to blocked driver');
        }

        if (driver.status !== DriverStatus.ACTIVE) {
            throw new Error('Driver must be active to rent a vehicle');
        }

        // Check driver doesn't already have an active rental
        const existingRental = await prisma.rental.findFirst({
            where: {
                driverId: data.driverId,
                status: RentalStatus.ACTIVE
            }
        });

        if (existingRental) {
            throw new Error('Driver already has an active rental');
        }

        const startDate = data.startDate || new Date();
        const nextPaymentDate = new Date(startDate);
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);

        // Create rental and update vehicle status in a transaction
        const rental = await prisma.$transaction(async (tx) => {
            // Create rental
            const newRental = await tx.rental.create({
                data: {
                    driverId: data.driverId,
                    vehicleId: data.vehicleId,
                    startDate,
                    bondAmount: data.bondAmount,
                    weeklyRate: data.weeklyRate,
                    nextPaymentDate,
                    status: RentalStatus.ACTIVE
                },
                include: {
                    driver: true,
                    vehicle: true
                }
            });

            // Update vehicle status to RENTED
            await tx.vehicle.update({
                where: { id: data.vehicleId },
                data: { status: VehicleStatus.RENTED }
            });

            return newRental;
        });

        return rental;
    }

    /**
     * End a rental
     */
    static async endRental(rentalId: string) {
        const rental = await prisma.rental.findUnique({
            where: { id: rentalId }
        });

        if (!rental) {
            throw new Error('Rental not found');
        }

        if (rental.status !== RentalStatus.ACTIVE) {
            throw new Error('Rental is not active');
        }

        // End rental and make vehicle available
        return prisma.$transaction(async (tx) => {
            const updatedRental = await tx.rental.update({
                where: { id: rentalId },
                data: {
                    status: RentalStatus.COMPLETED,
                    endDate: new Date()
                },
                include: {
                    driver: true,
                    vehicle: true
                }
            });

            await tx.vehicle.update({
                where: { id: rental.vehicleId },
                data: { status: VehicleStatus.AVAILABLE }
            });

            return updatedRental;
        });
    }

    /**
     * Get all active rentals
     */
    static async getActiveRentals() {
        return prisma.rental.findMany({
            where: { status: RentalStatus.ACTIVE },
            include: {
                driver: true,
                vehicle: true,
                invoices: {
                    orderBy: { dueDate: 'desc' },
                    take: 3
                }
            }
        });
    }

    /**
     * Get rentals due for invoicing (payment date within 3 days)
     */
    static async getRentalsDueForInvoicing() {
        const today = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(today.getDate() + 3);

        return prisma.rental.findMany({
            where: {
                status: RentalStatus.ACTIVE,
                nextPaymentDate: {
                    lte: threeDaysFromNow
                }
            },
            include: {
                driver: true,
                vehicle: true
            }
        });
    }
}
