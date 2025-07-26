import dotenv from "dotenv"
import {
  readFileInChunks,
  writeOutputFile,
  getChunkFilePath,
  readChunkResult,
  writeChunkResult,
  deleteChunkResults,
} from "./lib/fn/fileHandler"
import { translateTextWithLogging } from "./lib/fn/translationService"
import { translateMarkdown } from "./lib/fn/translateMarkdown"
import { translateHtml } from "./lib/fn/translateHtml"
import path, { join } from "path"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
dotenv.config()

import fs from "fs/promises"
const apiKey = process.env.API_KEY
const baseUrl = process.env.BASE_URL
const modelName = process.env.MODEL_NAME

const translateChunks = async (
  chunks: string,
  targetLanguage: string,
  filePath: string
) => {
  const translatedChunks = []
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const chunkFilePath = getChunkFilePath(filePath, i)
    let translatedChunk = await readChunkResult(chunkFilePath)
    if (!translatedChunk) {
      translatedChunk = await translateTextWithLogging(
        chunk,
        targetLanguage,
        //@ts-ignore
        baseUrl,
        apiKey,
        filePath,
        modelName,
        i
      )
      //@ts-ignore
      await writeChunkResult(chunkFilePath, translatedChunk)
    }
    translatedChunks.push(translatedChunk)
  }
  return translatedChunks.join(" ")
}

const main = async () => {
  let argv: any = process.argv
  //   console.log({ argv })
  /*if (process.argv.length === 3) {
    const prompt = process.argv[1]
    // display prompt to console
    console.log({ prompt })
  } else {
    */
  argv = yargs(hideBin(process.argv))
    .option("f", {
      alias: "file",
      describe: "Path to the input file",
      type: "string",
      demandOption: true,
    })
    .option("t", {
      alias: "target",
      describe: "Target language for translation (e.g., en, id, es)",
      type: "string",
      demandOption: true,
    })
    .option("o", {
      alias: "output",
      describe: "Path to the output file",
      type: "string",
      demandOption: true,
    })
    .help().argv

  //@ts-ignore
  const { file: filePath, target: targetLanguage, output: outputPath } = argv

  try {
    const fileExtension = path.extname(filePath)
    if (
      fileExtension !== ".html" &&
      fileExtension !== ".xhtml" &&
      fileExtension !== ".txt" &&
      fileExtension !== ".md"
    ) {
      console.log("Only .html, .xhtml, .txt, and .md files are supported.")
      return
    }

    const chunks: string[] = (await readFileInChunks(filePath)) as string[]
    let translatedContent: string = ""
    let continueProcess = false

    if (fileExtension === ".html" || fileExtension === ".xhtml") {
      // const htmlContent = await fs.readFile(filePath, 'utf-8')
      translatedContent = await translateHtml(
        filePath,
        targetLanguage,
        //@ts-ignore
        baseUrl,
        apiKey,
        modelName
      )
      continueProcess = true
    } else if (fileExtension === ".md") {
      console.log("Not implemented")
      return
      const markdownContent = chunks.join("")
      translatedContent = await translateMarkdown(
        markdownContent,
        targetLanguage,
        //@ts-ignore
        baseUrl,
        apiKey,
        modelName,
        filePath
      )
    } else {
      console.log("Not implemented")
      return
      translatedContent = await translateChunks(
        chunks.join(""),
        targetLanguage,
        filePath
      )
    }
    if (continueProcess) await writeOutputFile(outputPath, translatedContent)
    console.log(`Translation completed and saved to ${outputPath}`)

    // Delete chunk results after translation is complete
    // await deleteChunkResults(filePath);
  } catch (error: any) {
    console.error(error.message)
  }
  //   }
}
main()
