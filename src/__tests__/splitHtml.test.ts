import { expect, it } from "vitest"
import fs from "fs"
import { splitHtml } from "../lib/fn/splitHtml"
it("splitHtml", async () => {
  console.log(`cwd:${__dirname}`)
  const htmlInputFilePath = `${__dirname}/../../auxiliary/large_file.html`
  let resultFiles: string[] = []
  if (fs.existsSync(htmlInputFilePath)) {
    console.log(`Processing: ${htmlInputFilePath}`)
    resultFiles = await splitHtml(htmlInputFilePath)
    console.log({ resultFiles })
  }
  expect(resultFiles.length).eq(3)
  for (const file of resultFiles) {
    expect(fs.existsSync(file)).toBeTruthy()
  }
})
