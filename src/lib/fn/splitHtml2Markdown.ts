import { promisify } from "util"
import { exec } from "child_process"
import path from "path"
import fs from "fs/promises"
import fs2 from "fs"
import puppeteer from "puppeteer"
import chromium from "@sparticuz/chromium"
import { PDFDocument } from "pdf-lib"

const execAsync = promisify(exec)
const WORKING_DIR = process.env.WORKING_DIR ?? "./working_dir"

const OUTPUT_MARKDOWN_DIR = `${WORKING_DIR}/markdown-outputs` // output folder

const OUTPUT_PDF_DIR = `${WORKING_DIR}/output-pages` // output folder
//
export async function splitHtml2Markdown(htmlFilePath: string) {
  const htmlInputBasename = path.parse(htmlFilePath).name
  const fullPdfOutputFilePath = `${OUTPUT_PDF_DIR}/${htmlInputBasename}.pdf`

  const resultFiles: string[] = []
  let successGeneratePdf = false
  // split html into pdf
  if (fs2.existsSync(fullPdfOutputFilePath)) {
    successGeneratePdf = true
    console.log(`Skip Generating file exist ${fullPdfOutputFilePath}.`)
  } else {
    console.log(`Generating PDF from HTML...`)
    try {
      let htmlContent = await fs2.readFileSync(htmlFilePath, "utf8")
      let pdfBuffer
      const browser = await puppeteer.launch({
        args: chromium.args,
        //@ts-ignore
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        //@ts-ignore

        headless: chromium.headless,
      })
      const page = await browser.newPage()
      const loaded = page.waitForNavigation({
        waitUntil: "load",
      })
      await page.setContent(htmlContent)
      await loaded
      pdfBuffer = await page.pdf({ width: 600, height: 600 })
      console.log(`[INFO] Pdf Is Generated Successfully`)
      // Write the PDF buffer to the specified file path

      await fs2.writeFileSync(fullPdfOutputFilePath, pdfBuffer)
      console.log(
        "[INFO] SSPDF file saved successfully:",
        fullPdfOutputFilePath
      )
      await browser.close()
      successGeneratePdf = true
    } catch (error: any) {
      console.error(
        `[ERROR] Failed to generate PDF from HTML: ${error.message}`
      )
      return resultFiles // Return empty if PDF generation fails
    }
  }
  if (successGeneratePdf) {
    // loop trough output pages
    try {
      const splittedPdfOutputDir = path.join(OUTPUT_PDF_DIR, htmlInputBasename)
      if (!fs2.existsSync(splittedPdfOutputDir)) {
        await fs2.mkdirSync(splittedPdfOutputDir, { recursive: true })
      }
      // Load the existing PDF document
      const existingPdfBytes = await fs2.readFileSync(fullPdfOutputFilePath)
      const pdfDoc = await PDFDocument.load(existingPdfBytes)

      const numPages = pdfDoc.getPages().length

      for (let i = 0; i < numPages; i++) {
        // Create a new document for each page
        const splittedPdfOutputPath = `${splittedPdfOutputDir}/part-${
          i + 1
        }.pdf`

        if (!fs2.existsSync(splittedPdfOutputPath)) {
          const subDocument = await PDFDocument.create()

          // Copy the page from the original document
          const [copiedPage] = await subDocument.copyPages(pdfDoc, [i])
          subDocument.addPage(copiedPage)

          // Save the new document as a separate PDF
          const pdfBytes = await subDocument.save()
          await fs2.writeFileSync(splittedPdfOutputPath, pdfBytes)
          console.log(`Page ${i + 1} saved to ${splittedPdfOutputPath}`)
        } else {
          console.log(
            `Skip split pdf, file already exists: ${splittedPdfOutputPath}`
          )
        }

        const markdownFilename = path.parse(splittedPdfOutputPath).name
        const markdownOutputDir = path.join(
          OUTPUT_MARKDOWN_DIR,
          htmlInputBasename
        )
        if (!fs2.existsSync(markdownOutputDir)) {
          await fs2.mkdirSync(splittedPdfOutputDir, { recursive: true })
        }
        const outputMarkdownPath = `${markdownOutputDir}/${markdownFilename}.md`

        if (!fs2.existsSync(outputMarkdownPath)) {
          const command = `markitdown ${splittedPdfOutputPath} -o ${outputMarkdownPath}`
          console.log(`[INFO] Converting PDF page ${i + 1} to Markdown...`)

          try {
            //@ts-ignore

            await fs.mkdir(markdownOutputDir, { recursive: true })

            const { stdout, stderr } = await execAsync(command)
            if (stderr) {
              console.error(`Stderr: ${stderr}`)
            } else {
              console.log(`Stdout: ${stdout}`)
            }
            resultFiles.push(outputMarkdownPath)
          } catch (error: any) {
            console.error(`Error: ${error.message}`)
          }
        } else {
          console.log(
            `Skip converting, file already exists: ${outputMarkdownPath}`
          )
          resultFiles.push(outputMarkdownPath)
        }
      }
    } catch (error) {
      console.error("Error splitting PDF:", error)
    }
  }
  return resultFiles
}
