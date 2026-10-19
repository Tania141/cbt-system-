// Кръговете на оценката: чл. 142 и измененията по чл. 154.
//
// Операторът, 19.10.2026: „Чл. 154 е същото като ОСИП“ — втори кръг върху
// същия строеж, който РАЗКАЗВА какво се променя. „Зависи какви са
// измененията, понякога са в целия проект, понякога само по части“: затова
// кръгът тръгва празен и всяка част се посочва изменена или непроменена.
const { kod, grab, parche } = require('./kod');
const s = kod();

const F = new Function(
    "const _s2esc=x=>String(x??'');let _zapisi=[];\n"
    + parche(s, 'const _KRUG_IZMENENA', 'function _krugLenta')
    + grab(s, '_krugLenta') + '\n'
    + 'let _t=null,_otgovor=null,_da=true;\n'
    + 'const _zhivObekt=()=>_t;const _stroezh=p=>p;\n'
    + 'const _zapishiObekt=(p,k)=>_zapisi.push(k);const _zapishiTiho_ilisave=()=>{};\n'
    + 'const _prerisuvai=()=>{};const prompt=()=>_otgovor;const confirm=()=>_da;\n'
    + 'return {_krugove,_brojKrugove,_indeksKrug,_krug,_imeKrug,_krugNepromeneni,'
    + '_krugRedove,_krugLenta,_KRUG_CHASTI,dobaviKrug,smeniKrug,mahniKrug,krugPole,krugChast,'
    + 'set:p=>{_t=p},otgovor:v=>{_otgovor=v},da:v=>{_da=v},zapisi:()=>_zapisi};')();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const p = { pi: '1', stroej: 'Жилищна сграда', blokove: { a: { chast: 'Архитектура' } },
            zapiski: { chasti: [{ fajl: 'arh.pdf' }] } };
F.set(p);

t('без изменение има един кръг', F._brojKrugove(p) === 1 && F._krug(p) === p);
t('кръг 1 се казва по чл. 142', /чл\. 142/.test(F._imeKrug(p, 0)), F._imeKrug(p, 0));

// ── нов кръг ───────────────────────────────────────────────────────────────
F.otgovor('');
F.dobaviKrug();
t('кръг без предмет не се прави', F._brojKrugove(p) === 1);

F.otgovor('Апартамент № 4 се разделя на апартамент № 4 и апартамент № 4а');
F.dobaviKrug();
t('кръгът се добавя', F._brojKrugove(p) === 2);
t('новият кръг става текущ', F._indeksKrug(p) === 1);
t('предметът е записан', /апартамент № 4а/.test(F._krug(p).predmet), F._krug(p).predmet);
t('кръг 2 тръгва ПРАЗЕН — чуждите блокове не влизат',
  Object.keys(F._krug(p).blokove || {}).length === 0, F._krug(p).blokove);
t('и със свои записки', (F._krug(p).zapiski.chasti || []).length === 0);
t('кръг 1 си остава с неговото',
  Object.keys(p.blokove).length === 1 && p.zapiski.chasti.length === 1);

// ── частите ────────────────────────────────────────────────────────────────
F.krugChast('ARH', 'izmenena');
F.krugChast('VIK', 'izmenena');
F.krugChast('KONSTR', 'nepromenena');
F.krugChast('GEO', 'nepromenena');
t('изменените и непроменените се пазят отделно',
  F._krugNepromeneni(p).join(', ') === 'Конструкции, Геодезия', F._krugNepromeneni(p));
F.krugChast('GEO', '');
t('посочването се маха', F._krugNepromeneni(p).join(', ') === 'Конструкции', F._krugNepromeneni(p));

// ── редовете към доклада ───────────────────────────────────────────────────
F.krugPole('nomer', '18');
F.krugPole('izmenya_nomer', '12');
F.krugPole('izmenya_data', '03.02.2026');
const redove = {};
F._krugRedove(p, (k, v) => { redove[k] = v; });
t('поводът е чл. 154', redove['ОСИП_Повод'] === 'чл. 154', redove);
t('предметът влиза в доклада', /апартамент № 4а/.test(redove['ОСИП_Предмет_Изменение']));
t('сочи се изменяваният доклад', redove['ОСИП_Изменя_Доклад'] === '№ 12 от 03.02.2026',
  redove['ОСИП_Изменя_Доклад']);
t('непроменените части са изречение',
  /Конструкции не се изменят/.test(redove['ОСИП_Непроменени_Части'] || ''),
  redove['ОСИП_Непроменени_Части']);
t('сочи се номерът на предишния доклад',
  /№ 12/.test(redove['ОСИП_Непроменени_Части'] || ''), redove['ОСИП_Непроменени_Части']);

// Кръг 1 не прибавя нищо — първият доклад не е изменение.
F.smeniKrug(0);
const r1 = {};
F._krugRedove(p, (k, v) => { r1[k] = v; });
t('кръг 1 не слага редове за чл. 154', Object.keys(r1).length === 0, r1);
t('и носи пак своите блокове', F._krug(p) === p);

// ── изгледът ───────────────────────────────────────────────────────────────
F.smeniKrug(1);
const html = F._krugLenta(p);
t('лентата показва двата кръга', /чл\. 142/.test(html) && /чл\. 154/.test(html));
t('лентата показва предмета', /апартамент № 4а/.test(html));
t('лентата изброява частите', /Архитектура/.test(html) && /Пожарна безопасност/.test(html));
const o = (html.match(/<div/g) || []).length, z = (html.match(/<\/div>/g) || []).length;
t(`баланс на div (${o}/${z})`, o === z);

// ── махане ─────────────────────────────────────────────────────────────────
F.da(false);
F.mahniKrug(1);
t('отказът не маха кръга', F._brojKrugove(p) === 2);
F.da(true);
F.mahniKrug(1);
t('кръгът се маха', F._brojKrugove(p) === 1 && F._indeksKrug(p) === 0);
t('строежът си е цял след махането',
  Object.keys(p.blokove).length === 1 && p.zapiski.chasti.length === 1);
t('историята е писана', F.zapisi().length >= 4, F.zapisi());

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — кръговете са отделни`);
process.exit(loshi.length ? 1 : 0);
