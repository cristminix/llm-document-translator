import { promisify } from 'util'
import { exec } from 'child_process'
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer'
import chromium from "@sparticuz/chromium";
import { PDFDocument } from 'pdf-lib';
import pdf2html from 'pdf2html';
const execAsync = promisify(exec);

const OUTPUT_SPLIT_HTML_DIR = './html-split-outputs' // output folder
const OUTPUT_PDF_DIR = './output-pages' // output folder
//
export async function splitHtml(htmlFilePath) {
    const htmlInputBasename = path.parse(htmlFilePath).name;
    const fullPdfOutputFilePath = `${OUTPUT_PDF_DIR}/${htmlInputBasename}.pdf`;

    const resultFiles = [];
    let successGeneratePdf = false;
    let pdfBuffer
    // split html into pdf
    if (fs.existsSync(fullPdfOutputFilePath)) {
        successGeneratePdf = true;
        console.log(`Skip Generating file exist ${fullPdfOutputFilePath}.`);

    } else {
        console.log(`Generating PDF from HTML...`);
        try {
            let htmlContent = await fs.readFileSync(htmlFilePath, 'utf8');
            const browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
            });
            const page = await browser.newPage();
            const loaded = page.waitForNavigation({
                waitUntil: 'load'
            });
            await page.setContent(htmlContent);
            await loaded;
            pdfBuffer = await page.pdf({ width: 600, height: 600 });
            console.log(`[INFO] Pdf Is Generated Successfully`);
            // Write the PDF buffer to the specified file path

            await fs.writeFileSync(fullPdfOutputFilePath, pdfBuffer);
            console.log('[INFO] SSPDF file saved successfully:', fullPdfOutputFilePath);
            await browser.close();
            successGeneratePdf = true;
        } catch (error) {
            console.error(`[ERROR] Failed to generate PDF from HTML: ${error.message}`);
            return resultFiles; // Return empty if PDF generation fails
        }
    }
    if (successGeneratePdf) {
        // loop trough output pages
        try {
            if (!pdfBuffer) {
                pdfBuffer = await fs.readFileSync(fullPdfOutputFilePath);

            }
            const splittedHtmlOutputDir = path.join(OUTPUT_SPLIT_HTML_DIR, htmlInputBasename);
            const splitedHtmlPages = await pdf2html.pages(pdfBuffer);
            if (!fs.existsSync(splittedHtmlOutputDir)) {
                await fs.mkdirSync(splittedHtmlOutputDir, { recursive: true })
            }


            const numPages = splitedHtmlPages.length;

            for (let pageNumber = 0; pageNumber < numPages; pageNumber++) {
                // Create a new document for each page
                const splittedHtmlOutputPath = `${splittedHtmlOutputDir}/page-${pageNumber + 1}.html`;

                if (!fs.existsSync(splittedHtmlOutputPath)) {

                    // Save the new document as a separate PDF
                    const htmlContent = splitedHtmlPages[pageNumber];
                    await fs.writeFileSync(splittedHtmlOutputPath, htmlContent);
                    console.log(`Page ${pageNumber + 1} saved to ${splittedHtmlOutputPath}`);



                } else {
                    console.log(`Skip split html page ${pageNumber}, file already exists: ${splittedHtmlOutputPath}`);
                }

                resultFiles.push(splittedHtmlOutputPath);

            }
        } catch (error) {
            console.error('Error splitting html :', error);
        }
    }
    return resultFiles;
}