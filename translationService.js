import { runLLM } from './llmService.js';
import { parse, serialize } from 'parse5';
import { getChunkFilePath, readChunkResult, writeChunkResult } from './fileHandler.js';
import path from 'path';
import { splitHtml } from './splitHtml.js';
import { splitHtml2Markdown } from './splitHtml2Markdown.js';
import fs from 'fs/promises';
import fs2 from 'fs';
import { marked } from 'marked';

import { fixHtml } from './fixHtml.js';
function removeMd(text) {
    return text
        // hapus bold dan italic yang dipasangkan dengan teks di antaranya
        .replace(/\*\*(.*?)\*\*/g, '$1')   // bold
        .replace(/\*(.*?)\*/g, '$1')       // italic
        .replace(/__(.*?)__/g, '$1')       // bold underline
        .replace(/_(.*?)_/g, '$1')         // italic underscore
        .replace(/`(.*?)`/g, '$1')         // inline code
        .replace(/~~(.*?)~~/g, '$1')       // strikethrough

        // hapus gambar markdown
        .replace(/!\[.*?\]\(.*?\)/g, '')
        // hapus link markdown, sisakan teksnya saja
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')

        // hapus header (#) markdown
        .replace(/^#{1,6}\s*(.*)/gm, '$1')

        // hapus list bullets di awal baris
        .replace(/^(\s*[-*+>]\s+)/gm, '')

        // hapus ** yang berdiri sendiri tanpa teks (misal setelah replace sebelumnya tersisa)
        .replace(/\*\*/g, '')
        // hapus * yang berdiri sendiri tanpa teks
        .replace(/\*/g, '')

        // hapus underscore _ yang berdiri sendiri
        .replace(/_/g, '');
}
export const translateText = async (text, targetLanguage, baseUrl, apiKey, modelName, filePath, chunkIndex) => {
    const chunkFilePath = getChunkFilePath(filePath, chunkIndex);
    let translatedText = await readChunkResult(chunkFilePath);
    if (!translatedText) {
        const isValidText = /\w/.test(text.trim()); // Check if the text contains valid words
        if (isValidText) {
            console.log(`Processing chunk: "${text}"`);
            translatedText = await runLLM(baseUrl, apiKey, modelName, text, targetLanguage);
            console.log(`Translated chunk: "${translatedText}"`);
            await writeChunkResult(chunkFilePath, translatedText);
        } else {
            console.log(`Skipping chunk: "${text}" (invalid text)`);
            translatedText = text; // Keep the original text if invalid
        }
    }
    return translatedText;
};

export const translateTextWithLogging = async (text, targetLanguage, baseUrl, apiKey, modelName, filePath, chunkIndex) => {
    return translateText(text, targetLanguage, baseUrl, apiKey, modelName, filePath, chunkIndex);
};
export const translateHtml = async (htmlInputFilePath, targetLanguage, baseUrl, apiKey, modelName) => {

    const resultFiles = await splitHtml(htmlInputFilePath)
    console.log(`Splitted HTML into ${resultFiles.length} chunks.`);

    const translatedChunks = [];
    for (let chunkIndex = 0; chunkIndex < resultFiles.length; chunkIndex++) {


        const markdownFilePath = resultFiles[chunkIndex];
        const content = await fs.readFile(markdownFilePath, 'utf-8');
        const chunkFilePath = getChunkFilePath(htmlInputFilePath, chunkIndex);

        if (!fs2.existsSync(chunkFilePath)) {
            console.log(`Processing chunk: "${content}"`);
            const translatedText = await runLLM(baseUrl, apiKey, modelName, content, targetLanguage);

            console.log(`Translated chunk: "${translatedText}"`);
            await writeChunkResult(chunkFilePath, translatedText);
            translatedChunks.push(removeMd(await fixHtml(chunkFilePath)));


        } else {
            // const test = await fs.readFile(`${chunkFilePath}`, 'utf-8');
            // console.log(`Test read: ${test}`);

            translatedChunks.push(removeMd(await fixHtml(chunkFilePath)));

        }
        // console.log({ chunkFilePath })



    }
    const body = translatedChunks.join('\n');
    const html = `<!DOCTYPE html>
<html lang="en" xml:lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.w3.org/2002/06/xhtml2/ http://www.w3.org/MarkUp/SCHEMA/xhtml2.xsd" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
<link href="Styles/Style00.css" rel="stylesheet" type="text/css" />

<style type="text/css">
 pre strong{
    white-space: pre;
    display: block;
    margin: 0;
    padding: 0;
} strong{font-weight:bold} em{font-style:normal} li em{font-weight:bold} body{margin:1em;background-color:transparent!important;}#sbo-rt-content *{text-indent:0pt!important;}#sbo-rt-content .bq{margin-right:1em!important;}#sbo-rt-content *{word-wrap:break-word!important;word-break:break-word!important;}#sbo-rt-content table,#sbo-rt-content pre{overflow-x:unset!important;overflow:unset!important;overflow-y:unset!important;white-space:pre-wrap!important;}</style></head>
<body><div id="sbo-rt-content"><div class="readable-text" id="p1">${body}</div></div></body></html>`;

    return html;

};
export const translateHtmlOld = async (htmlContent, targetLanguage, baseUrl, apiKey, modelName, filePath) => {
    const document = parse(htmlContent);
    const walk = async (node, chunkIndex = 0) => {
        if (node.nodeName === '#text' && node.value.trim()) {
            const chunkFilePath = getChunkFilePath(filePath, chunkIndex);
            let translatedText = await readChunkResult(chunkFilePath);
            if (!translatedText) {
                const isValidText = /\w/.test(node.value.trim()); // Check if the text contains valid words
                if (isValidText) {
                    console.log(`Processing chunk: "${node.value}"`);
                    translatedText = await runLLM(baseUrl, apiKey, modelName, node.value, targetLanguage);
                    console.log(`Translated chunk: "${translatedText}"`);
                    await writeChunkResult(chunkFilePath, translatedText);
                } else {
                    console.log(`Skipping chunk: "${node.value}" (invalid text)`);
                    translatedText = node.value; // Keep the original text if invalid
                }
            }
            node.value = translatedText;
            chunkIndex++;
        }
        if (node.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
                await walk(node.childNodes[i], chunkIndex + i);
            }
        }
    };
    await walk(document);
    return serialize(document);
};

export const translateMarkdown = async (markdownContent, targetLanguage, baseUrl, apiKey, modelName, filePath) => {
    const chunks = markdownContent.split('\n');
    const translatedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkFilePath = getChunkFilePath(filePath, i);
        let translatedChunk = await readChunkResult(chunkFilePath);
        if (!translatedChunk) {
            const isValidText = /\w/.test(chunk.trim()); // Check if the text contains valid words
            if (isValidText) {
                console.log(`Processing chunk: "${chunk}"`);
                translatedChunk = await runLLM(baseUrl, apiKey, modelName, chunk, targetLanguage);
                console.log(`Translated chunk: "${translatedChunk}"`);
                await writeChunkResult(chunkFilePath, translatedChunk);
            } else {
                console.log(`Skipping chunk: "${chunk}" (invalid text)`);
                translatedChunk = chunk; // Keep the original text if invalid
            }
        }
        translatedChunks.push(translatedChunk);
    }
    return translatedChunks.join('\n');
};
