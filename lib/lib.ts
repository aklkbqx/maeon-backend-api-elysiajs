import { location_time_slots, PrismaClient } from '@prisma/client';
import { parseISO, addMinutes, format } from "date-fns"

const prisma = new PrismaClient();

async function validateAndAdjustSchedule(program: any) {
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

        // Adjust start time if it's earlier than the current time
        const adjustedStartTime = scheduledStartTime < currentTime ? currentTime : scheduledStartTime;

        // Calculate end time based on the activity duration
        const calculatedEndTime = addMinutes(adjustedStartTime, activityData.duration);

        // Adjust end time if it exceeds the program end time
        const adjustedEndTime = calculatedEndTime > endTime ? endTime : calculatedEndTime;

        adjustedActivities.push({
            time: `${format(adjustedStartTime, 'HH:mm')}-${format(adjustedEndTime, 'HH:mm')}`,
            activityId: activity.activityId
        });

        // Update current time for the next activity
        currentTime = adjustedEndTime;
    }

    // Sort activities by start time
    adjustedActivities.sort((a, b) => {
        const timeA: any = parseISO(`2000-01-01T${a.time.split('-')[0]}`);
        const timeB: any = parseISO(`2000-01-01T${b.time.split('-')[0]}`);
        return timeA - timeB;
    });

    // Update the schedule with adjusted activities
    schedules.activities = adjustedActivities;

    // Update the program with the new schedule
    await prisma.programs.update({
        where: { id: program.id },
        data: { schedules: JSON.stringify(schedules) }
    });

    console.log('Schedule adjusted and updated:', schedules);
}

function getThaiDate() {
    const date = new Date();
    const timezoneOffset = 7 * 60;
    const thailandTime = new Date(date.getTime() + timezoneOffset * 60 * 1000);
    return thailandTime.toISOString();
}

export {
    validateAndAdjustSchedule,
    getThaiDate
}
// validateAndAdjustSchedule ฟังชั่นในการปรับเวลาให้สมเหตุสมผลกับ Schedule ใน program
// example 
// for (const program_type of program_types) {
//     for (const program of program_type.programs) {
//         await validateAndAdjustSchedule(program);
//     }
// }

