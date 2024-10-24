import Elysia, { t } from "elysia";
import { PrismaClient } from "@prisma/client"

interface BookingDetails {
    program_id: number;
    program_name: string;
}

interface Schedule {
    start: { time: string; note: string };
    activities: {
        time: string;
        activityId: number;
    }[];
    end: { time: string; note: string };
}


// TODO เขียน Type ในการที่จะสง่ข้อมูลไปยัง Client
interface DestinationInfo {
    activity: {
        name: string;
        description: string;
        subdistrict: string;
        arrivalTime: string;
    },
    location: {
        name: string;
        type: string;
        description: string;
        address: string;
        latitude: number;
        longitude: number;
    }

}

const prisma = new PrismaClient();

const app = new Elysia()
    .get("/:booking_id", async ({ set, params: { booking_id } }) => {
        try {
            const booking = await prisma.bookings.findUnique({
                where: { id: parseInt(booking_id) },
                include: {
                    users: true
                }
            });

            if (!booking) {
                set.status = 404;
                return { success: false, message: "ไม่พบข้อมูลการจองของคุณ!" };
            }

            const bookingDetails = JSON.parse(booking.booking_detail) as BookingDetails[];
            let destinations: DestinationInfo[] = [];
            let programSchedules: Schedule | null = null;

            for (const bookingDetail of bookingDetails) {
                const program = await prisma.programs.findUnique({
                    where: { id: bookingDetail.program_id }
                });

                if (!program) {
                    set.status = 404;
                    return { success: false, message: "ไม่พบข้อมูลโปรแกรมการท่องเที่ยว" };
                }

                programSchedules = JSON.parse(program.schedules) as Schedule;

                for (const scheduleActivity of programSchedules.activities) {
                    const activity = await prisma.activities.findUnique({
                        where: { id: scheduleActivity.activityId },
                        include: {
                            locations: {
                                include: {
                                    subdistricts: true,
                                    locationtype: true
                                },
                            }
                        }
                    });

                    if (!activity || !activity.locations) {
                        set.status = 404;
                        return { success: false, message: "ไม่พบข้อมูลกิจกรรมหรือสถานที่ของโปรแกรมการเดินทาง" };
                    }

                    const locationMap = JSON.parse(activity.locations.location_map);

                    destinations.push({
                        activity: {
                            name: activity.name,
                            description: activity.description || "",
                            subdistrict: activity.locations.subdistricts?.name || "",
                            arrivalTime: scheduleActivity.time.split('-')[0]
                        },
                        location: {
                            name: activity.locations.name,
                            type: activity.locations.locationtype.name,
                            description: activity.locations.description || "",
                            address: activity.locations.address || "",
                            latitude: parseFloat(locationMap.latitude),
                            longitude: parseFloat(locationMap.longitude),
                        }
                    });
                }
            }

            return {
                success: true,
                data: {
                    startInfo: programSchedules?.start,
                    endInfo: programSchedules?.end,
                    destinations: destinations
                }
            };

        } catch (error) {
            set.status = 500;
            return { success: false, message: String(error) };
        }
    }, {
        params: t.Object({
            booking_id: t.String(),
        })
    });

export default app;