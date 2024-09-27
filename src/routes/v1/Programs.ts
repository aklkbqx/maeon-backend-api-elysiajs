import { Elysia, t } from 'elysia';
import { PrismaClient, programs, activities, programtypes, locations } from '@prisma/client';


type ProgramWithRelations = programs & {
    ProgramTypes: programtypes;
    Activities: (activities & {
        Locations: locations;
    })[];
};


interface ItineraryActivity {
    time: string;
    activityId: number;
}

interface Itinerary {
    start: {
        time: string;
        activity: string;
    };
    activities: ItineraryActivity[];
    end: {
        time: string;
        activity: string;
    };
}

interface ProgramWithActivities extends programs {
    activities?: activities[];
    parsedItinerary?: Itinerary;
}
interface ProgramWithActivities extends programs {
    activities?: activities[];
}

const prisma = new PrismaClient();
const app = new Elysia()
    .get('/short-term-programs', async () => {
        try {
            const programs = await prisma.programs.findMany({
                where: {
                    programtypes: {
                        id: 1,
                        name: 'โปรแกรมระยะสั้น (One-day trip)'
                    }
                },
                include: {
                    programtypes: true
                }
            }) as ProgramWithActivities[];

            // for (const program of programs) {
            //     const parsedItinerary = JSON.parse(program.itinerary) as Itinerary;
            //     program.parsedItinerary = parsedItinerary;

            //     const activityIds = parsedItinerary.activities.map(a => a.activityId);

            //     const activities = await prisma.activities.findMany({
            //         where: {
            //             id: { in: activityIds }
            //         },
            //         include: {
            //             Locations: true
            //         }
            //     });

            //     program.activities = activities;
            // }

            return {
                success: true,
                data: programs
            };
        } catch (error) {
            console.error('Error fetching short-term programs:', error);
            return {
                success: false,
                message: 'Failed to fetch short-term programs'
            };
        }
    })
    .get('/', async () => {
        try {
            const programs = await prisma.programtypes.findMany({
                include: {
                    programs: {}
                }
            });

            for (const program of programs) {
                console.log(program);
            }

            return {
                success: true,
                data: programs
            };
        } catch (error) {
            console.error('Error fetching short-term programs:', error);
            return {
                success: false,
                message: 'Failed to fetch short-term programs'
            };
        }
    });

export default app;