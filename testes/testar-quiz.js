// Passa pelas 16 telas do quiz no jsdom, clicando como uma pessoa, e
// confere três cenários de resultado: sem erro de JavaScript, sem NaN/undefined,
// eventos certos para o backend e checkout repassando UTMs.
// Uso: node --experimental-strip-types testes/testar-quiz.js [caminho do html]   (padrão: quiz/index.html)
const fs = require('fs');
const path = require('path');
const {JSDOM} = require('jsdom');

const file = process.argv[2] || path.join(__dirname, '..', 'quiz', 'index.html');
const html = fs.readFileSync(file, 'utf8')
  .replace("backendUrl: '',", "backendUrl: 'https://backend.exemplo.com/functions/v1/quiz',")
  .replace(/checkoutUrl: '[^']*'/, "checkoutUrl: ''"); // começa sem link para testar o aviso; o link é posto no meio do teste
const out = [];
let fail = false;
const check = (ok, msg) => { if (!ok) fail = true; out.push(`${ok ? 'ok ' : 'ERRO'} ${msg}`); };

const scenarios = [
  {nome: 'gelado, 40 a 49', sentimento: 'vergonha', idade: 'i40', caneta: 'c3', barriga: 'pochete', sonho: 'lisa', sintomas: ['fome', 'gelado', 'cansaco'], come: 'gelado', tempo: 't5', compromisso: 'sim'},
  {nome: 'lanche, 60+', sentimento: 'evito', idade: 'i60', caneta: 'c6', barriga: 'pneuzinho', sonho: 'roupa', sintomas: ['lanche', 'enjoo', 'academia'], come: 'lanche', tempo: 't40', compromisso: 'tentar'},
  {nome: 'sem sinais, 18 a 29', sentimento: 'raiva', idade: 'i18', caneta: 'parei', barriga: 'flacida', sonho: 'firme', sintomas: ['nenhum'], come: 'prato_pequeno', tempo: 't20', compromisso: 'sim'}
];

const run = (sc) => new Promise((resolve) => {
  const errors = [];
  const sent = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://exemplo.com/quiz?utm_source=fb&utm_campaign=c1&fbclid=abc',
    beforeParse(w) {
      w.matchMedia = () => ({matches: true, addListener() {}, removeListener() {}}); // reduz animação: loading em 1,2 s
      w.scrollTo = () => {};
      w.Element.prototype.scrollIntoView = () => {};
      w.fetch = (url, opt) => { sent.push(JSON.parse(opt.body)); return Promise.resolve({}); };
      w.addEventListener('error', (e) => errors.push(e.message));
    }
  });
  const w = dom.window;
  const d = w.document;
  w.console.error = (...a) => errors.push(a.join(' '));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const click = (id) => { const b = d.getElementById(id); if (!b) throw new Error('não achei #' + id + ' na tela: ' + d.getElementById('screen').textContent.slice(0, 80)); b.click(); };
  const texts = [];
  const snap = () => texts.push(d.getElementById('screen').textContent.replace(/\s+/g, ' '));

  (async () => {
    try {
      snap(); click('opt-sentimento-' + sc.sentimento); await wait(300);
      snap(); click('opt-idade-' + sc.idade); await wait(300);
      snap(); click('opt-caneta-' + sc.caneta); await wait(300);
      snap(); click('opt-barriga-' + sc.barriga); await wait(300);
      snap(); click('opt-sonho-' + sc.sonho); await wait(300);
      snap(); click('cont-porque'); await wait(50);
      snap(); sc.sintomas.forEach((v) => click('opt-sintomas-' + v)); click('cont-sintomas'); await wait(50);
      snap(); click('opt-come-' + sc.come); await wait(300);
      snap(); click('cont-quebra'); await wait(50);
      snap(); click('peso-mais'); click('peso-mais'); click('altura-menos'); click('cont-peso'); await wait(50);
      snap(); click('cont-espelho'); await wait(50);
      snap(); click('cont-solucao'); await wait(50);
      snap(); click('opt-tempo-' + sc.tempo); await wait(300);
      snap(); click('opt-compromisso-' + sc.compromisso); await wait(300);
      snap(); await wait(2200);
      snap();
    } catch (e) { errors.push(e.message); }
    resolve({errors, sent, texts, w, d, click});
  })();
});

