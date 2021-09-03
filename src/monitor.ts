import { performance } from 'perf_hooks';
import { getItemPrice, readCookies, sleep } from './util/util';
import { buy, moneySpent } from './buy';
import { log, logOnly, transactions } from './util/log';
import 'source-map-support/register'; // Error handling showing typescript lines

const productId = '20573078'; // shaggy
const avgPrice = 1119; // !! NEVER USE AVERAGE PRICE, ex: avg price 3137 for perf legit business hat, value: 6000
const profitMarginPercent = 0; // The average price is an estimate in any case, so this can be 0

const priceCutPercent = 0.30; // Roblox take's 30% cut of transactions
let errorCount = 0;

const cookies = readCookies();

(async () => {
    log.info(`Monitoring item https://www.roblox.com/catalog/${productId}`);

    while (errorCount <= 5 && moneySpent < 10000) {
        try {
            await monitor();
        } catch (e) {
            errorCount++;
            log.error(`Had an issue (${errorCount}): `, e);

            await sleep(5000 * errorCount); // Had an issue, waiting it out for 5 seconds per error count
        }
    }
    log.fatal(`Too many errors (${errorCount}), time to take a nap`);
})();

async function monitor() {
    const start = performance.now();

    const lowestPrice = await getItemPrice(`https://www.roblox.com/catalog/${productId}`);
    if (lowestPrice !== undefined && lowestPrice != 0) {
        const potentialProfit = Math.floor((avgPrice * (1 - priceCutPercent - profitMarginPercent)) - lowestPrice); // 30% cut along with extra margins
        if (potentialProfit > 0) {
            transactions.debug(`Buying item for ${lowestPrice}. Profit: `, potentialProfit);

            try {
                await buy(productId, lowestPrice, cookies, potentialProfit);
            } catch (e) {
                transactions.error('Error buying item; did we miss it?', e);
            }
        }

        if (errorCount > 0) {
            errorCount--; // Each success lowers error count
        }
    } else {
        log.error('Expected price of 0?');
    }

    const end = performance.now();
    logOnly.info(`Took ${end - start} miliseconds`);
}
