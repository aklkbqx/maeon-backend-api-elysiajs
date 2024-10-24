import { chromium } from "playwright";

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

    for (let i = 0; i < 20; i++) {
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