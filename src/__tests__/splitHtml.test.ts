import { expect, it } from "vitest"
import fs from "fs"
import { splitHtml } from "../lib/fn/splitHtml"
it("splitHtml", async () => {
  console.log(`cwd:${__dirname}`)
  const htmlInputFilePath = `${__dirname}/../../auxiliary/ch10.xhtml`
  let resultFiles: string[] = []
  if (fs.existsSync(htmlInputFilePath)) {
    console.log(`Processing: ${htmlInputFilePath}`)
    resultFiles = await splitHtml(htmlInputFilePath)
    console.log({ resultFiles })
  } else {
    console.error(`File not found: ${htmlInputFilePath}`)
  }
  expect(resultFiles.length).eq(53)
  for (const file of resultFiles) {
    expect(fs.existsSync(file)).toBeTruthy()
  }
})
