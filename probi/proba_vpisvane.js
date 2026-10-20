// Сверено и чекнато значи ВПИСАНО.
//
// Операторът, 20.10.2026: „това го е прочел четецът, аз съм го чекнала и
// одобрила — защо не се е вписало?“. Дотук имаше три жеста за едно нещо:
// чекваш фактите, натискаш „Впиши“, после „Запази изходните данни“. Забравиш
// ли последното, вписването изчезва.
const { kod, grab } = require('./kod');
const s = kod();

const F = new Function(
    "const _s2esc=x=>String(x??'');let _zapisi=[],_risuvani=0;\n"
    + 'const _s2Id = d => d.id || d.fajl;\n'
    + [grab(s, '_dokVpishi'), grab(s, '_s2Sveren'), grab(s, '_dokVpishiSverenite'),
       grab(s, '_s2Fakti')].join('\n')
    + '\nconst renderDokumenti=()=>{_risuvani++};'
    + 'const _s2ZapishiTiho=(p,k)=>_zapisi.push(k);\n'
    + 'return {_dokVpishi,_s2Sveren,_dokVpishiSverenite,zapisi:()=>_zapisi,'
    + 'risuvani:()=>_risuvani};')();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const fakt = (v, citat) => ({ stoynost: v, citat: citat || v, stranica: 1 });
const DOK = {
    fajl: 'ДПЕРМ.pdf', vid: 'Договор за присъединяване',
    vid_kod: 'PRISAEDINYAVANE', cheklist_red: 'Договор за присъединяване',
    nomer: fakt('1206036213'), data: fakt('29.10.2015'),
    izdatel: fakt('„Електроразпределителни мрежи Запад“ ЕАД'),
};

// ── какво значи „сверен“ ──────────────────────────────────────────────────
const prazno = {};
t('несверен документ не е сверен', !F._s2Sveren(DOK, prazno));

// Всички факти, потвърдени един по един.
const potv = {};
const kluchove = ['nomer', 'data', 'izdatel'];
for (const k of kluchove) potv[`${DOK.fajl}::${k}`] = { stoynost: 'x' };
t('сверен е, щом всичките му факти са потвърдени', F._s2Sveren(DOK, potv),
  Object.keys(potv));

const chastichno = { [`${DOK.fajl}::nomer`]: { stoynost: 'x' } };
t('частично потвърденият НЕ е сверен', !F._s2Sveren(DOK, chastichno));

// ── вписването ────────────────────────────────────────────────────────────
const obekt = { pi: '68134.1006.2440' };
const n = F._dokVpishiSverenite(obekt, obekt, [DOK], potv);
t('сверéният влиза в изходните данни', n === 1 && (obekt.dokumenti || []).length === 1,
  obekt.dokumenti);
t('с името на реда от чеклиста',
  obekt.dokumenti[0].ime === 'Договор за присъединяване', obekt.dokumenti[0]);
t('и с номера и датата си',
  /1206036213/.test(obekt.dokumenti[0].nomer) && /29\.10\.2015/.test(obekt.dokumenti[0].nomer),
  obekt.dokumenti[0].nomer);
t('записано е в обекта, не само на екрана', F.zapisi().length === 1, F.zapisi());

// Второ минаване не удвоява.
const n2 = F._dokVpishiSverenite(obekt, obekt, [DOK], potv);
t('второто минаване не удвоява', n2 === 0 && obekt.dokumenti.length === 1, obekt.dokumenti);

// Несверен документ не влиза.
const DRUG = { ...DOK, fajl: 'Становище.pdf', cheklist_red: 'Становище от РЗИ' };
const n3 = F._dokVpishiSverenite(obekt, obekt, [DRUG], potv);
t('несверен не влиза', n3 === 0 && obekt.dokumenti.length === 1, obekt.dokumenti);

// Документ без ред в чеклиста не влиза, дори сверен.
const BEZ = { ...DOK, fajl: 'Фактура.pdf', cheklist_red: '' };
for (const k of kluchove) potv[`Фактура.pdf::${k}`] = { stoynost: 'x' };
t('сверен документ без ред не влиза', F._dokVpishiSverenite(obekt, obekt, [BEZ], potv) === 0,
  obekt.dokumenti);

// ── ръчното вписване ──────────────────────────────────────────────────────
t('празно име не се вписва', !F._dokVpishi(obekt, '  ', '1'));
t('нов ред се добавя', F._dokVpishi(obekt, 'Виза за проектиране', '№ 2792 от 18.12.2023'));
t('същият ред не се удвоява', !F._dokVpishi(obekt, 'виза за проектиране', '№ 2792'));
t('но празният номер се допълва',
  F._dokVpishi(obekt, 'Скица', '') === true
  && F._dokVpishi(obekt, 'Скица', '№ 15-123') === true
  && obekt.dokumenti.find(d => d.ime === 'Скица').nomer === '№ 15-123',
  obekt.dokumenti);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема`
    : `\n${dobri.length} проверки — сверено и чекнато значи вписано`);
process.exit(loshi.length ? 1 : 0);
