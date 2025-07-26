import {
  getChunkFilePath,
  readChunkResult,
  writeChunkResult,
} from "./fileHandler"
import { runLLM } from "./llmService"

export const translateText = async (
  text: string,
  targetLanguage: string,
  baseUrl: string,
  apiKey: string,
  modelName: string,
  filePath: string,
  chunkIndex: number
) => {
  const chunkFilePath = getChunkFilePath(filePath, chunkIndex)
  let translatedText = await readChunkResult(chunkFilePath)
  if (!translatedText) {
    const isValidText = /\w/.test(text.trim()) // Check if the text contains valid words
    if (isValidText) {
      console.log(`Processing chunk: "${text}"`)
      translatedText = await runLLM(
        baseUrl,
        apiKey,
        modelName,
        text,
        targetLanguage
      )
      console.log(`Translated chunk: "${translatedText}"`)
      //@ts-ignore

      await writeChunkResult(chunkFilePath, translatedText)
    } else {
      console.log(`Skipping chunk: "${text}" (invalid text)`)
      translatedText = text // Keep the original text if invalid
    }
  }
  return translatedText
}