(async () => {
  const {validarRegistro} = await import('../backend/supabase/functions/_shared/validar.ts');
  for (const sc of scenarios) {
    const {errors, sent, texts, w, d} = await run(sc);
    const all = texts.join(' | ');
    const result = texts[texts.length - 1] || '';
    check(!errors.length, `[${sc.nome}] sem erros de JavaScript ${errors.length ? '→ ' + errors.join(' || ') : ''}`);
    check(texts.length === 16, `[${sc.nome}] ${texts.length} telas percorridas (esperado 16)`);
    check(/\d+% das mulheres (entre|com) .+ que responderam nosso quiz/.test(texts[8] || ''), `[${sc.nome}] "caminho certo" depois da pergunta do prato, com o % da faixa`);
    check(/6x\s*R\$\s*4,65/.test(result) && result.includes('ou R$ 27,90 à vista'), `[${sc.nome}] oferta mostra 6x de R$ 4,65 e o valor à vista`);
    check(!/NaN|undefined|null/.test(all), `[${sc.nome}] nenhuma tela com NaN, undefined ou null`);
    const perfil = (result.match(/Seu perfil: (.+?)(A caneta|Com a caneta|Com a fome|Você come|A vontade)/) || [])[1];
    check(!!perfil, `[${sc.nome}] resultado com perfil "${(perfil || '?').trim()}"`);
    check(result.includes('82 kg') || all.includes('82 kg'), `[${sc.nome}] peso ajustado no + aparece (82 kg)`);
    // 82 kg e 1,64 m: IMC 30,5, obesidade grau I; proteína pelo peso ajustado (~70,9 kg) = 85 a 113 g
    check(result.includes('30,5') && all.includes('Obesidade grau I'), `[${sc.nome}] IMC calculado com a altura (30,5)`);
    check(result.includes('85 a 113 g'), `[${sc.nome}] proteína pelo peso ajustado (85 a 113 g)`);
    check(result.includes('Dia 1') && result.includes('Garantia'), `[${sc.nome}] resultado tem Dia 1 e oferta`);
    check(all.includes('Você disse que, no espelho, sente'), `[${sc.nome}] o espelho devolve o que a pessoa sente`);
    check(result.includes('Seu objetivo'), `[${sc.nome}] resultado mostra o objetivo escolhido`);
    const tipos = sent.map((e) => e.tipo);
    check(tipos[0] === 'inicio' && tipos.includes('concluido'), `[${sc.nome}] backend recebeu início e conclusão (${sent.length} eventos)`);
    const inicio = sent[0] || {};
    check(inicio.utm && inicio.utm.utm_campaign === 'c1' && inicio.utm.fbclid === 'abc', `[${sc.nome}] UTMs vão no evento de início`);
    const conc = sent.find((e) => e.tipo === 'concluido') || {};
    check(conc.perfil === sc.come, `[${sc.nome}] perfil enviado ao backend: ${conc.perfil}`);
    const etapas = sent.filter((e) => e.tipo === 'etapa');
    const resp = Object.assign({}, ...etapas.map((e) => e.respostas));
    check(resp.sentimento === sc.sentimento && resp.barriga === sc.barriga && resp.idade === sc.idade && resp.sonho === sc.sonho && resp.come === sc.come && resp.peso === 82 && resp.altura === 164 && Array.isArray(resp.sintomas), `[${sc.nome}] respostas chegam ao backend (${Object.keys(resp).join(', ')})`);
    check(new Set(sent.map((e) => e.sessao)).size === 1, `[${sc.nome}] uma sessão só`);
    // checkout: sem link mostra o aviso; com link manda o evento e repassa UTMs
    d.getElementById('cta').click();
    check(!d.querySelector('#oferta .setup').hidden, `[${sc.nome}] sem checkoutUrl, o botão mostra o aviso de configuração`);
    const href = w.eval("CONFIG.checkoutUrl = 'https://pay.exemplo.com/abc?x=1'; checkoutHref()");
    check(href.includes('utm_source=fb') && href.includes('fbclid=abc') && href.includes('x=1'), `[${sc.nome}] checkout repassa UTMs e fbclid`);
    w.eval("location.assign = () => {}"); // o jsdom não navega; só queremos o evento
    d.getElementById('cta-2').click();
    check(sent.some((e) => e.tipo === 'checkout'), `[${sc.nome}] clique no checkout vai para o backend`);
    const recusados = sent.map((e) => validarRegistro(e)).filter((r) => !r.ok);
    check(!recusados.length, `[${sc.nome}] o backend aceita todos os ${sent.length} eventos ${recusados.map((r) => r.erro).join(', ')}`);
    w.close();
  }
  console.log(out.join('\n'));
  process.exit(fail ? 1 : 0);
})();
