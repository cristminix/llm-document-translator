import { promisify } from 'util'
import { exec } from 'child_process'
import path from 'path';
import fs from 'fs/promises';
const execAsync = promisify(exec);
const INPUT_PDF = './pdf-pages/testFs/output-1.pdf'     // your source file
const OUTPUT_DIR = './markdown-outputs' // output folder
async function convertPdfToMarkdown(inputFile) {
    const parsedPath = path.parse(inputFile);
    const fileNameWithoutExtension = parsedPath.name;
    const realOutputDir = path.join(OUTPUT_DIR, fileNameWithoutExtension);
    const command = `markitdown ${inputFile} -o ${realOutputDir}/${fileNameWithoutExtension}.md`;

    try {
        await fs.mkdir(realOutputDir, { recursive: true })

        const { stdout, stderr } = await execAsync(command);
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
        } else {
            console.log(`Stdout: ${stdout}`);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

// Contoh penggunaan
convertPdfToMarkdown(INPUT_PDF);