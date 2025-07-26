import fs from "fs/promises"
import path from "path"
import puppeteer from "puppeteer"
// const execAsync = promisify(exec);
const PAGE_HEIGHT = 600 // A4 at 96 DPI

const WORKING_DIR = process.env.WORKING_DIR ?? "./working_dir"

const OUTPUT_DIR = `${WORKING_DIR}/html-split-outputs` // output folder
//
export async function splitHtml(htmlFilePath: string) {
  // properly make output-dir by basename of htmlFilePath
  const OUTPUT_DIR_BY_FILE = `${OUTPUT_DIR}/${path.basename(htmlFilePath)}`
  const resultFiles = []
  try {
    await fs.mkdir(OUTPUT_DIR_BY_FILE, { recursive: true })
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    const page = await browser.newPage()
    const INPUT_HTML = htmlFilePath
    const html = await fs.readFile(INPUT_HTML, "utf-8")
    console.log({ html })
    await page.setContent(html, { waitUntil: "load" })
    // Listen for console events in the browser context
    page.on("console", (msg) => {
      // Print the console message from the page context to Node.js console
      console.log(`PAGE LOG: ${msg.text()}`)
    })
    const pages = await page.evaluate((PAGE_HEIGHT) => {
      // Cari elemen kontainer utama terbesar
      console.log("Finding main container...")
      function findMainContainer() {
        const body = document.body
        let largest: Element = body

        /*
        let maxHeight = 0
        for (const el of body.children) {
          const h = el.getBoundingClientRect().height
          if (h > maxHeight) {
            largest = el
            maxHeight = h
          }
        }
        console.log(
          `Main container found: ${largest.tagName} with height ${maxHeight}px`
        )
          */
        return largest
      }

      // Fungsi mengukur tinggi elemen termasuk margin atas/bawah
      function getHeight(el: Element) {
        const r = el.getBoundingClientRect()
        const cs = window.getComputedStyle(el)
        return r.height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom)
      }

      // Fungsi untuk membelah (split) elemen yang terlalu besar (rekursif ke anak-anaknya)
      function splitLargeElement(el: Element, PAGE_HEIGHT: number) {
        const children = Array.from(el.children)
        // Kalau tidak ada child, dipaksa potong walau terlalu tinggi
        if (!children.length) return [[el.outerHTML]]

        const pages = []
        let current = []
        let height = 0

        for (const child of children) {
          const h = getHeight(child)
          if (h > PAGE_HEIGHT) {
            // Coba split lebih dalam (rekursif)
            const tempDiv: Element = document.createElement("div")
            tempDiv.appendChild(child.cloneNode(true))
            document.body.appendChild(tempDiv)
            const firstChild = tempDiv.firstChild as Element
            const subpages = splitLargeElement(firstChild, PAGE_HEIGHT)
            document.body.removeChild(tempDiv)
            if (current.length > 0) {
              pages.push(current)
              current = []
              height = 0
            }
            pages.push(...subpages)
            continue
          }
          if (height + h > PAGE_HEIGHT && current.length > 0) {
            pages.push(current)
            current = []
            height = 0
          }
          current.push(child.outerHTML)
          height += h
        }
        if (current.length > 0) pages.push(current)
        // Bungkus dengan tag container-nya agar struktur tetap utuh
        const wrappedPages: any = pages.map((pageArr) => {
          const wrapper: Element = el.cloneNode(false) as Element
          wrapper.innerHTML = pageArr.join("")
          return [wrapper.outerHTML]
        })
        return wrappedPages
      }

      // Algoritma utama split halaman
      const container = findMainContainer()
      const blocks = Array.from(container.children)
      const resultPages = []
      let current = []
      let height = 0

      for (const el of blocks) {
        const h = getHeight(el)
        // Jika elemen terlalu tinggi untuk satu halaman, coba split children-nya
        if (h > PAGE_HEIGHT) {
          // Split isi elemen jika memungkinkan
          const tempDiv = document.createElement("div")
          tempDiv.appendChild(el.cloneNode(true))
          document.body.appendChild(tempDiv)
          const firstChild = tempDiv.firstChild as Element
          const splitPages = splitLargeElement(firstChild, PAGE_HEIGHT)
          document.body.removeChild(tempDiv)
          if (current.length > 0) {
            resultPages.push(current)
            current = []
            height = 0
          }
          resultPages.push(...splitPages.map((pg: any) => pg)) // masukkan hasil split per halaman
          continue
        }

        if (height + h > PAGE_HEIGHT && current.length > 0) {
          resultPages.push(current)
          current = []
          height = 0
        }
        current.push(el.outerHTML)
        height += h
      }
      if (current.length > 0) resultPages.push(current)

      return resultPages
    }, PAGE_HEIGHT)
    console.log({ pages })
    // Hasil `pages` adalah array array HTML—masing-masing adalah kumpulan string HTML elemen untuk setiap halaman.

    for (let i = 0; i < pages.length; i++) {
      const content = `
        ${pages[i].join("\n")}
    `
      const file = `${OUTPUT_DIR_BY_FILE}/page-${i + 1}.html`
      resultFiles.push(file)
      await fs.writeFile(file, content)
      console.log(`✅ Wrote ${file}`)
    }

    await browser.close()
  } catch (error) {
    console.error(error)
  }

  return resultFiles
}
