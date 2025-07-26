import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises'
import path from 'path';
const INPUT_PDF = 'testFs.pdf'     // your source file
const OUTPUT_DIR = './pdf-pages' // output folder
async function splitPdf(inputPath, outputPathPrefix) {
    const parsedPath = path.parse(inputPath);
    const fileNameWithoutExtension = parsedPath.name;
    const realOutputDir = path.join(OUTPUT_DIR, fileNameWithoutExtension);
    try {
        await fs.mkdir(realOutputDir, { recursive: true })
        // Load the existing PDF document
        const existingPdfBytes = await fs.readFile(inputPath);
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
            const outputPath = `${realOutputDir}/${outputPathPrefix}-${i + 1}.pdf`;
            await fs.writeFile(outputPath, pdfBytes);
            console.log(`Page ${i + 1} saved to ${outputPath}`);

            // Convert each PDF page to markdown

        }
    } catch (error) {
        console.error('Error splitting PDF:', error);
    }
}
