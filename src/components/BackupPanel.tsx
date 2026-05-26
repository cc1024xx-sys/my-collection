import { useRef, useState } from 'react'
import {
  downloadBackup,
  importBackup,
  type ImportMode,
} from '../utils/backup'

export function BackupPanel() {
  const [open, setOpen] = useState(false)
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function close() {
    setOpen(false)
    setMessage(null)
  }

  async function handleExport() {
    setBusy(true)
    setMessage(null)
    try {
      await downloadBackup()
      setMessage('已生成备份文件，请在下载目录或「文件」应用中查看。')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '导出失败')
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(file: File) {
    const modeLabel = importMode === 'replace' ? '覆盖' : '合并'
    const confirmed = window.confirm(
      importMode === 'replace'
        ? `将以备份${modeLabel}本机全部攻略（当前数据会被替换），是否继续？`
        : `将${modeLabel}备份数据（相同 id 的攻略会被覆盖），是否继续？`,
    )
    if (!confirmed) return

    setBusy(true)
    setMessage(null)
    try {
      const result = await importBackup(file, importMode)
      setMessage(
        `导入成功：${result.guides} 条攻略，${result.images} 张图片，${result.feedbacks} 条体验记录。`,
      )
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '导入失败')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setBusy(false)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleImport(file)
  }

  return (
    <>
      <button
        type="button"
        className="btn-header-backup"
        onClick={() => setOpen(true)}
        aria-label="数据备份"
      >
        备份
      </button>

      {open && (
        <div
          className="backup-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="backup-title"
          onClick={close}
        >
          <div
            className="backup-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="backup-sheet-header">
              <h2 id="backup-title" className="backup-title">
                数据备份
              </h2>
              <button
                type="button"
                className="btn-icon"
                onClick={close}
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            <p className="backup-hint">
              数据保存在本机浏览器中。导出 JSON 可备份到手机或电脑；换设备或清缓存前请先导出。
            </p>

            <button
              type="button"
              className="btn-primary btn-block"
              disabled={busy}
              onClick={() => void handleExport()}
            >
              {busy ? '处理中…' : '导出备份'}
            </button>

            <div className="backup-divider">导入备份</div>

            <fieldset className="backup-mode" disabled={busy}>
              <legend className="sr-only">导入方式</legend>
              <label className="backup-mode-option">
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                />
                <span>
                  <strong>合并</strong>
                  <small>保留本机数据，同 id 会被覆盖</small>
                </span>
              </label>
              <label className="backup-mode-option">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                />
                <span>
                  <strong>覆盖</strong>
                  <small>清空本机后写入备份</small>
                </span>
              </label>
            </fieldset>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="backup-file-input"
              disabled={busy}
              onChange={onFileChange}
            />
            <button
              type="button"
              className="btn-secondary btn-block"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              选择备份文件并导入
            </button>

            {message && (
              <p
                className={`backup-message ${message.includes('成功') || message.includes('已生成') ? 'backup-message--ok' : 'backup-message--err'}`}
                role="status"
              >
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
