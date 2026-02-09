/**
 * Mock Uber Supplier Platform API Service
 * Simulates the Uber Supplier Platform API for rideshare analytics
 */
export class UberMockService {
    /**
     * Fetch weekly earnings for a driver
     * Returns random earnings between $800 - $1500 AUD
     * Mimics: POST /v1/vehicle-suppliers/analytics-data/query
     */
    static fetchWeeklyEarnings(driverId: string): {
        driverId: string;
        weekStarting: Date;
        grossEarnings: number;
        netEarnings: number;
        trips: number;
        hoursOnline: number;
        avgEarningsPerTrip: number;
        platform: 'uber';
    } {
        // Generate random earnings between $800 - $1500 AUD
        const grossEarnings = Math.floor(Math.random() * 700) + 800;

        // Uber typically takes ~25% commission
        const netEarnings = Math.round(grossEarnings * 0.75 * 100) / 100;

        // Random trips between 40-80
        const trips = Math.floor(Math.random() * 40) + 40;

        // Random hours between 25-50
        const hoursOnline = Math.floor(Math.random() * 25) + 25;

        // Calculate average
        const avgEarningsPerTrip = Math.round((grossEarnings / trips) * 100) / 100;

        // Week starting (most recent Monday)
        const weekStarting = new Date();
        const dayOfWeek = weekStarting.getDay();
        const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
        weekStarting.setDate(weekStarting.getDate() + diff);
        weekStarting.setHours(0, 0, 0, 0);

        return {
            driverId,
            weekStarting,
            grossEarnings,
            netEarnings,
            trips,
            hoursOnline,
            avgEarningsPerTrip,
            platform: 'uber'
        };
    }

    /**
     * Fetch historical earnings (past N weeks)
     */
    static fetchHistoricalEarnings(driverId: string, weeks: number = 4): Array<{
        driverId: string;
        weekStarting: Date;
        grossEarnings: number;
        netEarnings: number;
        trips: number;
        hoursOnline: number;
        platform: 'uber';
    }> {
        const results = [];
        const today = new Date();

        for (let i = 0; i < weeks; i++) {
            const weekDate = new Date(today);
            weekDate.setDate(today.getDate() - (i * 7));

            // Get the Monday of that week
            const dayOfWeek = weekDate.getDay();
            const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
            weekDate.setDate(weekDate.getDate() + diff);
            weekDate.setHours(0, 0, 0, 0);

            const grossEarnings = Math.floor(Math.random() * 700) + 800;
            const netEarnings = Math.round(grossEarnings * 0.75 * 100) / 100;
            const trips = Math.floor(Math.random() * 40) + 40;
            const hoursOnline = Math.floor(Math.random() * 25) + 25;

            results.push({
                driverId,
                weekStarting: weekDate,
                grossEarnings,
                netEarnings,
                trips,
                hoursOnline,
                platform: 'uber' as const
            });
        }

        return results;
    }

    /**
     * Fetch driver analytics summary
     * Mimics ROI dashboard data
     */
    static fetchDriverAnalytics(driverId: string): {
        driverId: string;
        lifetimeEarnings: number;
        lifetimeTrips: number;
        averageWeeklyEarnings: number;
        averageTripsPerWeek: number;
        rating: number;
        acceptanceRate: number;
        completionRate: number;
    } {
        // Generate realistic mock data
        const lifetimeTrips = Math.floor(Math.random() * 2000) + 500;
        const avgPerTrip = Math.floor(Math.random() * 10) + 15;
        const lifetimeEarnings = lifetimeTrips * avgPerTrip;

        const weeks = Math.floor(lifetimeTrips / 50) || 1;
        const averageWeeklyEarnings = Math.round(lifetimeEarnings / weeks);
        const averageTripsPerWeek = Math.round(lifetimeTrips / weeks);

        return {
            driverId,
            lifetimeEarnings,
            lifetimeTrips,
            averageWeeklyEarnings,
            averageTripsPerWeek,
            rating: Math.round((Math.random() * 0.5 + 4.5) * 100) / 100, // 4.50 - 5.00
            acceptanceRate: Math.round((Math.random() * 15 + 85) * 100) / 100, // 85% - 100%
            completionRate: Math.round((Math.random() * 5 + 95) * 100) / 100 // 95% - 100%
        };
    }
}
