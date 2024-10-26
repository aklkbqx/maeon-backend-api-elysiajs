import jwt from '@elysiajs/jwt'
import { Elysia, t } from 'elysia'
import { JWTPayloadUser } from '../../../../lib/lib';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
    throw new Error("Key and Secret Key undefined!");
}

export enum NotificationType {
    SYSTEM = "SYSTEM",                  // แจ้งเตือนจากระบบ
    CHAT = "CHAT",                      // แจ้งเตือนข้อความใหม่
    ORDER = "ORDER",                    // แจ้งเตือนคำสั่งซื้อ
    PAYMENT = "PAYMENT",                // แจ้งเตือนการชำระเงิน
    PROMOTION = "PROMOTION",            // แจ้งเตือนโปรโมชั่น
    ANNOUNCEMENT = "ANNOUNCEMENT",      // ประกาศจากแอพ
    STATUS_UPDATE = "STATUS_UPDATE",    // อัพเดทสถานะ
    REMINDER = "REMINDER"               // การแจ้งเตือนทั่วไป
}

const app = new Elysia()
    .use(jwt({ name: 'jwt', secret: SECRET_KEY }))
    .derive(async ({ query: { token }, jwt }) => {
        const payloadUser = await jwt.verify(token) as JWTPayloadUser;
        if (!payloadUser) {
            return { success: false, message: "การยืนยันตัวตนไม่ถูกต้อง" };
        }
        const existingUser = await prisma.users.findUnique({
            where: { id: payloadUser.id },
        });
        if (!existingUser) {
            return {
                success: false,
                message: "ไม่พบข้อมูลผู้ใช้",
            };
        }
        return { payloadUser, existingUser }
    })
    .ws('/notification', {
        query: t.Object({
            token: t.String()
        }),
        body: t.Object({
            type: t.Enum(NotificationType),
            receive: t.Object({
                userId: t.Optional(t.Union([t.Number(), t.Array(t.Number())])),
                all: t.Boolean()
            }),
            title: t.String(),
            body: t.String(),
            data: t.Optional(t.Object({
                link: t.Optional(t.String()),
                orderId: t.Optional(t.Number()),
                chatId: t.Optional(t.Number()),
                paymentId: t.Optional(t.Number()),
            }))
        }),
        open(ws) {
            const userData = ws.data.existingUser
            if (!userData) {
                ws.send({
                    success: ws.data.success,
                    message: ws.data.message
                })
                ws.close()
            } else {
                // console.log(`user: '${userData?.firstname}' is Connected!, role: ${userData?.role}`);
                ws.subscribe("notification")
            }
        },
        message(ws, { type, body, title, receive, data }) {
            ws.publish("notification", { type, body, title, receive, data })
        },
        close(ws) {
            // const userData = ws.data.existingUser
            // console.log(`user: '${userData?.firstname}' is Disconnected!`);
            ws.unsubscribe("notification")
        }
    })

export default app