import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const MAX_RETRIES = parseInt(process.env.MAX_RETRIES ?? "3")
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY ?? "1000")
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS ?? "1000")

/**
 * Sends a request to the LLM API and returns the response with retry mechanism.
 *
 * @param {string} baseUrl - The base URL of the LLM API.
 * @param {string} apiKey - The API key for authentication.
 * @param {string} modelName - The name of the model to use.
 * @param {string} userInput - The user's input to send to the LLM.
 * @param {string} targetLanguage - The target language for translation.
 * @returns {Promise<string>} The LLM's response (translated content).
 */
export const runLLM = async (
  baseUrl: string,
  apiKey: string,
  modelName: string,
  userInput: string,
  targetLanguage: string
) => {
  // console.log({
  //     userInput, targetLanguage, baseUrl, apiKey, modelName
  // })
  let retries = 0

  const makeRequest = async () => {
    try {
      const promptTemplate =
        process.env.PROMPT_TEMPLATE ||
        "Translate the following content to {{targetLanguage}}:\n\n{{userInput}}"
      const prompt = promptTemplate
        .replace("{{targetLanguage}}", targetLanguage)
        .replace("{{userInput}}", userInput)
      console.log(`${baseUrl}/chat/completions`)
      const response = await axios.post(
        `${baseUrl}/chat/completions`,
        {
          model: modelName,
          messages: [{ role: "user", content: prompt }],
          max_tokens: MAX_TOKENS,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      )
      return response.data.choices[0].message.content.trim()
    } catch (error: any) {
      if (retries < MAX_RETRIES) {
        retries++
        console.log(`Request failed. Retrying (${retries}/${MAX_RETRIES})...`)
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
        return makeRequest()
      } else {
        throw new Error(
          `Error running LLM after ${MAX_RETRIES} retries: ${error.message}`
        )
      }
    }
  }

  return makeRequest()
}
