import fs from "fs"
import path from "path"
import dotenv from "dotenv"

dotenv.config()
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE ?? "1000", 10)
const CHUNK_RESULTS_DIR = process.env.CHUNK_RESULTS_DIR || "./chunk_results"

// Ensure the chunk results directory exists
const ensureChunkResultsDir = async () => {
  if (!fs.existsSync(CHUNK_RESULTS_DIR)) {
    await fs.promises.mkdir(CHUNK_RESULTS_DIR, { recursive: true })
  }
}

export const readFileInChunks = async (filePath: string) => {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, "utf8")
    let chunks = []
    let chunk = ""

    stream.on("data", (data) => {
      chunk += data
      while (chunk.length > CHUNK_SIZE) {
        const splitIndex = chunk.lastIndexOf(" ", CHUNK_SIZE)
        if (splitIndex === -1) {
          chunks.push(chunk.slice(0, CHUNK_SIZE))
          chunk = chunk.slice(CHUNK_SIZE)
        } else {
          chunks.push(chunk.slice(0, splitIndex))
          chunk = chunk.slice(splitIndex + 1)
        }
      }
    })

    stream.on("end", () => {
      if (chunk) chunks.push(chunk)
      resolve(chunks)
    })

    stream.on("error", (error) => {
      reject(new Error(`Error reading file: ${error.message}`))
    })
  })
}

export const writeOutputFile = async (outputPath: string, content: string) => {
  return fs.promises.writeFile(outputPath, content, "utf8")
}

export const getChunkFilePath = (filePath: string, chunkIndex: number) => {
  const fileName = path.basename(filePath)
  return path.join(
    CHUNK_RESULTS_DIR,
    `${fileName}.chunk${chunkIndex}.${filePath.split(".").pop() ?? "txt"}`
  )
}

export const readChunkResult = async (chunkFilePath: string) => {
  try {
    const data = await fs.promises.readFile(chunkFilePath, "utf8")
    return data.trim()
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return null
    }
    throw error
  }
}

export const writeChunkResult = async (
  chunkFilePath: string,
  result: string
) => {
  await ensureChunkResultsDir()
  await fs.promises.writeFile(chunkFilePath, result, "utf8")
}

export const deleteChunkResults = async (filePath: string) => {
  const fileName = path.basename(filePath)
  const chunkFiles = await fs.promises.readdir(CHUNK_RESULTS_DIR)
  for (const file of chunkFiles) {
    if (file.startsWith(fileName)) {
      await fs.promises.unlink(path.join(CHUNK_RESULTS_DIR, file))
    }
  }
}
