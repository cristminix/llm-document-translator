import chromium from "@sparticuz/chromium";

// split-html-pages.js
import fs from 'fs/promises'
import puppeteer from 'puppeteer'

const INPUT_HTML = 'inputs/chapter-4.xhtml'     // your source file
const OUTPUT_DIR = './output-pages' // output folder
const PAGE_HEIGHT = 600 // A4 at 96 DPI
// Optional: If you'd like to use the new headless mode. "shell" is the default.
chromium.setHeadlessMode = true;
// Optional: If you'd like to disable webgl, true is the default.
chromium.setGraphicsMode = false;
// loading html file content 

async function generatePdf() {
    let htmlContent = await fs.readFile(INPUT_HTML, 'utf8');
    let pdfBuffer;
    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
    });
    console.log(browser);
    const page = await browser.newPage();
    const loaded = page.waitForNavigation({
        waitUntil: 'load'
    });
    await page.setContent(htmlContent);
    await loaded;
    pdfBuffer = await page.pdf({ width: 600, height: 600 });
    console.log(`[INFO] Pdf Is Generated Successfully`);
    // Write the PDF buffer to the specified file path
    const filePath = 'testFs.pdf';
    await fs.writeFile(filePath, pdfBuffer);
    console.log('[INFO] SSPDF file saved successfully:', filePath);
    await browser.close();
}
generatePdf();