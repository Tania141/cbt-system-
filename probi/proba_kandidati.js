// Прочетеното, което го няма в чеклиста — кандидат, не изискване.
//
// Операторът, 20.10.2026: „всеки документ, който четецът прочете и не е част
// от листата, да го добавя към характера на обекта“. Уговорката: влиза като
// КАНДИДАТ, брои се, и чак на третото появяване системата пита веднъж.
const { kod, grab, parche } = require('./kod');
const s = kod();

const F = new Function(
    "const _s2esc=x=>String(x??'');let _zapisi=[],_zapisano={};\n"
    + 'const _KES_POLETA=' + s.slice(s.indexOf('const _KES_POLETA = [') + 19,
                                    s.indexOf('\n];', s.indexOf('const _KES_POLETA = [')) + 2) + ';\n'
    + 'const _KES_IME=Object.fromEntries(_KES_POLETA.map(([k,i])=>[k,i]));\n'
    + parche(s, 'const _VID_KOD =', 'function _priznaciKamPoleta')
    + parche(s, 'const _SGRADA =', 'const _KES_IZBOR')
    + grab(s, '_kesSastavkiNa') + '\n'
    + parche(s, 'const _KAND_PRAG', '// Одобрението: кандидатът става ред')
    // `grab` реже от „function“ и изпуска „async“ — връща се тук.
    + ['kandDobavi', 'kandOtkazhi', 'kandMahni'].map(n => 'async ' + grab(s, n)).join('\n')
    + '\nlet _otgovor=null;let _t=null;'
    + 'const _zhivObekt=()=>_t;const _prerisuvai=()=>{};const showAlert=()=>{};'
    + 'const addHistory=()=>{};const prompt=()=>_otgovor;'
    + 'const _danniVzemi=async k=>_zapisano[k]||null;'
    + 'const _danniZapishi=async (k,v)=>{_zapisano[k]=JSON.parse(JSON.stringify(v));return true};'
    + '\nreturn {kandZabelezhi,kandZaPitane,kandVsichki,kandSobstveni,kandDobavi,'
    + 'kandOtkazhi,kandMahni,_kandHtml,kandZaredi,'
    + 'set:p=>{_t=p},otgovor:v=>{_otgovor=v},zapisano:()=>_zapisano};')();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const OBEKT = { pi: '68134.1006.2440', stroej: 'Външно електрозахранване с кабели СрН и нов шахтов ТП' };
const DRUG = { pi: '55419.6701.3247', stroej: 'Външно електрозахранване с кабели НН и нов БКТП' };

(async () => {
    F.set(OBEKT);
    await F.kandZaredi();

    const UD = 'Удостоверение за нанасяне в кадастъра';
    await F.kandZabelezhi(OBEKT, [{ ime: UD, fajl: 'Удостоверение.pdf' }]);
    t('непознатото се запомня', F.kandVsichki().length === 1, F.kandVsichki());
    t('но още не се пита', F.kandZaPitane().length === 0);
    t('помни съставките на строежа',
      (F.kandVsichki()[0].sastavki || []).includes('shtp'), F.kandVsichki()[0]);
    t('и обекта', (F.kandVsichki()[0].obekti || []).includes('68134.1006.2440'));

    // Същият файл втори път не брои за ново появяване.
    await F.kandZabelezhi(OBEKT, [{ ime: UD, fajl: 'Удостоверение.pdf' }]);
    t('същият файл не се брои два пъти', F.kandVsichki()[0].broy === 1, F.kandVsichki()[0].broy);

    await F.kandZabelezhi(DRUG, [{ ime: UD, fajl: 'Удостоверение 2.pdf' }]);
    t('друг файл на друг обект брои', F.kandVsichki()[0].broy === 2, F.kandVsichki()[0].broy);
    t('и още не пита', F.kandZaPitane().length === 0);

    await F.kandZabelezhi(DRUG, [{ ime: UD, fajl: 'Удостоверение 3.pdf' }]);
    t('на третото появяване пита', F.kandZaPitane().length === 1, F.kandZaPitane());
    t('казва колко пъти е видяно', F.kandZaPitane()[0].broy === 3);
    t('и при какви съставки',
      F.kandZaPitane()[0].sastavki.includes('shtp') && F.kandZaPitane()[0].sastavki.includes('bktp'),
      F.kandZaPitane()[0].sastavki);

    const html = F._kandHtml();
    t('изгледът пита веднъж', /срещан/.test(html) && /изисквай/.test(html));
    t('и предлага и двата етапа', /за да започна/.test(html) && /за да подпиша/.test(html));
    const o = (html.match(/<div/g) || []).length, z = (html.match(/<\/div>/g) || []).length;
    t(`баланс на div (${o}/${z})`, o === z);

    // ── одобрението ───────────────────────────────────────────────────────
    F.otgovor('Удостоверение за нанасяне на БКТП и кабели в кадастъра');
    const k = F.kandZaPitane()[0].klyuch;
    await F.kandDobavi(k, 'подпис');
    const sobstveni = F.kandSobstveni();
    t('одобреното става ред', sobstveni.length === 1, sobstveni);
    t('с името, което операторът даде',
      /нанасяне на БКТП/.test(sobstveni[0].dokument), sobstveni[0].dokument);
    t('с етап „подпис“', sobstveni[0].etap === 'подпис');
    t('и с условие за линеен обект, щом е срещан само там',
      /линеен/.test(sobstveni[0].uslovie), sobstveni[0].uslovie);
    t('основанието казва кога и къде',
      /добавен от оператора/.test(sobstveni[0].osnovanie)
      && /68134\.1006\.2440/.test(sobstveni[0].osnovanie), sobstveni[0].osnovanie);
    t('одобреното вече не чака', F.kandZaPitane().length === 0);
    t('записано е на сървъра', !!F.zapisano().cheklist_sobstveni
      && !!F.zapisano().kandidati, Object.keys(F.zapisano()));

    // Повторно прочитане не го връща като кандидат.
    await F.kandZabelezhi(OBEKT, [{ ime: UD, fajl: 'Удостоверение 4.pdf' }]);
    t('добавеният не се връща като кандидат', F.kandVsichki().length === 0, F.kandVsichki());

    // ── отказът ───────────────────────────────────────────────────────────
    await F.kandZabelezhi(OBEKT, [{ ime: 'Фактура за материали', fajl: 'Фактура.pdf' }]);
    const f = F.kandVsichki().find(x => /Фактура/.test(x.ime));
    await F.kandOtkazhi(f.klyuch);
    t('отказаното изчезва', !F.kandVsichki().some(x => /Фактура/.test(x.ime)));
    await F.kandZabelezhi(OBEKT, [{ ime: 'Фактура за материали', fajl: 'Фактура 2.pdf' }]);
    t('и не се връща при ново четене', !F.kandVsichki().some(x => /Фактура/.test(x.ime)));

    // ── махане на собствен ред ────────────────────────────────────────────
    await F.kandMahni(k);
    t('махнатият ред изчезва от чеклиста', F.kandSobstveni().length === 0);
    t('и се връща да чака', F.kandVsichki().some(x => x.klyuch === k), F.kandVsichki());

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема`
        : `\n${dobri.length} проверки — кандидатите чакат, не влизат сами`);
    process.exit(loshi.length ? 1 : 0);
})();
