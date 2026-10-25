// Confere a página institucional (institucional/index.html) no jsdom:
// só conteúdo (sem preço, checkout ou Kiwify), botões levando ao teste com as UTMs,
// os 10 materiais, e as seções de história e depoimentos escondidas enquanto vazias.
// Uso: node testes/testar-institucional.js
const fs = require('fs');
const path = require('path');
const {JSDOM} = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'institucional', 'index.html'), 'utf8');
const out = [];
let fail = false;
const check = (ok, msg) => { if (!ok) fail = true; out.push(`${ok ? 'ok ' : 'ERRO'} ${msg}`); };

const abrir = (ajuste = (h) => h) => new JSDOM(ajuste(html), {
  runScripts: 'dangerously',
  url: 'https://sobre.oalemdacaneta.com.br/?utm_source=fb&utm_campaign=c1',
  beforeParse(w) { w.matchMedia = () => ({matches: true}); }
});

const {window: w} = abrir();
const d = w.document;
const texto = d.body.textContent;
const semScripts = d.body.innerHTML.replace(/<script[\s\S]*?<\/script>/g, '');

check(!/R\$|kiwify|checkout|sem juros|parcel/i.test(semScripts), 'só conteúdo: nenhum preço, checkout, Kiwify ou parcelamento');
const testes = [...d.querySelectorAll('[data-teste]')];
check(testes.length >= 3 && testes.every((a) => a.href.startsWith('https://oalemdacaneta.com.br/')), `os ${testes.length} botões levam ao teste`);
check(testes.every((a) => a.href.includes('utm_source=fb') && a.href.includes('utm_campaign=c1')), 'os botões repassam as UTMs de quem chegou');
check(d.querySelectorAll('#mats li').length === 10, '10 materiais com capa, situação e descrição');
check([...d.querySelectorAll('#mats img')].every((i) => /^img\/capas\/\d\d\.webp$/.test(i.getAttribute('src')) && fs.existsSync(path.join(__dirname, '..', 'institucional', i.getAttribute('src')))), 'todas as capas existem na pasta da página');
check(d.getElementById('quem-somos').hidden && d.getElementById('depoimentos').hidden, 'história e depoimentos escondidos enquanto não há texto real');
check(!d.querySelector('a[href="#quem-somos"]'), 'o menu não aponta para a história escondida');
check(texto.includes('A caneta continua do jeito que o seu médico passou'), 'aviso de que a caneta segue como o médico passou');
check(texto.includes('Material educativo'), 'aviso de material educativo no rodapé');
check(!!d.querySelector('a[href="https://oalemdacaneta.com.br/privacidade.html"]'), 'link para a política de privacidade');

// Com história e um depoimento preenchidos, as seções aparecem.
const {window: w2} = abrir((h) => h
  .replace("titulo: '',", "titulo: 'Nasceu de uma <em>pergunta.</em>',")
  .replace('paragrafos: []', "paragrafos: ['Parágrafo um.', 'Parágrafo dois.']")
  .replace("depoimentos: [\n", "depoimentos: [\n    {texto: 'Teste.', nome: 'Ana, 41', foto: ''},\n"));
const d2 = w2.document;
check(!d2.getElementById('quem-somos').hidden && d2.querySelectorAll('#historia p').length === 2, 'com a história preenchida, a seção aparece');
check(!d2.getElementById('depoimentos').hidden && d2.querySelectorAll('#deps .dep').length === 1, 'com um depoimento preenchido, a seção aparece');

console.log(out.join('\n'));
process.exit(fail ? 1 : 0);
