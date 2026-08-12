type Props = {
  value: string
  onChange: (value: string) => void
  onClose: () => void
}

const PLACEHOLDER = `Cole ou digite o roteiro aqui.

O texto vai rolar automaticamente enquanto a câmera grava.

Ajuste a velocidade e o tamanho da fonte nos controles.`

export function ScriptEditor({ value, onChange, onClose }: Props) {
  const handleClear = () => onChange('')

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) onChange(text)
    } catch {
      /* permissão negada — usuário pode colar com Ctrl/Cmd+V */
    }
  }

  return (
    <div className="editor-panel" role="dialog" aria-label="Editar roteiro">
      <header className="editor-header">
        <h2>Roteiro</h2>
        <div className="editor-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleClear}
            disabled={!value}
          >
            Limpar
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void handlePaste()}>
            Colar
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Pronto
          </button>
        </div>
      </header>
      <textarea
        className="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDER}
        autoFocus
        spellCheck
      />
      <p className="editor-save-hint">Salvo automaticamente neste aparelho</p>
    </div>
  )
}
