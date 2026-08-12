type Props = {
  value: string
  onChange: (value: string) => void
  onClose: () => void
}

const PLACEHOLDER = `Cole ou digite o roteiro aqui.

O texto vai rolar automaticamente enquanto a câmera grava.

Ajuste a velocidade e o tamanho da fonte nos controles.`

export function ScriptEditor({ value, onChange, onClose }: Props) {
  return (
    <div className="editor-panel" role="dialog" aria-label="Editar roteiro">
      <header className="editor-header">
        <h2>Roteiro</h2>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Pronto
        </button>
      </header>
      <textarea
        className="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDER}
        autoFocus
        spellCheck
      />
    </div>
  )
}
