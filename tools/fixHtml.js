import { load } from 'cheerio';
import fs from 'fs/promises';

function fixElement(els) {

}
function elementNeedToFix(els) {
    let invalidTags = ["em", "strong"]
    if (els.length === 1 && invalidTags.includes(els[0].tagName)) {
        return true
    }
    return false
}
async function fixHtml(htmlFilePath) {
    try {
        const html = await fs.readFile(htmlFilePath, 'utf-8');
        const $ = load(html);

        // console.log($('body').html())
        // get first level children of body
        let firstLevelElements = $('body').children();
        while (elementNeedToFix(firstLevelElements)) {
            firstLevelElements = firstLevelElements.children();
        }
        // console.log(firstLevelElements.html())
        // if(firstLevelElements.length === ) {
        //     console.log('No first level elements found in body.');
        //     return;
        // }
        const validHtmlContainer = $("<div/>")
        for (const firstLevelEl of firstLevelElements) {
            validHtmlContainer.append($(firstLevelEl));
            // console.log(firstLevelEl.tagName)
            // console.log(firstLevelElements.html())
        }
        // console.log(validHtmlContainer.html())
        return validHtmlContainer.html();

    } catch (error) {
        console.error(`Error fixing HTML file: ${error.message}`);
    }
}
fixHtml('./html-split-outputs/page-37.html').catch((e) => console.error(e)); // Replace with your HTML file path