# Falado — prática de conversa

Um site para praticar **falar e conversar** sobre temas diversos, em **português europeu e inglês**.

Inspirado no [Unprompted](https://unprompted.cool), que é um sorteador de temas com cronómetro. Este vai bastante mais longe: fala contigo, ouve-te, responde ao que disseste, e no fim mostra-te como falaste.

**Sem IA, sem servidor, sem conta, sem chaves de API.** Tudo corre no browser.

---

## O que faz

- **Conversa multi-turno** com cinco personas (amigo curioso, entrevistador, advogado do diabo, jornalista, cético)
- **Voz completa** — o app fala as perguntas e transcreve as tuas respostas
- **168 temas** escritos à mão em sete categorias, nas duas línguas (os portugueses não são traduções)
- **Cinco modos** — Relâmpago, Conversa, Entrevista, Debate, História
- **Análise pós-sessão** — ritmo, pausas, muletas, riqueza vocabular, hesitação
- **Ouve-te a ti próprio** — o áudio fica guardado localmente
- **Histórico** com streak e evolução por métrica

## Como faz conversa sem IA

Um sistema de perguntas em quatro camadas, filtrado por persona e a escalar ao longo dos turnos:

| Camada | O que é | Ficheiro |
|---|---|---|
| 1 — Tema | 4–6 perguntas escritas à mão por tema | `src/content/topics/` |
| 2 — Socrática | ~60 perguntas universais por língua, etiquetadas por tipo de jogada | `src/content/probes/` |
| 3 — Reativa | Heurísticas sobre a tua resposta: curta demais, sem exemplos, cheia de "talvez", absolutos, repetições | `src/engine/reactive.ts` |
| 4 — Eco | Extrai um termo do que disseste e cita-o de volta | `src/engine/keywords.ts` |

As camadas 3 e 4 são o que faz parecer que está mesmo a ouvir. Exemplo real de uma sessão:

> **Falaste em trabalho pendente.** Dá-me um exemplo disso.

A seleção tem memória anti-repetição dentro da sessão e entre sessões, e a persona define os pesos por tipo de jogada — o amigo curioso nunca te pede números, o cético pede-os sempre.

## Correr localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 47 testes das peças puras
npm run build
```

Verificação manual do fluxo completo — percorre uma sessão inteira em modo escrito e
confirma que as perguntas não se repetem. O Playwright não está nas dependências de
propósito (só serve para isto, e atrasaria o build):

```bash
npm run build
npx vite preview --port 4173 &
npm i --no-save playwright
node e2e.mjs
```

## Suporte de browsers

| | Transcrição | Notas |
|---|---|---|
| Chrome, Edge, Opera | ✅ | Melhor experiência. 139+ no desktop pode instalar reconhecimento **no dispositivo** (Definições) e aí funciona offline |
| Safari (14.1+ / iOS 14.5+) | ✅ | Gravação de áudio desligada por defeito — `MediaRecorder` e reconhecimento no mesmo stream é instável |
| Chrome Android | ✅ | `continuous` não é suportado; o ciclo de reinício trata disso |
| Firefox | ❌ | Sem `SpeechRecognition`. O app entra em **modo escrito** com o mesmo motor de conversa |

Sem microfone ou sem permissão, o app passa sozinho para modo escrito em vez de te deixar a falar para o vazio.

### O que é honesto dizer sobre as métricas

- **Pausas** são a métrica mais fiável — vêm do áudio (Web Audio RMS), não da transcrição
- **Ritmo (ppm)** é uma estimativa por defeito: o reconhecimento engole palavras. Por isso é mostrado como intervalo, e nunca em sessões escritas
- **"hum" e "uh"** são mal contados — o Chrome remove-os da transcrição final. O número é rotulado como estimativa
- Não há **nota global**. Um número único convida a otimizar o número em vez da fala

## Privacidade

Tudo fica no teu dispositivo: definições e histórico em `localStorage`, áudio em IndexedDB (com teto e limpeza automática).

A única exceção, dita às claras nas Definições: **o Chrome e o Safari enviam o áudio para os servidores deles para o transcrever.** É assim que a Web Speech API funciona nesses browsers. No Chrome/Edge 139+ do desktop podes instalar o reconhecimento no dispositivo e nem isso sai.

## Deploy (Vercel)

O projeto está numa subpasta do repo. No projeto Vercel, define **Root Directory** como `speaking-practice`. O `vercel.json` trata do resto.

## Estrutura

```
src/
├── content/     temas, perguntas, personas, modos  (o produto vive aqui)
├── engine/      seleção de perguntas, heurísticas, extração de termos
├── voice/       reconhecimento, síntese, gravação, deteção de capacidades
├── analysis/    métricas, pausas, muletas, relatório
├── storage/     localStorage + IndexedDB
├── screens/     Home, Session, Debrief, History, Settings
└── components/  reel, orbe, mosaicos, sparklines
```

Para **adicionar temas**, edita um ficheiro em `src/content/topics/<lang>/` — o formato é uma tupla compacta e o resto é automático.
