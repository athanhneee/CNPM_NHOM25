export function downloadTextFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportRowsToCsv(
  fileName: string,
  rows: Array<Record<string, string | number | boolean | null | undefined>>,
) {
  const firstRow = rows[0]
  if (!firstRow) {
    return
  }

  const headers = Object.keys(firstRow)
  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const rawValue = row[header]
          const normalized = rawValue === null || rawValue === undefined ? '' : String(rawValue)
          return `"${normalized.replaceAll('"', '""')}"`
        })
        .join(','),
    ),
  ].join('\n')

  downloadTextFile(fileName, csvContent, 'text/csv;charset=utf-8')
}
