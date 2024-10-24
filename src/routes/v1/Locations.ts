import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const app = new Elysia()
    .get("types", async ({ set }) => {
        try {
            const location_type = await prisma.location_types.findMany()
            return {
                success: true,
                location_type
            }
        } catch (error) {
            set.status = 500;
            console.error(error);
            return {
                success: false,
                message: "เกิดข้อผิดพลาดในการดึงหมวดหมู่สถานที่",
                error: error instanceof Error ? error.message : String(error)
            };
        }
    });


export default app;