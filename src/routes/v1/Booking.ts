import { Elysia, t } from 'elysia';
import { PrismaClient, bookings_payment_status, bookings_status } from '@prisma/client';
import { jwt } from '@elysiajs/jwt';
import { getThaiDate, JWTPayloadUser } from '../../../lib/lib';

export interface BookingItem {
    people: number;
    start_date: string;
    end_date: string;
    booking_detail: {
        program_id: number;
        date: string;
    }[]
}

const prisma = new PrismaClient();

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
    throw new Error('SECRET_KEY is not defined.');
}

const app = new Elysia()
    .use(jwt({ name: 'jwt', secret: SECRET_KEY }))
    .derive(async ({ headers, jwt, set }) => {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            set.status = 401;
            return { success: false, message: "ไม่พบ Token การยืนยันตัวตน" };
        }
        const token = authHeader.split(' ')[1];

        const payloadUser = await jwt.verify(token) as JWTPayloadUser;
        if (!payloadUser) {
            set.status = 401;
            return { success: false, message: "token ไม่ถูกต้อง" };
        }
        const existingUser = await prisma.users.findUnique({
            where: { id: payloadUser.id },
        });

        if (!existingUser) {
            set.status = 404;
            return {
                success: false,
                message: "ไม่พบข้อมูลผู้ใช้",
            };
        }
        return { payloadUser, existingUser }
    })
    .post("/start-booking", async ({ body, set, payloadUser }) => {
        try {
            const { people, start_date, end_date, booking_detail } = body as BookingItem

            if (!payloadUser) {
                set.status = 401;
                return { success: false, message: "token ไม่ถูกต้อง" };
            }

            let total_price = 0;
            const bookingDetails = await Promise.all(booking_detail.map(async (item) => {

                const program = await prisma.programs.findUnique({
                    where: { id: item.program_id },
                    include: { programtypes: true, program_images: true }
                });

                if (!program) { throw new Error(`ไม่พบโปรแกรมที่มี ID ${item.program_id}`); }

                total_price += program.total_price.toNumber() * people;

                return {
                    program_id: item.program_id,
                    program_name: program.name,
                    people: people,
                };
            }));

            const booking = await prisma.bookings.create({
                data: {
                    user_id: payloadUser.id,
                    booking_detail: JSON.stringify(bookingDetails),
                    booking_date: getThaiDate(),
                    start_date,
                    end_date,
                    people,
                    total_price,
                    status: bookings_status.PENDING,
                    payment_status: bookings_payment_status.UNPAID,
                }
            });

            return {
                success: true,
                message: "สร้างการจองสำเร็จแล้ว",
                booking_id: booking.id
            };

        } catch (error) {
            set.status = 500;
            console.error(error);
            return {
                success: false,
                message: "เกิดข้อผิดพลาดขณะดำเนินการจอง",
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }, {
        body: t.Object({
            people: t.Number(),
            start_date: t.String(),
            end_date: t.String(),
            booking_detail: t.Array(
                t.Object({
                    program_id: t.Number(),
                    date: t.String(),
                })
            )
        })
    })
    .get("/my-booking/:bookingId", async ({ params: { bookingId }, set, payloadUser }) => {
        if (!payloadUser) {
            set.status = 401;
            return { success: false, message: "token ไม่ถูกต้อง" };
        }
        try {
            if (isNaN(parseInt(bookingId))) {
                set.status = 400;
                return {
                    success: false,
                    message: "รหัสการจองไม่ถูกต้อง"
                };
            }

            const booking = await prisma.bookings.findUnique({
                where: { id: parseInt(bookingId), user_id: payloadUser.id }
            });

            if (!booking) {
                set.status = 404;
                return {
                    success: false,
                    message: "ไม่พบการจอง"
                };
            }

            const bookingDetails = JSON.parse(booking.booking_detail);

            return {
                success: true,
                data: {
                    booking_id: booking.id,
                    user_id: booking.user_id,
                    booking_date: booking.booking_date,
                    total_price: booking.total_price,
                    status: booking.status,
                    payment_status: booking.payment_status,
                    programs: bookingDetails
                }
            };

        } catch (error) {
            set.status = 500;
            console.error(error);
            return {
                success: false,
                message: "เกิดข้อผิดพลาดขณะดึงข้อมูลรายละเอียดการจอง",
                error: error instanceof Error ? error.message : String(error)
            };
        }
    });


export default app;