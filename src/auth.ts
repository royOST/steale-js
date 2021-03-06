import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs';
import { log } from './util/log';
import { getBrowser } from './util/util';
import settings from './settings.json';
import 'source-map-support/register'; // Error handling showing typescript lines

(async () => {
    let username;
    let password;

    if (process.env.RBX_USER != null && process.env.RBX_PASS != null) {
        username = process.env.RBX_USER;
        password = process.env.RBX_PASS;
    } else {
        if (process.argv[2] != null && process.argv[3] != null) {
            username = process.argv[2];
            password = process.argv[3];
        } else {
            log.error('Environment Variables RBX_USER and RBX_PASS must be defined or username/password must be passed in as the first and second arguments');
            process.exit();
        }
    }

    log.info(`Attempting sign in as ${username}`);

    const browser: Browser = await getBrowser(false);
    const page = await browser.newPage();
    await page.goto(`${settings.baseUrl}/login`);
    // await page.screenshot({ path: 'example.png' });
    await page.type('#login-username', username);
    await page.type('#login-password', password);
    await page.click('#login-button');
    try {
        await page.waitForNavigation();
        await page.goto(`${settings.baseUrl}/catalog/20573078`); // Visit arbitrary item and gather cookies
        await saveCookies(page);
        log.debug('Cookies saved');
    } catch (e) {
        log.error('verification blows', e);
    }

    await browser.close();
})();

async function saveCookies(page: puppeteer.Page) {
    const cookies = await page.cookies();

    fs.writeFileSync('./cookies.json', JSON.stringify(cookies, null, 4));
}
