import fs2 from "fs"
import fs from "fs/promises"
import { getChunkFilePath, writeChunkResult } from "./fileHandler"
import { fixHtml } from "./fixHtml"
import { runLLM } from "./llmService"
import { cleanInvalidMarkdown } from "./cleanInvalidMarkdown"
import { splitHtml } from "./splitHtml"

export const translateHtml = async (
  htmlInputFilePath: string,
  targetLanguage: string,
  baseUrl: string,
  apiKey: string,
  modelName: string
) => {
  const resultFiles = await splitHtml(htmlInputFilePath)
  console.log(`Splitted HTML into ${resultFiles.length} chunks.`)

  const translatedChunks = []
  for (let chunkIndex = 0; chunkIndex < resultFiles.length; chunkIndex++) {
    const markdownFilePath = resultFiles[chunkIndex]
    const content = await fs.readFile(markdownFilePath, "utf-8")
    const chunkFilePath = getChunkFilePath(htmlInputFilePath, chunkIndex)

    if (!fs2.existsSync(chunkFilePath)) {
      console.log(`Processing chunk: "${content}"`)
      const translatedText = await runLLM(
        baseUrl,
        apiKey,
        modelName,
        content,
        targetLanguage
      )

      console.log(`Translated chunk: "${translatedText}"`)
      await writeChunkResult(chunkFilePath, translatedText)
      //@ts-ignore

      translatedChunks.push(cleanInvalidMarkdown(await fixHtml(chunkFilePath)))
    } else {
      // const test = await fs.readFile(`${chunkFilePath}`, 'utf-8');
      // console.log(`Test read: ${test}`);
      //@ts-ignore

      translatedChunks.push(cleanInvalidMarkdown(await fixHtml(chunkFilePath)))
    }
    // console.log({ chunkFilePath })
  }
  const body = translatedChunks.join("\n")
  const html = `<!DOCTYPE html>
<html lang="en" xml:lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.w3.org/2002/06/xhtml2/ http://www.w3.org/MarkUp/SCHEMA/xhtml2.xsd" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
<link href="Styles/Style00.css" rel="stylesheet" type="text/css" />
<link href="Styles/Style01.css" rel="stylesheet" type="text/css" />

<style type="text/css">
 pre strong{
    white-space: pre;
    display: block;
    margin: 0;
    padding: 0;
} strong{font-weight:bold} em{font-style:normal}  body{margin:1em;background-color:transparent!important;}#sbo-rt-content *{text-indent:0pt!important;}#sbo-rt-content .bq{margin-right:1em!important;}#sbo-rt-content *{word-wrap:break-word!important;word-break:break-word!important;}#sbo-rt-content table,#sbo-rt-content pre{overflow-x:unset!important;overflow:unset!important;overflow-y:unset!important;white-space:pre-wrap!important;}</style></head>
<body><div id="sbo-rt-content"><div class="readable-text" id="p1">${body}</div></div></body></html>`

  return html
}
