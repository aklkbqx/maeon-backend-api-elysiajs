import { Elysia, t } from 'elysia';
import { PrismaClient, Programs, Activities, ProgramTypes, Locations } from '@prisma/client';


type ProgramWithRelations = Programs & {
    ProgramTypes: ProgramTypes;
    Activities: (Activities & {
        Locations: Locations;
    })[];
};


// interface ItineraryActivity {
//     time: string;
//     activityId: number;
// }

// interface Itinerary {
//     start: {
//         time: string;
//         activity: string;
//     };
//     activities: ItineraryActivity[];
//     end: {
//         time: string;
//         activity: string;
//     };
// }

// interface ProgramWithActivities extends Programs {
//     activities?: Activities[];
//     parsedItinerary?: Itinerary;
// }
// interface ProgramWithActivities extends Programs {
//     activities?: Activities[];
// }

const prisma = new PrismaClient();
const app = new Elysia()
    // .get('/short-term-programs', async () => {
    //     try {
    //         const programs = await prisma.programs.findMany({
    //             where: {
    //                 ProgramTypes: {
    //                     name: 'โปรแกรมระยะสั้น (One-day trip)'
    //                 }
    //             },
    //             include: {
    //                 ProgramTypes: true
    //             }
    //         }) as ProgramWithActivities[];

    //         for (const program of programs) {
    //             const parsedItinerary = JSON.parse(program.itinerary) as Itinerary;
    //             program.parsedItinerary = parsedItinerary;

    //             const activityIds = parsedItinerary.activities.map(a => a.activityId);

    //             const activities = await prisma.activities.findMany({
    //                 where: {
    //                     id: { in: activityIds }
    //                 },
    //                 include: {
    //                     Locations: true
    //                 }
    //             });

    //             program.activities = activities;
    //         }

    //         return {
    //             success: true,
    //             data: programs
    //         };
    //     } catch (error) {
    //         console.error('Error fetching short-term programs:', error);
    //         return {
    //             success: false,
    //             message: 'Failed to fetch short-term programs'
    //         };
    //     }
    // })
    .get('/', async () => {
        try {
            const programs = await prisma.programTypes.findMany({
                include: {
                    Programs: {}
                }
            });

            for(const program of programs){
                console.log(program);
            }

            // const structuredData = programTypes.map((programType) => ({
            //     id: programType.id,
            //     name: programType.name,
            //     description: programType.description,
            //     createdAt: programType.createdAt,
            //     updatedAt: programType.updatedAt,
            //     Programs: programType.Programs.map((program: ProgramWithRelations) => ({
            //         id: program.id,
            //         name: program.name,
            //         description: program.description,
            //         type: program.type,
            //         itinerary: JSON.parse(program.itinerary as string),
            //         wellness_dimensions: program.wellness_dimensions,
            //         total_price: program.total_price,
            //         duration: program.duration,
            //         maxParticipants: program.maxParticipants,
            //         minAge: program.minAge,
            //         maxAge: program.maxAge,
            //         difficulty: program.difficulty,
            //         included: program.included,
            //         notIncluded: program.notIncluded,
            //         meetingPoint: program.meetingPoint,
            //         createdAt: program.createdAt,
            //         updatedAt: program.updatedAt,
            //         activities: program.Activities.map((activity) => ({
            //             id: activity.id,
            //             name: activity.name,
            //             description: activity.description,
            //             duration: activity.duration,
            //             cost: activity.cost,
            //             locationId: activity.locationId,
            //             Locations: activity.Locations
            //         }))
            //     }))
            // }));

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