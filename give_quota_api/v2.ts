import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';

interface VerificationResult {
    success: boolean;
    msg: string;
}

async function verifySlip(imagePath: string, amount: string): Promise<VerificationResult> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
        browser = await chromium.launch({ headless: false });
        page = await browser.newPage();
        await page.goto('https://openslipverify.com/');

        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
            await fileInput.setInputFiles(imagePath);
        } else {
            throw new Error('ไม่พบช่องอัปโหลดไฟล์');
        }

        await page.fill('input[placeholder="จำนวนเงิน"]', amount);
        await page.waitForSelector('button:not([disabled])', { state: 'attached' });

        let attempt = 0;
        while (true) {
            attempt++;
            console.log(`ความพยายามครั้งที่ ${attempt}`);
            await page.click('button:has-text("ตรวจสลิป")');
            await page.waitForSelector('code', { state: 'attached', timeout: 10000 });
            await page.waitForFunction(() => {
                const codeElement = document.querySelector('code');
                return codeElement && codeElement.textContent && codeElement.textContent !== '{}';
            }, { timeout: 10000 });

            const resultText = await page.$eval('code', (el) => el.textContent);

            if (resultText) {
                const result: VerificationResult = JSON.parse(resultText);
                console.log(`ผลลัพธ์ (ครั้งที่ ${attempt}):`, result);

                if (result.msg !== "กรุณาใช้งาน Demo Application ผ่านหน้าเว็บไซต์เท่านั้น") {
                    return result;
                }
            }
            await page.waitForTimeout(2000);
            await page.waitForSelector('button:not([disabled])', { state: 'attached' });
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error);
        throw error;
    } finally {
        if (page) await page.close();
        if (browser) await browser.close();
    }
}

const imagePath = path.join(__dirname, 'public/images/qrcode_payment/2-1728447295957.jpg');
const amount = '1';

verifySlip(imagePath, amount)
    .then((result) => console.log('ผลลัพธ์สุดท้าย:', result))
    .catch((error) => console.error('เกิดข้อผิดพลาด:', error));