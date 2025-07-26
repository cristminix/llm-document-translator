import dotenv from 'dotenv';
import { readFileInChunks, writeOutputFile, getChunkFilePath, readChunkResult, writeChunkResult, deleteChunkResults } from './fileHandler.js';
import { translateTextWithLogging, translateHtml, translateMarkdown } from './translationService.js';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs/promises';
dotenv.config();

const argv = yargs(hideBin(process.argv))
    .option('f', {
        alias: 'file',
        describe: 'Path to the input file',
        type: 'string',
        demandOption: true
    })
    .option('t', {
        alias: 'target',
        describe: 'Target language for translation (e.g., en, id, es)',
        type: 'string',
        demandOption: true
    })
    .option('o', {
        alias: 'output',
        describe: 'Path to the output file',
        type: 'string',
        demandOption: true
    })
    .help()
    .argv;

const apiKey = process.env.API_KEY;
const baseUrl = process.env.BASE_URL;
const modelName = process.env.MODEL_NAME;

const translateChunks = async (chunks, targetLanguage, filePath) => {
    const translatedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkFilePath = getChunkFilePath(filePath, i);
        let translatedChunk = await readChunkResult(chunkFilePath);
        if (!translatedChunk) {
            translatedChunk = await translateTextWithLogging(chunk, targetLanguage, baseUrl, apiKey, modelName);
            await writeChunkResult(chunkFilePath, translatedChunk);
        }
        translatedChunks.push(translatedChunk);
    }
    return translatedChunks.join(' ');
};

const main = async () => {
    const { file: filePath, target: targetLanguage, output: outputPath } = argv;

    try {
        const fileExtension = path.extname(filePath);
        if (fileExtension !== '.html' && fileExtension !== '.xhtml' && fileExtension !== '.txt' && fileExtension !== '.md') {
            console.log('Only .html, .xhtml, .txt, and .md files are supported.');
            return;
        }

        const chunks = await readFileInChunks(filePath);
        let translatedContent;

        if (fileExtension === '.html' || fileExtension === '.xhtml') {
            // const htmlContent = await fs.readFile(filePath, 'utf-8')
            translatedContent = await translateHtml(filePath, targetLanguage, baseUrl, apiKey, modelName, filePath);
        } else if (fileExtension === '.md') {
            const markdownContent = chunks.join('');
            translatedContent = await translateMarkdown(markdownContent, targetLanguage, baseUrl, apiKey, modelName, filePath);
        } else {
            translatedContent = await translateChunks(chunks, targetLanguage, filePath);
        }

        await writeOutputFile(outputPath, translatedContent);
        console.log(`Translation completed and saved to ${outputPath}`);

        // Delete chunk results after translation is complete
        // await deleteChunkResults(filePath);
    } catch (error) {
        console.error(error.message);
    }
};
main()