import { prisma } from '../index.js';
import { VevoStatus, DriverStatus } from '@prisma/client';

export class DriverService {
    /**
     * Mock VEVO (Visa Verification) check
     * Returns DENIED if passport ends in '0000', else APPROVED
     */
    static checkVevoMock(passportNo: string): VevoStatus {
        if (passportNo.endsWith('0000')) {
            return VevoStatus.DENIED;
        }
        return VevoStatus.APPROVED;
    }

    /**
     * Register a new driver with VEVO check
     */
    static async registerDriver(data: {
        name: string;
        email: string;
        phone?: string;
        licenseNo: string;
        licenseExpiry?: Date;
        passportNo?: string;
    }) {
        // Check for existing driver
        const existingDriver = await prisma.driver.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { licenseNo: data.licenseNo }
                ]
            }
        });

        if (existingDriver) {
            throw new Error('Driver with this email or license already exists');
        }

        // Perform VEVO check if passport provided
        let vevoStatus: VevoStatus = VevoStatus.PENDING;
        if (data.passportNo) {
            vevoStatus = this.checkVevoMock(data.passportNo);
        }

        // Determine initial status based on VEVO
        const status: DriverStatus = vevoStatus === VevoStatus.DENIED
            ? DriverStatus.BLOCKED
            : DriverStatus.PENDING_APPROVAL;

        return prisma.driver.create({
            data: {
                ...data,
                vevoStatus,
                vevoCheckedAt: data.passportNo ? new Date() : null,
                status
            }
        });
    }

    /**
     * Run VEVO check on existing driver
     */
    static async runVevoCheck(driverId: string) {
        const driver = await prisma.driver.findUnique({
            where: { id: driverId }
        });

        if (!driver) {
            throw new Error('Driver not found');
        }

        if (!driver.passportNo) {
            throw new Error('No passport number on file');
        }

        const vevoStatus = this.checkVevoMock(driver.passportNo);

        return prisma.driver.update({
            where: { id: driverId },
            data: {
                vevoStatus,
                vevoCheckedAt: new Date(),
                status: vevoStatus === VevoStatus.DENIED
                    ? DriverStatus.BLOCKED
                    : driver.status
            }
        });
    }

    /**
     * Approve a pending driver
     */
    static async approveDriver(driverId: string) {
        const driver = await prisma.driver.findUnique({
            where: { id: driverId }
        });

        if (!driver) {
            throw new Error('Driver not found');
        }

        if (driver.vevoStatus === VevoStatus.DENIED) {
            throw new Error('Cannot approve driver with DENIED VEVO status');
        }

        return prisma.driver.update({
            where: { id: driverId },
            data: { status: DriverStatus.ACTIVE }
        });
    }

    /**
     * Block a driver
     */
    static async blockDriver(driverId: string, reason?: string) {
        return prisma.driver.update({
            where: { id: driverId },
            data: { status: DriverStatus.BLOCKED }
        });
    }

    /**
     * Get all drivers with optional status filter
     */
    static async getAll(status?: DriverStatus) {
        return prisma.driver.findMany({
            where: status ? { status } : undefined,
            include: {
                rentals: {
                    where: { status: 'ACTIVE' },
                    include: { vehicle: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get driver by ID with full details
     */
    static async getById(id: string) {
        return prisma.driver.findUnique({
            where: { id },
            include: {
                rentals: {
                    include: {
                        vehicle: true,
                        invoices: true
                    }
                }
            }
        });
    }

    /**
     * Update driver balance
     */
    static async updateBalance(driverId: string, amount: number) {
        return prisma.driver.update({
            where: { id: driverId },
            data: {
                balance: { increment: amount }
            }
        });
    }
}
