import mkdirp from "mkdirp";
import Puppeteer from "puppeteer";

async function main() {
  try {
    mkdirp.sync(`${__dirname}/screenshot`);

    const browser = await Puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto(`file://${__dirname}/landing-page/public/index.html`);

    await page.setViewport({
      width: 1440,
      height: 600,
    });
    await page.waitFor(500);
    await page.screenshot({ path: `${__dirname}/screenshot/index_desktop.png`, fullPage: true });

    await page.setViewport({
      width: 1044,
      height: 768,
    });
    await page.waitFor(500);
    await page.screenshot({ path: `${__dirname}/screenshot/index_tablet.png`, fullPage: true });

    await page.setViewport({
      width: 375,
      height: 767,
    });
    await page.waitFor(500);
    await page.screenshot({ path: `${__dirname}/screenshot/index_mobile.png`, fullPage: true });

    await page.close();
    await new Promise(res => setTimeout(res, 50));
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
