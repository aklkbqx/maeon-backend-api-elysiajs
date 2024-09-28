import { Elysia } from 'elysia';
import { activities, PrismaClient, program_types, programs, Prisma, locations, program_images } from '@prisma/client';

type ActivityWithLocation = activities & {
    locations: locations | null;
};

interface Schedule {
    start: { time: string; note: string };
    activities: {
        time: string;
        activityId: number;
        activityData: ActivityWithLocation;
    }[];
    end: { time: string; note: string };
}

interface ProgramType extends program_types {
    programs: (programs & { schedules: string })[];
}


interface ProgramDetail {
    id: number;
    name: string;
    description: string;
    type: string;
    start: {
        time: string;
        note: string;
    };
    activities: activities[];
    end: {
        time: string;
        note: string;
    };
    total_price: number;
    wellness_dimensions: string;
    program_images: program_images | null
}

const prisma = new PrismaClient();

const app = new Elysia()
    .get('/', async ({ set }) => {
        try {
            const program_types = await prisma.program_types.findMany({
                include: {
                    programs: {
                        include: {
                            program_images: true
                        }
                    }
                }
            });

            const program_data: ProgramType[] = await Promise.all(program_types.map(async (program_type) => {
                const updatedPrograms = await Promise.all(program_type.programs.map(async (program) => {
                    const schedules: Schedule = JSON.parse(program.schedules);
                    let totalPrice = new Prisma.Decimal(0);

                    const updatedActivities = await Promise.all(schedules.activities.map(async (activity) => {
                        const activityData = await prisma.activities.findUnique({
                            where: { id: activity.activityId },
                            include: { locations: true }
                        });

                        if (activityData?.cost) {
                            totalPrice = totalPrice.add(activityData.cost);
                        }

                        return {
                            ...activity,
                            activityData: activityData as ActivityWithLocation
                        };
                    }));

                    schedules.activities = updatedActivities;

                    await prisma.programs.update({
                        where: { id: program.id },
                        data: { total_price: totalPrice }
                    });

                    return { ...program, schedules: JSON.stringify(schedules), total_price: totalPrice };
                }));

                return { ...program_type, programs: updatedPrograms };
            }));

            set.status = 200;
            return {
                success: true,
                message: "Fetched and updated total_price programs data successfully.",
                program_data
            };
        } catch (error) {
            console.error('Error fetching and updating programs:', error);
            set.status = 500;
            return {
                success: false,
                message: 'Failed to fetch and update programs',
                error: (error as Error).message
            };
        }
    })
    .get(':programId', async ({ params: { programId }, set }) => {
        try {
            console.log(programId);
            const program = await prisma.programs.findUnique({
                where: { id: Number(programId) },
                include: {
                    programtypes: true,
                },
            });
            const program_images = await prisma.program_images.findUnique({
                where: { id: Number(programId) },
            });

            if (!program) {
                set.status = 404;
                return { success: false, message: 'Program not found' };
            }

            const schedules = JSON.parse(program.schedules);
            const activities: activities[] = await Promise.all(schedules.activities.map(async (activity: any) => {
                const activityData = await prisma.activities.findUnique({
                    where: { id: activity.activityId },
                    include: { locations: true },
                });
                return {
                    time: activity.time,
                    title: activityData?.name || '',
                    description: activityData?.description || '',
                    location: activityData?.locations?.name || '',
                    cost: activityData?.cost ? parseFloat(activityData.cost.toString()) : undefined,
                };
            }));

            const programDetail: ProgramDetail = {
                id: program.id,
                name: program.name,
                description: program.description,
                type: program.programtypes.name,
                start: schedules.start,
                activities: activities,
                end: schedules.end,
                total_price: parseFloat(program.total_price.toString()),
                wellness_dimensions: program.wellness_dimensions || '',
                program_images
            };

            set.status = 200;
            return {
                success: true,
                programDetail
            };
        } catch (error) {
            console.error('Error fetching program details:', error);
            set.status = 500;
            return {
                success: false,
                message: 'Failed to fetch program details',
                error: (error as Error).message,
            };
        }
    });

export default app;