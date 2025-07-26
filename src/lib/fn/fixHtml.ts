import { type Cheerio, load } from "cheerio"
import fs from "fs/promises"
import { Element } from "domhandler"

function elementNeedToFix(els: Cheerio<Element>) {
  let invalidTags = ["em", "strong"]
  if (els.length === 1 && invalidTags.includes(els[0].tagName)) {
    return true
  }
  return false
}
export async function fixHtml(htmlFilePath: string) {
  try {
    const html = await fs.readFile(htmlFilePath, "utf-8")
    const $ = load(html)
    let firstLevelElements = $("body").children()
    while (elementNeedToFix(firstLevelElements)) {
      firstLevelElements = firstLevelElements.children()
    }

    const validHtmlContainer = $("<div/>")
    for (const firstLevelEl of firstLevelElements) {
      validHtmlContainer.append($(firstLevelEl))
    }
    return validHtmlContainer.html()
  } catch (error: any) {
    console.error(`Error fixing HTML file: ${error.message}`)
  }
}
