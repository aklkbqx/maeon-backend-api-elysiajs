// src/routes/notifications/index.ts
import { Elysia, t } from 'elysia';
import { notifications_type, notifications_status, PrismaClient } from '@prisma/client';
import jwt from '@elysiajs/jwt';
import { JWTPayloadUser } from '../../../lib/lib';

const prisma = new PrismaClient()
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
    throw new Error('SECRET_KEY is not defined.');
}

const notificationRoutes = new Elysia()
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
    .get('/', async ({ payloadUser, set }) => {
        if (!payloadUser) {
            set.status = 401;
            return { success: false, message: "token ไม่ถูกต้อง" };
        }
        try {
            const notifications = await prisma.notifications.findMany({
                where: {
                    user_id: payloadUser.id,
                    is_deleted: false,
                },
                orderBy: [
                    { created_at: 'desc' },
                    { status: 'asc' },
                ],
            });

            return {
                success: true,
                notifications,
            };
        } catch (error) {
            return {
                success: false,
                message: 'ไม่สามารถดึงข้อมูลการแจ้งเตือนได้',
            };
        }
    })
    .get('/unread-count', async ({ payloadUser, set }) => {
        if (!payloadUser) {
            set.status = 401;
            return { success: false, message: "token ไม่ถูกต้อง" };
        }

        try {
            const count = await prisma.notifications.count({
                where: {
                    user_id: payloadUser.id,
                    status: 'UNREAD',
                    is_deleted: false,
                },
            });

            return {
                success: true,
                count,
            };
        } catch (error) {
            return {
                success: false,
                message: 'ไม่สามารถนับจำนวนการแจ้งเตือนที่ยังไม่ได้อ่านได้',
            };
        }
    })
    .put('/:id/read', async ({ params: { id }, payloadUser, set }) => {
        if (!payloadUser) {
            set.status = 401;
            return { success: false, message: "token ไม่ถูกต้อง" };
        }

        try {
            const notification = await prisma.notifications.findFirst({
                where: {
                    id: Number(id),
                    user_id: payloadUser.id,
                    is_deleted: false,
                },
            });

            if (!notification) {
                set.status = 404;
                return { success: false, message: "ไม่พบการแจ้งเตือนนี้" };
            }

            const updatedNotification = await prisma.notifications.update({
                where: { id: Number(id) },
                data: {
                    status: 'READ',
                    updated_at: new Date(),
                },
            });

            return {
                success: true,
                notification: updatedNotification,
            };
        } catch (error) {
            return {
                success: false,
                message: error || "ไม่สามารถอัพเดทสถานะการแจ้งเตือนได้",
            };
        }
    })
    .delete('/:id', async ({ params: { id }, payloadUser, set }) => {
        if (!payloadUser) {
            set.status = 401;
            return { success: false, message: "token ไม่ถูกต้อง" };
        }

        try {
            const notification = await prisma.notifications.findFirst({
                where: {
                    id: Number(id),
                    user_id: payloadUser.id,
                    is_deleted: false,
                },
            });

            if (!notification) {
                set.status = 404;
                return { success: false, message: "ไม่พบการแจ้งเตือนนี้" };
            }

            await prisma.notifications.update({
                where: { id: Number(id) },
                data: {
                    is_deleted: true,
                    updated_at: new Date(),
                },
            });

            return {
                success: true,
                message: 'ลบการแจ้งเตือนเรียบร้อยแล้ว',
            };
        } catch (error) {
            return {
                success: false,
                message: error || "ไม่สามารถลบการแจ้งเตือนได้",
            };
        }
    })
    .put('/read-all', async ({ payloadUser, set }) => {
        if (!payloadUser) {
            set.status = 401;
            return { success: false, message: "token ไม่ถูกต้อง" };
        }

        try {
            await prisma.notifications.updateMany({
                where: {
                    user_id: payloadUser.id,
                    status: 'UNREAD',
                    is_deleted: false,
                },
                data: {
                    status: 'READ',
                    updated_at: new Date(),
                },
            });

            return {
                success: true,
                message: 'อ่านการแจ้งเตือนทั้งหมดแล้ว',
            };
        } catch (error) {
            return {
                success: false,
                message: 'ไม่สามารถอัพเดทสถานะการแจ้งเตือนได้',
            };
        }
    });

export default notificationRoutes;