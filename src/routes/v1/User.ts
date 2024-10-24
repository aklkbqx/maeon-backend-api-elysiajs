import { Elysia, t } from 'elysia';
import { PrismaClient, users_usage_status } from '@prisma/client';
import { jwt } from '@elysiajs/jwt';
import { unlink } from "node:fs/promises";
import path from 'path';
import { getThaiDate, JWTPayloadUser } from '../../../lib/lib';
import { existsSync } from 'node:fs';
import cors from '@elysiajs/cors';

const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
    throw new Error('SECRET_KEY is not defined.');
}

const app = new Elysia()
    .use(cors())
    .use(jwt({ name: 'jwt', secret: SECRET_KEY }))
    .derive(async ({ headers, jwt, set }) => {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            set.status = 401;
            return { success: false, message: "ไม่พบ Token การยืนยันตัวตน" };
        }
        const token = authHeader.split(' ')[1];

        const payloadUser = await jwt.verify(token) as JWTPayloadUser;
        const existingUser = await prisma.users.findUnique({
            where: { id: payloadUser.id },
        });
        return { payloadUser, existingUser }
    })
    .post('/admin/notify', ({ body, set }) => {
        app.server!.publish('notifications', JSON.stringify({
            type: 'notification',
            content: body.body
        }))

        return { success: true, message: 'Notification sent' }
    }, {
        body: t.Object({
            title: t.String(),
            body: t.String()
        })
    })
    .get("/", async ({ set }) => {
        try {
            const users = await prisma.users.findMany()
            return users;
        } catch (error) {
            set.status = 500;
            return {
                success: false,
                message: `Something went wrong: ${(error as Error).message}`
            };
        }
    })
    .get('/me', async ({ set, payloadUser }) => {
        if (!payloadUser) {
            set.status = 401;
            return { success: false, message: "token ไม่ถูกต้อง" };
        }
        try {
            const user = await prisma.users.findUnique({
                where: { id: payloadUser.id }
            });
            if (!user) {
                set.status = 404;
                return {
                    success: false,
                    message: "authenticator fail",
                    logout: true
                };
            }
            return user;
        } catch (error) {
            set.status = 500;
            return {
                success: false,
                message: `Something went wrong: ${(error as Error).message}`,
            };
        }
    })
    .put('/profile', async ({ request, body, headers, jwt, set, payloadUser, existingUser }) => {
        if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
            set.status = 400;
            return { success: false, message: "Content type must be multipart/form-data" };
        }

        if (!payloadUser) {
            set.status = 401;
            return { success: false, message: "token ไม่ถูกต้อง" };
        }

        const { email, firstname, lastname, tel, currentPassword, newPassword, profile_picture } = body
        let profile_pictureName;

        if (!existingUser) {
            set.status = 404;
            return {
                success: false,
                message: "ไม่พบข้อมูลผู้ใช้",
            };
        }

        if (profile_picture) {
            if (existingUser.profile_picture !== "default-profile.jpg") {
                const oldFilePath = `public/images/user_images/${existingUser.profile_picture}`;
                if (existsSync(oldFilePath)) {
                    await unlink(oldFilePath);
                }
            }
            const fileName = `${payloadUser.id}-${Date.now()}${path.extname(profile_picture.name)}`;
            const filePath = `public/images/user_images/${fileName}`;
            await Bun.write(filePath, await profile_picture.arrayBuffer());
            profile_pictureName = fileName;
        }

        try {
            const updateData: any = { email, firstname, lastname, tel };

            if (profile_pictureName) {
                updateData.profile_picture = profile_pictureName;
            }

            try {
                if (currentPassword && newPassword) {
                    if (currentPassword && !newPassword) {
                        throw new Error("กรุณากรอกรหัสผ่านใหม่ที่ต้องการเปลี่ยน")
                    } else if (!currentPassword && newPassword) {
                        throw new Error("กรุณากรอกรหัสผ่านปัจจุบันของคุณ")
                    }
                    const isPasswordValid = await Bun.password.verify(currentPassword, existingUser.password);
                    if (!isPasswordValid) {
                        throw new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง")
                    }

                    const hashedPassword = await Bun.password.hash(newPassword, {
                        algorithm: "bcrypt",
                        cost: 4,
                    });
                    updateData.password = hashedPassword;
                }
            } catch (error) {
                set.status = 400;
                return {
                    success: false,
                    message: error
                };
            }

            const updatedUser = await prisma.users.update({
                where: { id: payloadUser.id },
                data: updateData
            });

            const { password, ...userWithoutPassword } = updatedUser;

            return {
                success: true,
                message: "อัปเดตข้อมูลโปรไฟล์สำเร็จ",
                user: userWithoutPassword
            };
        } catch (error) {
            set.status = 500;
            return {
                success: false,
                message: `เกิดข้อผิดพลาดมีบางอย่างเกิดขึ้น: ${(error as Error).message}`
            };
        }
    }, {
        body: t.Object({
            firstname: t.Optional(t.String()),
            lastname: t.Optional(t.String()),
            email: t.Optional(t.String()),
            tel: t.Optional(t.String()),
            profile_picture: t.Optional(t.File()),
            currentPassword: t.Optional(t.String()),
            newPassword: t.Optional(t.String())
        })
    })
    .put("/update-user-status/:status", async ({ set, params: { status }, payloadUser }) => {
        if (!payloadUser) {
            set.status = 401;
            return { success: false, message: "token ไม่ถูกต้อง" };
        }
        try {
            const updateLastStatus = await prisma.users.update({
                data: {
                    usage_status: status,
                    status_last_update: getThaiDate()
                },
                where: {
                    id: payloadUser.id
                }
            })
            if (!updateLastStatus) {
                set.status = 404;
                return {
                    success: false,
                    message: "ตัวตรวจสอบล้มเหลว"
                };
            }

            set.status = 200;
            return {
                success: true,
                message: `อัพเดทสถานนะของ  userId:${payloadUser.id}\nสถานนะ: ${status} สำเร็จแล้ว`
            };
        } catch (error) {
            set.status = 500;
            return {
                success: false,
                message: `เกิดข้อผิดพลาดมีบางอย่างเกิดขึ้น: ${(error as Error).message}`
            };
        }
    }, {
        params: t.Object({
            status: t.Enum(users_usage_status),
        })
    })

export default app;