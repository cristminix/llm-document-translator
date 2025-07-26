# PURPOSE

Translate large html file into different language

# Installation

```bash
pnpm i

```

# Setup env

Edit environment variable by copyng `.env.example` to `.env` then configure your LLM and other config.

```bash
# Your LLM API KEY
API_KEY=your_api_key_here
# Your LLM ENDPOINT
BASE_URL=http://127.0.0.1:1337/v1
# Your LLM MODEL NAME
MODEL_NAME=command-a:HuggingSpace
# MODEL_NAME=gpt-4:Blackbox

# Max retry on failed llm request api
MAX_RETRIES=5
# Delay next request after failed attempt
RETRY_DELAY=1000
# Chunk size allowed input translatable by your llm without lilmitation output token result
CHUNK_SIZE=2048
# Translation prompt user message content
PROMPT_TEMPLATE="Translate the following content to {{targetLanguage}}.\nDont provide additional information except the result. :\n\n{{userInput}}"

# max_tokens LLM config
MAX_TOKENS=2048

# Current working directory to store temporary files
WORKING_DIR=./working_dir

```

# Usage

`npx vite-node src/main.ts  -f <input_file> -t <lang> -o <outpu_file>`

```
// Display usage
npx vite-node src/main.ts

// Example usage
npx vite-node src/main.ts  -f inputs/large_file.html -t id -o working_dir/outputs/large_file_translated.html

```

# Limitation

Currently support html file only. Always check splited file located in `<WORKING_DIR>/html-split-outputs/<input_fil_basename>/page-N.html`.

# Modify template

`src/lib/translateHtml.ts`

```typescript
...
const html=`<html lang="en" xml:lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.w3.org/2002/06/xhtml2/ http://www.w3.org/MarkUp/SCHEMA/xhtml2.xsd" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
<link href="Styles/Style00.css" rel="stylesheet" type="text/css" />
<link href="Styles/Style01.css" rel="stylesheet" type="text/css" />

<style type="text/css">
 pre strong{
    white-space: pre;
    display: block;
    margin: 0;
    padding: 0;
} strong{font-weight:bold} em{font-style:normal}  body{margin:1em;background-color:transparent!important;}#sbo-rt-content *{text-indent:0pt!important;}#sbo-rt-content .bq{margin-right:1em!important;}#sbo-rt-content *{word-wrap:break-word!important;word-break:break-word!important;}#sbo-rt-content table,#sbo-rt-content pre{overflow-x:unset!important;overflow:unset!important;overflow-y:unset!important;white-space:pre-wrap!important;}</style></head>
<body><div id="sbo-rt-content"><div class="readable-text" id="p1">${body}</div></div></body></html>`


...


```
