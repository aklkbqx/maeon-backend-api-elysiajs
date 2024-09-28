import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';

interface BookingItem {
    program_type_id: number;
    date: string;
    program_id: number;
}

const prisma = new PrismaClient();

const app = new Elysia()
    .post("/book", async ({ body, set }) => {
        try {
            const bookingData = body as BookingItem[];
            if (!Array.isArray(bookingData) || bookingData.length === 0) {
                set.status = 400;
                return {
                    success: false,
                    message: "Invalid input data. Expected a non-empty array of booking items."
                };
            }
            for (const booking of bookingData) {
                const program_type = await prisma.program_types.findUnique({
                    where: {
                        id: booking.program_type_id
                    }
                })
            }
            // const bookingResults = await Promise.all(bookingData.map(async (item) => {
            //     const booking = await prisma.program_bookings.create({
            //         data: {
            //             // date: new Date(item.date),
            //             // programId: item.program_id,
            //             // Add any other necessary fields
            //         }
            //     });

            //     return booking;
            // }));

            // return {
            //     success: true,
            //     message: "Bookings created successfully",
            //     data: bookingResults
            // };

        } catch (error) {
            set.status = 500;
            console.error(error);
            return {
                success: false,
                message: "An error occurred while processing the bookings"
            };
        }
    }, {
        body: t.Array(
            t.Object({
                program_type_id: t.Number(),
                date: t.String(),
                program_id: t.Number()
            })
        )
    });

export default app;