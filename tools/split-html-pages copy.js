// split-html-pages.js
import fs from 'fs/promises'
import puppeteer from 'puppeteer'

const INPUT_HTML = 'inputs/chapter-4.xhtml'     // your source file
const OUTPUT_DIR = './output-pages' // output folder
const PAGE_HEIGHT = 600 // A4 at 96 DPI

async function run() {
    await fs.mkdir(OUTPUT_DIR, { recursive: true })
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    const html = await fs.readFile(INPUT_HTML, 'utf-8')
    await page.setContent(html, { waitUntil: 'load' })

    const pages = await page.evaluate((PAGE_HEIGHT) => {
        function findMainContainer() {
            const body = document.body
            let largest = body
            let maxHeight = 0
            for (const el of body.children) {
                const h = el.getBoundingClientRect().height
                if (h > maxHeight) {
                    largest = el
                    maxHeight = h
                }
            }
            return largest
        }

        const container = findMainContainer()
        const blocks = Array.from(container.children)

        const resultPages = []
        let current = []
        let height = 0

        const getHeight = (el) => {
            const r = el.getBoundingClientRect()
            const cs = window.getComputedStyle(el)
            return r.height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom)
        }

        for (const el of blocks) {
            const h = getHeight(el)

            if (h > PAGE_HEIGHT) {
                if (current.length > 0) {
                    resultPages.push(current)
                    current = []
                    height = 0
                }
                resultPages.push([el.outerHTML]) // too big, force one-page
                continue
            }

            if (height + h > PAGE_HEIGHT) {
                resultPages.push(current)
                current = []
                height = 0
            }

            current.push(el.outerHTML)
            height += h
        }

        if (current.length > 0) {
            resultPages.push(current)
        }

        return resultPages
    }, PAGE_HEIGHT)

    for (let i = 0; i < pages.length; i++) {
        const content = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><style>body { margin: 0; }</style></head>
      <body>
        ${pages[i].join('\n')}
      </body>
      </html>
    `
        const file = `${OUTPUT_DIR}/page-${i + 1}.html`
        await fs.writeFile(file, content)
        console.log(`✅ Wrote ${file}`)
    }

    await browser.close()
}

run().catch(console.error)