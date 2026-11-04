// ГЕНЕРИРАНЕТО СЕ ПРЕМЕСТИ.
//
// Решено на 03.11.2026: двете ПВА не са решение, а недовършено преместване, и
// първото, което се мести, е генерирането — докато то е само в старото,
// старото е задължително и всичко друго е театър.
//
// Дотук генерирането живееше ВЪТРЕ в екрана: четеше отметки по `doc-<id>`,
// пишеше в `status-<id>`, въртеше бутона. Затова не можеше да се повика
// отдругаде. Тук се пази разделянето: кухнята не знае за екран, а бутонът
// „Съставѝ документа“ вече не изхвърля в старото ПВА.
const fs = require('fs');
const path = require('path');
const { kod, grab } = require('./kod');
const s = kod();

const KOREN = path.join(__dirname, '..');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

// ── кухнята не знае за екран ────────────────────────────────────────────────
const telo = fs.readFileSync(path.join(KOREN, 'js', '11b-generirane.js'), 'utf8');
for (const zabraneno of ['document.getElementById', 'innerHTML', 'disabled', 'showAlert'])
    t(`кухнята не пипа екрана: няма „${zabraneno}“`, !telo.includes(zabraneno),
      telo.split('\n').filter(l => l.includes(zabraneno))[0]);
t('свалянето е отделна функция, за да може останалото да мине без браузър',
  /function genSvali/.test(telo) && !/document\.createElement/.test(
      telo.replace(/function genSvali[\s\S]*?\n}/, '')));

// ── бутонът вече не изхвърля в старото ──────────────────────────────────────
const moment = fs.readFileSync(path.join(KOREN, 'akt', 'moment.js'), 'utf8');
const sastavi = /function momentSastavi\(\)[\s\S]*?\n}/.exec(moment)[0];
t('„Съставѝ документа“ НЕ праща в старото ПВА',
  !/index\.html/.test(sastavi), sastavi);
t('а отваря екрана на документите', /#\/dokumenti\//.test(sastavi), sastavi);

// ── екранът го има и е вързан ───────────────────────────────────────────────
const html = fs.readFileSync(path.join(KOREN, 'akt', 'index.html'), 'utf8');
t('новата повърхност има екран за документите', /id="ekran-dokumenti"/.test(html));
t('и го показва по адрес #/dokumenti', /k\.ekran === 'dokumenti'/.test(html));
t('и го отваря с момента', /dokumentiOtvori\(k\.id, k\.i, k\.moment\)/.test(html));
t('кухнята на генерирането е заредена в новата повърхност',
  /11b-generirane\.js/.test(html) && /08-momenti\.js/.test(html));

// ── кои документи ражда един момент ─────────────────────────────────────────
const F = new Function(
    (new RegExp('^const DOC_CONFIG = [\\s\\S]*?\\n\\];$', 'm').exec(s) || [''])[0] + '\n'
    + [grab(s, 'genVidoveZaMoment'), grab(s, 'genZadachi'), grab(s, 'genZapishi')].join('\n')
    + '\nreturn {genVidoveZaMoment, genZadachi, genZapishi, DOC_CONFIG};')();

const imena = m => F.genVidoveZaMoment(m).map(v => v.apiType);
t('моментът „Акт 15“ ражда акт 15', imena('Акт 15').includes('akt15'), imena('Акт 15'));
t('и само него', imena('Акт 15').length === 1, imena('Акт 15'));
t('моментът „Акт 14“ ражда акт 14', imena('Акт 14').join() === 'akt14', imena('Акт 14'));
t('непознат момент не връща празно — по-добре всичко, отколкото нищо',
  imena('Нещо си').length > 1, imena('Нещо си'));
t('и в него не влиза онова, което се прави другаде (ЗК, ОСИП)',
  !imena('Нещо си').some(x => ['zapovedna', 'osip'].includes(x)), imena('Нещо си'));

// ── Акт 12 се съставя ПО ЧАСТИ ──────────────────────────────────────────────
const akt12 = F.DOC_CONFIG.find(d => d.apiType === 'akt12');
const akt15 = F.DOC_CONFIG.find(d => d.apiType === 'akt15');
t('акт 12 без части не дава задача',
  F.genZadachi([akt12], []).length === 0, F.genZadachi([akt12], []));
t('а с две части дава две задачи',
  F.genZadachi([akt12], [{ chast: 'Архитектура', number: '1' },
                         { chast: 'ВиК', number: '2' }]).length === 2);
t('другите видове дават по една задача, без значение частите',
  F.genZadachi([akt15], [{ chast: 'Архитектура', number: '1' }]).length === 1);

// ── следата от генерирането ─────────────────────────────────────────────────
const p = { pi: '68134.1.1' };
F.genZapishi(p, [{ type: 'Акт 15', date: 'd1' }]);
F.genZapishi(p, [{ type: 'Акт 15', date: 'd2' }, { type: 'Акт 14', date: 'd3' }]);
t('следата се пази в обекта', (p.generatedDocs || []).length === 2, p.generatedDocs);
t('и повторното генериране ПРЕЗАПИСВА записа за същия вид',
  p.generatedDocs.find(d => d.type === 'Акт 15').date === 'd2', p.generatedDocs);
t('празен резултат не оставя следа',
  (() => { const q = {}; F.genZapishi(q, []); return !q.generatedDocs; })());

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — генерирането се премести`);
process.exit(loshi.length ? 1 : 0);
