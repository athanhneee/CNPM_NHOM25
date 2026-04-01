import { Download, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { exportRowsToCsv } from '@/lib/export'

interface ExportButtonsProps {
  fileName: string
  rows?: Array<Record<string, string | number | boolean | null | undefined>>
  onExportCsv?: () => void
  onExportText?: () => void
}

export function ExportButtons({
  fileName,
  rows,
  onExportCsv,
  onExportText,
}: ExportButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="secondary"
        leftIcon={<Download className="h-4 w-4" />}
        onClick={() => {
          if (onExportCsv) {
            onExportCsv()
            return
          }

          if (rows) {
            exportRowsToCsv(fileName, rows)
          }
        }}
        type="button"
      >
        Xuat CSV
      </Button>
      {onExportText ? (
        <Button
          variant="ghost"
          leftIcon={<FileDown className="h-4 w-4" />}
          onClick={onExportText}
          type="button"
        >
          Xuat du lieu
        </Button>
      ) : null}
    </div>
  )
}

export default ExportButtons
