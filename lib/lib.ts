import { account_status, PrismaClient, usage_status, user_role } from '@prisma/client';
import { parseISO, addMinutes, format } from "date-fns"

export type JWTPayloadUser = {
    id: number;
    role: string;
}

export interface USER_TYPE {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    tel: string;
    profile_picture: string;
    role: user_role;
    usage_status: usage_status;
    statusLastUpdate: Date;
    account_status: account_status;
    createdAt: Date
    updatedAt: Date
}

const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
    throw new Error('SECRET_KEY is not defined.');
}

export async function validateAndAdjustSchedule(program: any) {
    const schedules = JSON.parse(program.schedules);
    let currentTime = parseISO(`2000-01-01T${schedules.start.time}`);
    const endTime = parseISO(`2000-01-01T${schedules.end.time}`);
    const adjustedActivities = [];

    for (const activity of schedules.activities) {
        const activityData = await prisma.activities.findUnique({
            where: { id: activity.activityId }
        });

        if (!activityData || !activityData.duration) {
            console.warn(`Activity ${activity.activityId} not found or has no duration.`);
            continue;
        }

        const [startTime, endTime] = activity.time.split('-');
        const scheduledStartTime = parseISO(`2000-01-01T${startTime}`);
        const scheduledEndTime = parseISO(`2000-01-01T${endTime}`);
        const adjustedStartTime = scheduledStartTime < currentTime ? currentTime : scheduledStartTime;
        const calculatedEndTime = addMinutes(adjustedStartTime, activityData.duration);
        const adjustedEndTime = calculatedEndTime > endTime ? endTime : calculatedEndTime;

        adjustedActivities.push({
            time: `${format(adjustedStartTime, 'HH:mm')}-${format(adjustedEndTime, 'HH:mm')}`,
            activityId: activity.activityId
        });

        currentTime = adjustedEndTime;
    }
    adjustedActivities.sort((a, b) => {
        const timeA: any = parseISO(`2000-01-01T${a.time.split('-')[0]}`);
        const timeB: any = parseISO(`2000-01-01T${b.time.split('-')[0]}`);
        return timeA - timeB;
    });

    schedules.activities = adjustedActivities;
    await prisma.programs.update({
        where: { id: program.id },
        data: { schedules: JSON.stringify(schedules) }
    });

    console.log('Schedule adjusted and updated:', schedules);
}

export function getThaiDate(dateString?: string): Date | string {
    const thailandTimezoneOffset = 7 * 60 * 60 * 1000;
    if (dateString) {
        const inputDate = new Date(dateString);
        if (isNaN(inputDate.getTime())) {
            throw new Error('Invalid date string provided');
        }
        const thailandTime = new Date(inputDate.getTime() + thailandTimezoneOffset);
        return thailandTime;
    } else {
        const currentTime = new Date();
        const thailandTime = new Date(currentTime.getTime() + thailandTimezoneOffset);
        return thailandTime.toISOString();
    }
}



// validateAndAdjustSchedule ฟังชั่นในการปรับเวลาให้สมเหตุสมผลกับ Schedule ใน program
// example 
// for (const program_type of program_types) {
//     for (const program of program_type.programs) {
//         await validateAndAdjustSchedule(program);
//     }
// }

