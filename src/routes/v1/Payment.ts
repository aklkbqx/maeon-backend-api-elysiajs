import { Elysia, t } from 'elysia';
import { payments_payment_method, payments_status, PrismaClient } from '@prisma/client';
import { jwt } from '@elysiajs/jwt';
import generatePayload from 'promptpay-qr';
import { getThaiDate, JWTPayloadUser } from '../../../lib/lib';
import { chromium } from 'playwright';

const prisma = new PrismaClient();
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
    throw new Error('SECRET_KEY is not defined.');
}

const PROMPTPAY_ID = '0902856188';
const TOKEN_CHECKSLIP_API = "423c7651-e037-4278-928c-d8a5520ef49b";
const BANK_ACCOUNT_NUMBER = "";
const BANK_NAME = ""


const app = new Elysia()
    .use(jwt({ name: 'jwt', secret: SECRET_KEY }))
    // .ws('/ws', {
    //     open(ws) {
    //         console.log('WebSocket connection opened');
    //     },
    //     message(ws, message) {
    //         const data = JSON.parse(message as string);
    //         if (data.type === 'register' && data.booking_id) {
    //             wsClients.set(data.booking_id, ws);
    //             console.log(`Client registered for booking ${data.booking_id}`);
    //         } else if (data.type === 'admin_register') {
    //             adminWsClients.add(ws);
    //             console.log('Admin client registered');
    //         }
    //     },
    //     close(ws) {
    //         for (const [bookingId, client] of wsClients.entries()) {
    //             if (client === ws) {
    //                 wsClients.delete(bookingId);
    //                 console.log(`Client unregistered for booking ${bookingId}`);
    //                 break;
    //             }
    //         }
    //         adminWsClients.delete(ws);
    //     }
    // })
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
        return { payloadUser }
    })
    .post("/initiate-payment", async ({ body, set, payloadUser }) => {
        if (!payloadUser) {
            set.status = 401;
            return { success: false, message: "token ไม่ถูกต้อง" };
        }
        try {
            const { booking_id, payment_method } = body;

            const booking = await prisma.bookings.findUnique({
                where: { id: booking_id, user_id: payloadUser.id }
            });

            if (!booking) {
                set.status = 404;
                return { success: false, message: "ไม่พบการจอง" };
            }

            if (booking.payment_status === 'PAID') {
                set.status = 400;
                return { success: false, message: "ชำระเงินจองเรียบร้อยแล้ว" };
            }

            const amount = booking.total_price.toNumber();

            let paymentData: any = {};
            let responseData: any = {
                amount: amount,
                ref: `BOOKING-${booking.id}`
            };

            switch (payment_method) {
                case 'PROMPTPAY':
                    const payload = generatePayload(PROMPTPAY_ID, { amount });
                    paymentData.qr_code_data = payload;
                    paymentData.promptpay_id = PROMPTPAY_ID;
                    responseData.qr_code = payload;
                    break;

                case 'BANK_TRANSFER':
                    paymentData.bank_account_number = BANK_ACCOUNT_NUMBER
                    paymentData.bank_name = BANK_NAME
                    responseData.bank_account_number = paymentData.bank_account_number;
                    responseData.bank_name = paymentData.bank_name;
                    break;

                default:
                    set.status = 400;
                    return { success: false, message: "วิธีการชำระเงินไม่ถูกต้อง" };
            }

            const payment = {
                booking_id: booking.id,
                amount: amount,
                payment_method: payment_method as payments_payment_method,
                payment_data: JSON.stringify(paymentData),
                status: payments_status.PENDING,
                transaction_id: `${payment_method}-${booking.id}-${Date.now()}`,
                payment_date: new Date(),
                slip_image: ''
            };

            const createdPayment = await prisma.payments.create({ data: payment });

            return {
                success: true,
                message: `การเริ่มชำระเงินสำเร็จแล้วสำหรับ ${payment_method}`,
                data: {
                    ...responseData,
                    payment_id: createdPayment.id
                }
            };
        } catch (error) {
            set.status = 500;
            console.error(error);
            return {
                success: false,
                message: "เกิดข้อผิดพลาดขณะเริ่มการชำระเงิน",
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }, {
        body: t.Object({
            booking_id: t.Number(),
            payment_method: t.Enum(payments_payment_method)
        })
    })
    .post("/confirm-payment", async ({ body, set, payloadUser }) => {
        if (!payloadUser) {
            set.status = 401;
            return { success: false, message: "token ไม่ถูกต้อง" };
        }
        try {
            const receiver = {
                displayName: "นาย เอกลักษณ์ เครือบูรณ์",
                name: "Mr. Akalak Kruaboon",
                account: {
                    value: "XXX-X-XX588-0"
                }
            }
            const { booking_id, refNbr, amount } = body;

            const booking = await prisma.bookings.findUnique({
                where: { id: booking_id, user_id: payloadUser.id }
            });

            //refNbr = 0038000600000101030060217Ac7f46595a5bf497d5102TH9104CE6D
            if (!booking) {
                set.status = 404;
                return { success: false, message: "ไม่พบการจอง" };
            }

            if (booking.payment_status === 'PAID') {
                set.status = 400;
                return { success: false, message: "ชำระเงินไปแล้ว" };
            }

            if (booking.total_price.toNumber() !== amount) {
                set.status = 400;
                return { success: false, message: "จำนวนเงินไม่ตรงกับยอดที่ต้องชำระ" };
            }

            const payment = await prisma.payments.findFirst({
                where: { booking_id: booking.id }
            });

            if (!payment) {
                set.status = 404;
                return { success: false, message: "ไม่พบข้อมูลการชำระเงิน" };
            }

            await prisma.payments.update({
                where: { id: payment.id },
                data: {
                    status: 'PENDING_VERIFICATION',
                    transaction_id: refNbr,
                    payment_date: new Date()
                }
            });

            if (!refNbr) {
                return { success: false, message: "ไม่สามารถตรวจสอบสลิปได้ กรุณาอัพโหลดสลิปมาใหม่อีกครั้ง" }
            }

            let remainingChecks = await getRemainingChecks();

            if (!remainingChecks) {
                set.status = 404;
                return { success: false, message: "ไม่พบจำนวนการตรวจสอบสลิปที่เหลือ" };
            }

            if (remainingChecks <= 2) {
                console.log("จำนวนตรวจสอบที่เหลืออยู่ในระดับต่ำ กำลังรีเซ็ต...");
                remainingChecks = await resetSlipCheckCount();
                await updateRemainingChecks(remainingChecks);
            }


            const checkSlip = async (refNbr: string, amount: number, token: string) => {
                try {
                    const response = await fetch("https://api.openslipverify.com/", {
                        method: "POST",
                        headers: {
                            "Content-Type": " application/json"
                        },
                        body: JSON.stringify({
                            refNbr, amount, token
                        })
                    })
                    const jsonData = await response.json();
                    if (!jsonData) {
                        throw new Error(jsonData.msg);
                    }
                    return jsonData
                } catch (error) {
                    set.status = 500;
                    console.error(error);
                    return {
                        success: false,
                        message: "เกิดข้อผิดพลาดในการตรวจสอบสลิป กรุณาลองอีกครั้งในภายหลัง",
                        error: error instanceof Error ? error.message : String(error)
                    };
                }
            }

            const datacheckslip = await checkSlip(refNbr, amount, TOKEN_CHECKSLIP_API);
            await updateRemainingChecks(remainingChecks - 1);

            if (datacheckslip.success) {
                const apiReceiver = datacheckslip.data.receiver;
                const compareStrings = (str1: string, str2: string) => {
                    return str1.replace(/\s/g, '').toLowerCase() === str2.replace(/\s/g, '').toLowerCase();
                };
                const isDisplayNameMatch = compareStrings(receiver.displayName, apiReceiver.displayName);
                const isNameMatch = compareStrings(receiver.name, apiReceiver.name);
                const isAccountMatch = receiver.account.value === apiReceiver.account.value;

                if (isDisplayNameMatch && isNameMatch && isAccountMatch) {
                    await prisma.payments.update({
                        where: { id: payment.id },
                        data: {
                            status: 'PAID',
                            transaction_id: refNbr,
                            payment_date: getThaiDate()
                        }
                    });

                    await prisma.bookings.update({
                        where: { id: booking_id },
                        data: {
                            payment_status: 'PAID'
                        }
                    });

                    return {
                        success: true,
                        message: "การชำระเงินเสร็จสมบูรณ์ และข้อมูลผู้รับเงินถูกต้อง",
                        data: datacheckslip.data
                    };
                } else {
                    return {
                        success: false,
                        message: "ข้อมูลผู้รับเงินไม่ตรงกับที่ระบุในระบบ กรุณาตรวจสอบและติดต่อเจ้าหน้าที่",
                        mismatch: {
                            displayName: !isDisplayNameMatch,
                            name: !isNameMatch,
                            account: !isAccountMatch
                        }
                    };
                }
            } else {
                return {
                    success: false,
                    message: "ไม่สามารถตรวจสอบสลิปได้ กรุณาลองใหม่อีกครั้งหรือติดต่อเจ้าหน้าที่",
                    error: datacheckslip.msg
                };
            }
        } catch (error) {
            set.status = 500;
            console.error(error);
            return {
                success: false,
                message: "An error occurred while uploading the slip",
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }, {
        body: t.Object({
            booking_id: t.Number(),
            refNbr: t.String(),
            amount: t.Number()
        })
    })

async function resetSlipCheckCount() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await context.addCookies([{
        name: "token",
        value: "%7B%22meta%22%3A%7B%22id%22%3A%22100114105496192568430%22%2C%22name%22%3A%22TasKyFLow%20On%20da%20track%22%2C%22username%22%3A%22%22%2C%22email%22%3A%22aekhher%40gmail.com%22%2C%22avatarUrl%22%3A%22https%3A%2F%2Flh3.googleusercontent.com%2Fa%2FACg8ocKEBQkdyouPKf_v-TwhG1ScbiuyeTR6P7-aSFSUnAg7q752ejvG%3Ds96-c%22%2C%22accessToken%22%3A%22ya29.a0AcM612yJtkYFtg75ZoPcSmLzjmL4yTRMBpwLMDu6KtsHH3Mf7tNKgRiRSBYWt0ZK4AsiiF5h-_QJBAWUIjBSbidQROs2qefhtMUywkiQ5rvfzIxk_jGNM93haiJf8JQETgFeNrP09q8DsULOqID2lDVzterDBLIIGwaCgYKAQESARISFQHGX2MiX14JzfRALzWjjq9WyQAFQg0169%22%2C%22refreshToken%22%3A%22%22%2C%22expiry%22%3A%222024-09-30%2017%3A41%3A40.167Z%22%2C%22rawUser%22%3A%7B%22email%22%3A%22aekhher%40gmail.com%22%2C%22family_name%22%3A%22On%20da%20track%22%2C%22given_name%22%3A%22TasKyFLow%22%2C%22id%22%3A%22100114105496192568430%22%2C%22name%22%3A%22TasKyFLow%20On%20da%20track%22%2C%22picture%22%3A%22https%3A%2F%2Flh3.googleusercontent.com%2Fa%2FACg8ocKEBQkdyouPKf_v-TwhG1ScbiuyeTR6P7-aSFSUnAg7q752ejvG%3Ds96-c%22%2C%22verified_email%22%3Atrue%7D%2C%22isNew%22%3Afalse%7D%2C%22record%22%3A%7B%22collectionId%22%3A%22_pb_users_auth_%22%2C%22collectionName%22%3A%22users%22%2C%22created%22%3A%222024-09-30%2015%3A33%3A37.944Z%22%2C%22email%22%3A%22aekhher%40gmail.com%22%2C%22emailVisibility%22%3Afalse%2C%22id%22%3A%22shuav38pankgvug%22%2C%22name%22%3A%22%22%2C%22updated%22%3A%222024-09-30%2016%3A04%3A49.050Z%22%2C%22username%22%3A%22users74689%22%2C%22verified%22%3Atrue%7D%2C%22token%22%3A%22eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJfcGJfdXNlcnNfYXV0aF8iLCJleHAiOjE3Mjg5MjQxMDEsImlkIjoic2h1YXYzOHBhbmtndnVnIiwidHlwZSI6ImF1dGhSZWNvcmQifQ.mSs-333Nbq_5NbL4gfkd5WC-MMb5-o-BHlOXwGjxisI%22%7D",
        domain: "dev.openslipverify.com",
        path: "/"
    }]);

    await page.goto("https://dev.openslipverify.com/Dashboard");

    const buttonSelector = 'button[class="py-3 self-end px-4 inline-flex gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-blue-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 dark:text-blue-500"]';

    for (let i = 0; i < 50; i++) {
        await page.reload();
        await page.waitForLoadState('networkidle');

        const value = await page.evaluate(() => {
            const elements = document.querySelectorAll('p[class="text-3xl font-semibold text-blue-600"]');
            return elements.length >= 3 ? elements[2].textContent : null;
        });

        console.log(`Loop ${i + 1}: Current value = ${value}`);

        if (value === '10') {
            console.log("Target value reached. Stopping loop.");
            break;
        }

        try {
            await page.click(buttonSelector, { timeout: 1000 });
            console.log("Button clicked.");
        } catch (error) {
            console.log(`Loop ${i + 1}: Button click failed`);
        }

        await page.waitForTimeout(2000);
    }
    await browser.close();
    return 10;
}
async function updateRemainingChecks(remaining_checks: number) {
    await prisma.slip_check_count.update({
        where: { id: 1 },
        data: { remaining_checks: remaining_checks }
    });
    console.log(`Updated remaining checks to ${remaining_checks}`);
}

async function getRemainingChecks() {
    const result = await prisma.slip_check_count.findFirst();
    return result?.remaining_checks
}

export default app;