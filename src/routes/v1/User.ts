import { Elysia, t } from 'elysia';
import { PrismaClient, user_role, usage_status, account_status, } from '@prisma/client';
import { jwt } from '@elysiajs/jwt';
import { unlink } from "node:fs/promises";
import path from 'path';
import { getThaiDate } from '../..';


const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
    throw new Error('SECRET_KEY is not defined.');
}

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
    profilepicture: string;
    role: user_role;
    usage_status: usage_status;
    statusLastUpdate: Date;
    account_status: account_status;
    createdAt: Date
    updatedAt: Date
}

const app = new Elysia()
    .use(jwt({ name: 'jwt', secret: SECRET_KEY }))
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
    .get('/me', async ({ headers, jwt, set }) => {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            set.status = 401;
            return { success: false, message: "ไม่พบ Token การยืนยันตัวตน" };
        }

        const token = authHeader.split(' ')[1];
        try {
            const payload = await jwt.verify(token) as JWTPayloadUser;
            if (!payload) {
                set.status = 401;
                return { success: false, message: "Invalid token" };
            }
            const user = await prisma.users.findUnique({
                where: { id: payload.id }
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
    .put('/profile', async ({ request, body, headers, jwt, set }) => {
        if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
            set.status = 400;
            return {
                success: false,
                message: "Content type must be multipart/form-data"
            };
        }
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            set.status = 401;
            return { success: false, message: "ไม่พบ Token การยืนยันตัวตน" };
        }

        const token = authHeader.split(' ')[1];
        try {
            const payload = await jwt.verify(token) as JWTPayloadUser;
            if (!payload) {
                set.status = 401;
                return { success: false, message: "Invalid token" };
            }

            const existingUser = await prisma.users.findUnique({
                where: { id: payload.id },
            });

            if (!existingUser) {
                set.status = 404;
                return {
                    success: false,
                    message: "User not found",
                };
            }

            let profilepictureName = undefined;

            if (body.profilepicture) {
                const file = body.profilepicture;

                const oldFilePath = `public/images/user_images/${existingUser.profilepicture}`;
                try {
                    if (existingUser.profilepicture !== "default-profile.jpg") {
                        await unlink(oldFilePath);
                    }
                    const fileName = `${payload.id}-${Date.now()}${path.extname(file.name)}`;
                    const filePath = `public/images/user_images/${fileName}`;
                    await Bun.write(filePath, await file.arrayBuffer());
                    profilepictureName = fileName;

                } catch (error) {
                    console.error(`Error deleting file: ${error}`);
                }
            }

            const updateData: any = {
                firstname: body.firstname,
                lastname: body.lastname,
                email: body.email,
                tel: body.tel,
            };

            if (profilepictureName) {
                updateData.profilepicture = profilepictureName;
            }

            if (body.currentPassword && body.newPassword) {
                const user = await prisma.users.findUnique({
                    where: { id: payload.id }
                });

                if (!user) {
                    set.status = 404;
                    return { success: false, message: "User not found" };
                }

                const isPasswordValid = await Bun.password.verify(body.currentPassword, user.password);
                if (!isPasswordValid) {
                    set.status = 400;
                    return { success: false, message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
                }

                const hashedPassword = await Bun.password.hash(body.newPassword, {
                    algorithm: "bcrypt",
                    cost: 4,
                });
                updateData.password = hashedPassword;
            }

            const updatedUser = await prisma.users.update({
                where: { id: payload.id },
                data: updateData
            });

            const { password, ...userWithoutPassword } = updatedUser;

            return {
                success: true,
                message: "อัปเดตข้อมูลโปรไฟล์สำเร็จ",
                user: userWithoutPassword
            };
        } catch (error) {
            console.log(error);
            set.status = 500;
            return {
                success: false,
                message: `Something went wrong: ${(error as Error).message}`
            };
        }
    }, {
        body: t.Object({
            firstname: t.String(),
            lastname: t.String(),
            email: t.String(),
            tel: t.String(),
            profilepicture: t.Optional(t.File()),
            currentPassword: t.Optional(t.String()),
            newPassword: t.Optional(t.String())
        })
    })
    .put("/update-user-status/:status", async ({ headers, jwt, set, params: { status } }) => {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            set.status = 401;
            return { success: false, message: "ไม่พบ Token การยืนยันตัวตน" };
        }
        const token = authHeader.split(' ')[1];
        try {
            const payload = await jwt.verify(token) as JWTPayloadUser;
            if (!payload) {
                set.status = 401;
                return { success: false, message: "Invalid token" };
            }
            const updateLastStatus = await prisma.users.update({
                data: {
                    usage_status: status,
                    statuslastupdate: getThaiDate()
                },
                where: {
                    id: payload.id
                }
            })
            if (!updateLastStatus) {
                set.status = 404;
                return {
                    success: false,
                    message: "authenticator fail"
                };
            }
            set.status = 200;
            return {
                success: true,
                message: `update userId:${payload.id}\nstatus: ${status} success`
            };
        } catch (error) {
            set.status = 500;
            return {
                success: false,
                message: `Something went wrong: ${(error as Error).message}`
            };
        }
    }, {
        params: t.Object({
            status: t.Enum(usage_status),
        })
    })


export default app;