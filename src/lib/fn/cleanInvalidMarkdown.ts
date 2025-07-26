export function cleanInvalidMarkdown(text: string) {
  return (
    text
      // hapus bold dan italic yang dipasangkan dengan teks di antaranya
      .replace(/\*\*(.*?)\*\*/g, "$1") // bold
      .replace(/\*(.*?)\*/g, "$1") // italic
      .replace(/__(.*?)__/g, "$1") // bold underline
      .replace(/_(.*?)_/g, "$1") // italic underscore
      .replace(/`(.*?)`/g, "$1") // inline code
      .replace(/~~(.*?)~~/g, "$1") // strikethrough

      // hapus gambar markdown
      .replace(/!\[.*?\]\(.*?\)/g, "")
      // hapus link markdown, sisakan teksnya saja
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")

      // hapus header (#) markdown
      .replace(/^#{1,6}\s*(.*)/gm, "$1")

      // hapus list bullets di awal baris
      .replace(/^(\s*[-*+>]\s+)/gm, "")

      // hapus ** yang berdiri sendiri tanpa teks (misal setelah replace sebelumnya tersisa)
      .replace(/\*\*/g, "")
      // hapus * yang berdiri sendiri tanpa teks
      .replace(/\*/g, "")

      // hapus underscore _ yang berdiri sendiri
      .replace(/_/g, "")
  )
}
