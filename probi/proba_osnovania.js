// Основанията под възложителите в Акт 15 — по еталона на оператора (22.10.2026).
//
// Образецът иска „трите имена и ТОЧНИТЕ ИМОТИ на всеки един възложител“, а
// подпис вместо него се признава само с приложено пълномощно. Дотук в
// документа отиваше само името.
//
// Еталонът, дума по дума:
//
//   За апартамент №10 (десет)
//   ИВАН СТАНЧЕВ СТАНЧЕВ
//   • Нотариален акт №143, том IV, рег.№4672, дело №653 от 2021 г. на
//     Нотариус №263 в НК, вписан в СВ с вх. рег. №86700, акт 64,
//     том ССXXVII, дело №67645/21 г.
//   • представляван от пълномощника си Димитри Петракиев, надлежно
//     упълномощен с пълномощно рег. №4676 от 19.11.2021г. на нотариус №263 в НК
const { kod } = require('./kod');
const s = kod();

const f = new Function(
    "const _s2esc=x=>String(x??'');\n"
    + "const _sbRed=d=>{const m=String(d||'').match(/(\\d{2})\\.(\\d{2})\\.(\\d{4})/);"
    + "return m?m[3]+m[2]+m[1]:String(d||'');};\n"
    + [
        'function _sbDanni(p){return p.sobstvenost;}',
        'function _sbLice(s,id){return (s.lica||[]).find(x=>x.id===id);}',
        'function _sbImeLice(s,id){return (_sbLice(s,id)||{}).ime||"";}',
        'function _sbImeObekt(s,id){const o=(s.obekti||[]).find(x=>x.id===id);'
        + 'return o?(o.ime||o.opisanie||o.id):"";}',
        'function _sbVazlozhiteli(p,data){return p.__vaz;}',
      ].join('\n') + '\n'
    + ['_sbVpisvane', '_sbVpisvaneTekst', '_sbNotariusTekst', '_sbPalnomoshtnoTekst',
       '_sbAktTekst', '_sbOsnovaniaBlok'].map(n => grab(s, n)).join('\n')
    + '\nreturn {_sbOsnovaniaBlok,_sbVpisvane,_sbVpisvaneTekst,_sbPalnomoshtnoTekst,_sbAktTekst};')();

function grab(izvor, ime) {
    const i = izvor.indexOf('function ' + ime + '(');
    if (i < 0) throw new Error('няма функция ' + ime);
    let k = izvor.indexOf('{', i), b = 0;
    for (; k < izvor.length; k++) {
        if (izvor[k] === '{') b++;
        else if (izvor[k] === '}') { b--; if (!b) return izvor.slice(i, k + 1); }
    }
    throw new Error('не намирам края на ' + ime);
}

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

// ── обектът от еталона ───────────────────────────────────────────────────────

const AKT = 'Нотариален акт №143, том IV, рег.№4672, дело №653';
const OBEKT = {
    sobstvenost: {
        lica: [{ id: 'l1', ime: 'Иван Станчев Станчев', vid: 'физическо',
                 predstavitel: { ime: 'Димитри Петракиев', nomer: '4676',
                                 data: '19.11.2021', notarius: '263', obhvat: 'общо' } }],
        obekti: [{ id: 'o1', ime: 'апартамент №10 (десет)' }],
        sabitia: [{
            id: 'e1', obekt: 'o1', vid: 'покупко-продажба', data: '12.11.2021',
            dokument: AKT, notarius_nomer: '263',
            sv: { vhoden: '86700', akt: '64', tom: 'ССXXVII', delo: '67645/21' },
            pridobivashti: [{ lice: 'l1', dyal: { n: 1, d: 1 } }],
        }],
    },
    __vaz: [{ lice: 'l1', ime: 'Иван Станчев Станчев', prava: [{ obekt: 'o1' }] }],
};

const blok = f._sbOsnovaniaBlok(OBEKT, '');
const redove = blok.split('\n');

console.log('\nкакво излиза:\n' + blok.split('\n').map(x => '  ' + x).join('\n') + '\n');

t('блокът е четири реда', redove.length === 4, redove.length);
t('първи ред: имотът', redove[0] === 'За апартамент №10 (десет)', redove[0]);
t('втори ред: името с ГЛАВНИ', redove[1] === 'ИВАН СТАНЧЕВ СТАНЧЕВ', redove[1]);
t('трети ред започва с точка', redove[2].startsWith('• '), redove[2]);
t('актът е дословно от регистъра', redove[2].includes(AKT), redove[2]);
t('годината е от датата на акта', redove[2].includes('от 2021 г.'), redove[2]);
t('нотариусът е с номера си в НК', redove[2].includes('на Нотариус №263 в НК'), redove[2]);
t('вписването влиза цяло',
  redove[2].includes('вписан в СВ с вх. рег. №86700, акт 64, том ССXXVII, дело №67645/21 г.'),
  redove[2]);
t('актът се чете като изречение, не като изброяване',
  redove[2].includes('дело №653 от 2021 г. на Нотариус №263 в НК, вписан в СВ'), redove[2]);
