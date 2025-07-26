import { translateText } from "./translateText.js"
export const translateTextWithLogging = async (
  text: string,
  targetLanguage: string,
  baseUrl: string,
  apiKey: string,
  modelName: string,
  filePath: string,
  chunkIndex: number
) => {
  return translateText(
    text,
    targetLanguage,
    baseUrl,
    apiKey,
    modelName,
    filePath,
    chunkIndex
  )
}
