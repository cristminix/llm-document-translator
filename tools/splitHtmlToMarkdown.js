import { promisify } from 'util'
import { exec } from 'child_process'
import path from 'path';
import fs from 'fs/promises';
import puppeteer from 'puppeteer'
import chromium from "@sparticuz/chromium";
import { PDFDocument } from 'pdf-lib';

const execAsync = promisify(exec);
const INPUT_HTML = 'inputs/chapter-4.xhtml'     // your source file
const OUTPUT_MARKDOWN_DIR = './markdown-outputs' // output folder
const OUTPUT_PDF_DIR = './output-pages' // output folder
//
export async function splitHtmlToMarkdown(htmlFilePath) {
    const htmlInputBasename = path.parse(htmlFilePath).name;
    const fullPdfOutputFilePath = `${OUTPUT_PDF_DIR}/${htmlInputBasename}.pdf`;

    const resultFiles = [];
    let successGeneratePdf = false;
    // split html into pdf
    console.log(`Generating PDF from HTML...`);
    try {
        let htmlContent = await fs.readFile(htmlFilePath, 'utf8');
        let pdfBuffer;
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

        await fs.writeFile(fullPdfOutputFilePath, pdfBuffer);
        console.log('[INFO] SSPDF file saved successfully:', fullPdfOutputFilePath);
        await browser.close();
        successGeneratePdf = true;
    } catch (error) {
        console.error(`[ERROR] Failed to generate PDF from HTML: ${error.message}`);
        return resultFiles; // Return empty if PDF generation fails
    }
    if (successGeneratePdf) {
        // loop trough output pages
        try {
            const splittedPdfOutputDir = path.join(OUTPUT_PDF_DIR, htmlInputBasename);
            if (!fs.existsSync(splittedPdfOutputDir)) {
                await fs.mkdir(splittedPdfOutputDir, { recursive: true })
            }
            // Load the existing PDF document
            const existingPdfBytes = await fs.readFile(fullPdfOutputFilePath);
            const pdfDoc = await PDFDocument.load(existingPdfBytes);

            const numPages = pdfDoc.getPages().length;

            for (let i = 0; i < numPages; i++) {
                // Create a new document for each page
                const subDocument = await PDFDocument.create();

                // Copy the page from the original document
                const [copiedPage] = await subDocument.copyPages(pdfDoc, [i]);
                subDocument.addPage(copiedPage);

                // Save the new document as a separate PDF
                const pdfBytes = await subDocument.save();
                const outputPath = `${splittedPdfOutputDir}/part-${i + 1}.pdf`;
                await fs.writeFile(outputPath, pdfBytes);
                console.log(`Page ${i + 1} saved to ${outputPath}`);



                const markdownFilename = path.parse(outputPath).name;
                console.log(`[INFO] Converting PDF page ${i + 1} to Markdown...`);

                const markdownOutputDir = path.join(OUTPUT_MARKDOWN_DIR, htmlInputBasename);
                if (!fs.existsSync(markdownOutputDir)) {
                    await fs.mkdir(splittedPdfOutputDir, { recursive: true })
                }
                const outputMarkdownPath = `${markdownOutputDir}/${markdownFilename}.md`
                const command = `markitdown ${outputPath} -o ${outputMarkdownPath}`;

                try {
                    await fs.mkdir(markdownOutputDir, { recursive: true })

                    const { stdout, stderr } = await execAsync(command);
                    if (stderr) {
                        console.error(`Stderr: ${stderr}`);
                    } else {
                        console.log(`Stdout: ${stdout}`);
                    }
                    resultFiles.push(outputMarkdownPath);
                } catch (error) {
                    console.error(`Error: ${error.message}`);
                }
            }
        } catch (error) {
            console.error('Error splitting PDF:', error);
        }
    }
    return resultFiles;
}
splitHtmlToMarkdown(INPUT_HTML).catch(console.error);