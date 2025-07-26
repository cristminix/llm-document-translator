import {
  getChunkFilePath,
  readChunkResult,
  writeChunkResult,
} from "./fileHandler"
import { runLLM } from "./llmService"

export const translateMarkdown = async (
  markdownContent: string,
  targetLanguage: string,
  baseUrl: string,
  apiKey: string,
  modelName: string,
  filePath: string
) => {
  const chunks = markdownContent.split("\n")
  const translatedChunks = []
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const chunkFilePath = getChunkFilePath(filePath, i)
    let translatedChunk = await readChunkResult(chunkFilePath)
    if (!translatedChunk) {
      const isValidText = /\w/.test(chunk.trim()) // Check if the text contains valid words
      if (isValidText) {
        console.log(`Processing chunk: "${chunk}"`)
        translatedChunk = await runLLM(
          baseUrl,
          apiKey,
          modelName,
          chunk,
          targetLanguage
        )
        console.log(`Translated chunk: "${translatedChunk}"`)
        //@ts-ignore

        await writeChunkResult(chunkFilePath, translatedChunk)
      } else {
        console.log(`Skipping chunk: "${chunk}" (invalid text)`)
        translatedChunk = chunk // Keep the original text if invalid
      }
    }
    translatedChunks.push(translatedChunk)
  }
  return translatedChunks.join("\n")
}
