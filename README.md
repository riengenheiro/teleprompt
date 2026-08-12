# Teleprompter

Teleprompter online com gravação simultânea da câmera frontal e microfone. O texto rola na tela; o vídeo fica só com a imagem e o áudio, e o arquivo baixa no dispositivo.

Funciona no Chrome (Windows/Android) e Safari (iOS). Hospedagem pensada para Cloudflare Pages.

## Uso

1. Toque em **Roteiro** e cole o texto.
2. Ajuste velocidade e tamanho da fonte.
3. Toque em **Câmera** e permita acesso.
4. Toque em **Gravar** — countdown de 3s, depois scroll + gravação juntos.
5. **Parar** (ou fim do texto) baixa o `.webm` ou `.mp4`.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Abra o endereço do Vite (em geral `http://localhost:5173`). Câmera/microfone exigem contexto seguro: localhost conta como seguro.

## Build e deploy (Cloudflare Pages)

```bash
npm run build
npm run deploy
```

Ou conecte o repositório `riengenheiro/teleprompt` no dashboard da Cloudflare:

| Config | Valor |
|--------|--------|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |

É necessário HTTPS em produção para `getUserMedia`.

## Stack

- Vite + React + TypeScript
- `MediaRecorder` + `getUserMedia` (cliente)
- PWA (`manifest.webmanifest`) para adicionar à tela inicial
- Cloudflare Pages (`wrangler.toml`)

## Notas de compatibilidade

- Safari/iOS: prioriza `video/mp4`
- Chrome/Android/Windows: prioriza `video/webm`
- A tela tenta ficar ligada com Wake Lock durante gravação/scroll
