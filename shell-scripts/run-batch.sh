#!/bin/bash

HTML_INPUT_DIR="/media/cristminix/Data/projects/safaribooks-master/Books/Software Testing with Generative AI (9781633437364)/OEBPS"
HTML_OUTPUT_DIR="${HTML_INPUT_DIR}/translated"

mkdir -p "${HTML_OUTPUT_DIR}"
# ln -ns -s "${HTML_INPUT_DIR}/Images" "${HTML_OUTPUT_DIR}/Images"
# ln -ns -s "${HTML_INPUT_DIR}/Styles" "${HTML_OUTPUT_DIR}/Styles"

for html_file in "${HTML_INPUT_DIR}"/*.xhtml; do
  file_name=$(basename "${html_file}")
  html_file="${HTML_INPUT_DIR}/${file_name}"
  html_output_file="${HTML_OUTPUT_DIR}/${file_name%.xhtml}.html"
  echo "Processing ${html_file} \n--> to ${html_output_file}"
  npx vite-node src/main.ts -f "${html_file}" -t "id" -s splitPdf -o "${html_output_file}"
  # break
done