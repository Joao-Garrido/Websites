/**
 * Drives a full written-mode session end to end and captures the debrief.
 * Not part of the build — a manual smoke check (`node e2e.mjs`) that the turn
 * machine, question engine, metrics and storage all work together.
 */
import { chromium } from 'playwright'

const OUT = process.env.SHOT_DIR ?? '.'
const URL = process.env.APP_URL ?? 'http://localhost:4173/'

const ANSWERS = [
  'O meu domingo perfeito começa sem despertador, por volta das nove. Faço café devagar, leio qualquer coisa em papel durante uma hora e só depois olho para o telemóvel. A parte que mais me custa perder é essa primeira hora silenciosa antes de o mundo começar a pedir coisas.',
  'Normalmente estou sozinho de manhã e acompanhado à tarde. Em 2023 comecei a almoçar com os meus pais quase todos os domingos, e isso mudou completamente o peso do dia. Antes era um dia de recuperação, agora é um dia de ligação.',
  'O que estragaria o dia por completo seria ter trabalho pendente na cabeça. Não é sequer trabalhar, é saber que na segunda de manhã há uma coisa mal resolvida à minha espera. Isso contamina tudo, mesmo que eu não faça nada.',
  'Sim, muito poucos. Talvez cinco ou seis este ano, o que é pouco para cinquenta e dois domingos. A maior parte deles acabou por ser preenchida com tarefas que fui adiando durante a semana.',
  'Acho que o problema não é o domingo, é a forma como organizo os outros seis dias. Se a semana estiver bem arrumada, o domingo trata de si próprio. Tenho estado a tentar fechar as coisas à sexta-feira ao fim do dia.',
  'Resumindo: o domingo perfeito é sem despertador, sem trabalho pendente e com uma refeição em família. E a única maneira de o conseguir é proteger a sexta-feira, não o domingo.',
]

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await browser.newContext({
  viewport: { width: 480, height: 1000 },
  deviceScaleFactor: 2,
})
const page = await ctx.newPage()

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(URL, { waitUntil: 'networkidle' })
// Pin the topic so the run is reproducible.
await page.selectOption('select >> nth=1', 'general')
await page.getByRole('button', { name: /^Começar$/ }).click()
await page.waitForTimeout(1500)

// Fall back to writing — there is no microphone in this environment.
const typeToggle = page.getByRole('button', { name: /Escrever em vez de falar/ })
if (await typeToggle.count()) await typeToggle.click()

const questions = []
for (let turn = 0; turn < ANSWERS.length; turn++) {
  const heading = page.locator('.font-display').first()
  questions.push((await heading.innerText()).trim())

  const box = page.locator('textarea')
  await box.waitFor({ state: 'visible', timeout: 5000 })
  await box.fill(ANSWERS[turn])
  await page.getByRole('button', { name: /^Enviar$/ }).click()
  await page.waitForTimeout(1600)

  if (await page.getByText('Como correu').count()) break
}

await page.waitForTimeout(1200)
await page.screenshot({ path: `${OUT}/06-debrief.png`, fullPage: true })

await page.getByRole('button', { name: /^Voltar$/ }).click()
await page.waitForTimeout(400)
await page.getByRole('button', { name: /^Histórico$/ }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/07-history.png`, fullPage: true })

console.log('QUESTIONS ASKED:')
questions.forEach((q, i) => console.log(`  ${i + 1}. ${q}`))
const unique = new Set(questions)
console.log(`\nUNIQUE: ${unique.size}/${questions.length}`)
console.log('CONSOLE ERRORS:', errors.length ? JSON.stringify(errors, null, 2) : 'none')

await browser.close()
