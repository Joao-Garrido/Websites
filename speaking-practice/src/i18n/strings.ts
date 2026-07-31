import type { Lang } from '../content/types'

export const STRINGS = {
  pt: {
    appName: 'Falado',
    tagline: 'Fala. Ouve-te. Melhora.',
    language: 'Língua',
    mode: 'Modo',
    category: 'Tema',
    persona: 'Com quem',
    allCategories: 'Todos os temas',
    spin: 'Sortear',
    spinAgain: 'Outro',
    start: 'Começar',
    ready: 'Pronto',
    history: 'Histórico',
    settings: 'Definições',
    back: 'Voltar',
    close: 'Fechar',

    // Session
    listening: 'A ouvir',
    thinking: 'A pensar',
    speaking: 'A falar',
    yourTurn: 'É a tua vez',
    done: 'Terminei',
    skip: 'Passar',
    endSession: 'Terminar sessão',
    turnOf: (a: number, b: number) => `Turno ${a} de ${b}`,
    typeInstead: 'Escrever em vez de falar',
    typePlaceholder: 'Escreve a tua resposta…',
    send: 'Enviar',
    tapToSpeak: 'Toca para falar',

    // Debrief
    debrief: 'Como correu',
    yourWords: 'O que disseste',
    listenBack: 'Ouve-te',
    newSession: 'Nova sessão',
    noAudio: 'Áudio não guardado nesta sessão.',
    vocabTitle: 'Vocabulário útil',
    frameworkTitle: 'Estrutura sugerida',

    // History
    noSessions: 'Ainda não há sessões. Faz a primeira.',
    streak: 'Dias seguidos',
    sessionsCount: 'Sessões',
    totalTime: 'Tempo a falar',
    trend: 'Evolução',
    deleteAll: 'Apagar tudo',
    deleteAllConfirm: 'Apagar todas as sessões e gravações?',

    // Support / errors
    micDenied:
      'O microfone está bloqueado. Autoriza-o nas definições do browser e tenta de novo.',
    micDeniedAction: 'Continuar por escrito',
    micUnavailable:
      'Não foi possível usar o microfone neste dispositivo. Passei para modo escrito para não perderes a sessão.',
    noRecognition:
      'Este browser não transcreve voz (o Firefox ainda não suporta). Podes praticar por escrito, ou usar Chrome, Edge ou Safari para falar.',
    offlineWarning:
      'Sem ligação à internet, a transcrição não funciona neste browser. Podes continuar por escrito.',
    insecure: 'A transcrição de voz exige uma ligação segura (HTTPS).',
    onDeviceAvailable: 'Reconhecimento no dispositivo disponível',
    onDeviceInstall: 'Instalar para funcionar offline',
    onDeviceInstalling: 'A instalar…',
    onDeviceReady: 'Instalado — a transcrição funciona offline',

    // Settings
    voiceOutput: 'O app fala as perguntas',
    saveAudioLabel: 'Guardar áudio para ouvires depois',
    silenceLabel: 'Terminar o turno após silêncio',
    silenceOff: 'Desligado (uso o botão)',
    seconds: (n: number) => `${n} s`,
    dataNote:
      'Tudo fica no teu dispositivo. Não há servidor, nem conta, nem IA a ler o que dizes.',
    sttNote:
      'Nota: o Chrome e o Safari enviam o áudio para os servidores deles para transcrever. É a única coisa que sai do teu dispositivo.',
  },

  en: {
    appName: 'Falado',
    tagline: 'Speak. Hear yourself. Improve.',
    language: 'Language',
    mode: 'Mode',
    category: 'Topic',
    persona: 'Talk with',
    allCategories: 'All topics',
    spin: 'Spin',
    spinAgain: 'Another',
    start: 'Start',
    ready: 'Ready',
    history: 'History',
    settings: 'Settings',
    back: 'Back',
    close: 'Close',

    listening: 'Listening',
    thinking: 'Thinking',
    speaking: 'Speaking',
    yourTurn: 'Your turn',
    done: "I'm done",
    skip: 'Skip',
    endSession: 'End session',
    turnOf: (a: number, b: number) => `Turn ${a} of ${b}`,
    typeInstead: 'Type instead of speaking',
    typePlaceholder: 'Type your answer…',
    send: 'Send',
    tapToSpeak: 'Tap to speak',

    debrief: 'How it went',
    yourWords: 'What you said',
    listenBack: 'Listen back',
    newSession: 'New session',
    noAudio: 'No audio saved for this session.',
    vocabTitle: 'Useful vocabulary',
    frameworkTitle: 'Suggested structure',

    noSessions: 'No sessions yet. Do your first.',
    streak: 'Day streak',
    sessionsCount: 'Sessions',
    totalTime: 'Time speaking',
    trend: 'Trend',
    deleteAll: 'Delete everything',
    deleteAllConfirm: 'Delete all sessions and recordings?',

    micDenied:
      'The microphone is blocked. Allow it in your browser settings and try again.',
    micDeniedAction: 'Continue in writing',
    micUnavailable:
      'The microphone could not be used on this device. Switched to written mode so you do not lose the session.',
    noRecognition:
      'This browser cannot transcribe speech (Firefox does not support it yet). You can practise in writing, or use Chrome, Edge or Safari to speak.',
    offlineWarning:
      'With no internet connection, transcription does not work in this browser. You can continue in writing.',
    insecure: 'Speech transcription requires a secure connection (HTTPS).',
    onDeviceAvailable: 'On-device recognition available',
    onDeviceInstall: 'Install to work offline',
    onDeviceInstalling: 'Installing…',
    onDeviceReady: 'Installed — transcription works offline',

    voiceOutput: 'The app speaks the questions',
    saveAudioLabel: 'Save audio so you can listen back',
    silenceLabel: 'End the turn after silence',
    silenceOff: 'Off (I use the button)',
    seconds: (n: number) => `${n}s`,
    dataNote:
      'Everything stays on your device. No server, no account, no AI reading what you say.',
    sttNote:
      'Note: Chrome and Safari send audio to their servers to transcribe it. That is the only thing that leaves your device.',
  },
} as const

export type Strings = (typeof STRINGS)['pt']

export function t(lang: Lang): Strings {
  return STRINGS[lang] as Strings
}