t('четвърти ред: пълномощникът',
  redove[3] === '• представляван от пълномощника си Димитри Петракиев, надлежно упълномощен '
              + 'с пълномощно рег. №4676 от 19.11.2021 г. на нотариус №263 в НК', redove[3]);

// ── какво става, когато нещо липсва ─────────────────────────────────────────
// Правило: липсващото НЕ се измисля и редът за него просто не излиза.

const bezNishto = JSON.parse(JSON.stringify(OBEKT));
delete bezNishto.sobstvenost.sabitia[0].sv;
delete bezNishto.sobstvenost.sabitia[0].notarius_nomer;
delete bezNishto.sobstvenost.lica[0].predstavitel;
const b2 = f._sbOsnovaniaBlok(bezNishto, '');
t('без вписване — няма „вписан в СВ“', !/вписан в СВ/.test(b2), b2);
t('без номер на нотариус — няма „Нотариус №“', !/Нотариус №/.test(b2), b2);
t('без пълномощно — няма четвърти ред', b2.split('\n').length === 3, b2);
t('актът и имотът си остават',
  b2.includes(AKT) && b2.includes('апартамент №10'), b2);
t('не остават празни точки или запетайки',
  !/,\s*,|,\s*$|•\s*$/m.test(b2), b2);

// частично вписване — излиза само попълненото
const chastichno = JSON.parse(JSON.stringify(OBEKT));
chastichno.sobstvenost.sabitia[0].sv = { vhoden: '86700', akt: '', tom: '', delo: '' };
const b3 = f._sbOsnovaniaBlok(chastichno, '');
t('частично вписване: само вх. рег.',
  b3.includes('вписан в СВ с вх. рег. №86700') && !b3.includes('акт ,'), b3);

// пълномощно без нотариус — редът пак излиза
const bezNot = JSON.parse(JSON.stringify(OBEKT));
delete bezNot.sobstvenost.lica[0].predstavitel.notarius;
t('пълномощно без нотариус пак се цитира',
  /пълномощно рег\. №4676 от 19\.11\.2021 г\.$/m.test(f._sbOsnovaniaBlok(bezNot, '')),
  f._sbOsnovaniaBlok(bezNot, ''));

// ── няколко имота, няколко възложители ──────────────────────────────────────

const dvaImota = JSON.parse(JSON.stringify(OBEKT));
dvaImota.sobstvenost.obekti.push({ id: 'o2', ime: 'апартамент №11 (единадесет)' });
dvaImota.__vaz[0].prava.push({ obekt: 'o2' });
const b4 = f._sbOsnovaniaBlok(dvaImota, '');
t('двата имота се изброяват на един ред',
  b4.split('\n')[0] === 'За апартамент №10 (десет), апартамент №11 (единадесет)',
  b4.split('\n')[0]);
t('актът НЕ се преписва два пъти',
  (b4.match(/Нотариален акт №143/g) || []).length === 1, b4);

const dvama = JSON.parse(JSON.stringify(OBEKT));
dvama.sobstvenost.lica.push({ id: 'l2', ime: 'Мария Иванова Петрова', vid: 'физическо' });
dvama.sobstvenost.obekti.push({ id: 'o2', ime: 'гараж №3' });
dvama.sobstvenost.sabitia.push({
    id: 'e2', obekt: 'o2', data: '03.05.2022', dokument: 'Нотариален акт №77, том II',
    pridobivashti: [{ lice: 'l2', dyal: { n: 1, d: 1 } }],
});
dvama.__vaz.push({ lice: 'l2', ime: 'Мария Иванова Петрова', prava: [{ obekt: 'o2' }] });
const b5 = f._sbOsnovaniaBlok(dvama, '');
t('двама възложители — два блока, делени с празен ред',
  b5.split('\n\n').length === 2, b5.split('\n\n').length);
t('всеки носи своя имот',
  /За апартамент №10[^]*За гараж №3/.test(b5), b5);
t('всеки носи своя акт',
  b5.includes('Нотариален акт №143') && b5.includes('Нотариален акт №77'), b5);

// ── празен регистър ─────────────────────────────────────────────────────────

t('празен регистър връща празно, не измисля',
  f._sbOsnovaniaBlok({ sobstvenost: { lica: [], obekti: [], sabitia: [] }, __vaz: [] }, '') === '');

// ── дребното ────────────────────────────────────────────────────────────────

t('празно вписване не се пази изобщо',
  f._sbVpisvane({ sv_vhoden: '', sv_akt: '', sv_tom: '', sv_delo: '' }) === undefined);
t('едно попълнено поле прави вписване',
  !!f._sbVpisvane({ sv_vhoden: '86700' }));
t('текстът на празното вписване е празен', f._sbVpisvaneTekst(undefined) === '');
t('пълномощно без име не дава ред', f._sbPalnomoshtnoTekst({ nomer: '1' }) === '');

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — основанията стоят`);
process.exit(loshi.length ? 1 : 0);
