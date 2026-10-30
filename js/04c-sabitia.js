// СТРОИТЕЛНАТА ИСТОРИЯ: моментите стават СЪБИТИЯ.
//
// Стъпка 2 по `ЗАДАНИЕ-ДОСИЕТО.md`. Думите са на оператора (30.10.2026):
//
//   Събитие — какво реално се е случило: „Изпълнена е плочата над кота +3,30.“
//   Обхват  — кои събития и елементи приема документът.
//   Документ — формалният акт: „Акт обр. 7 № …“
//
// Дотук моментът беше ПАПКА, в която се събират документи. Тук става СЪБИТИЕ:
// нещо, което се е случило на дата, доказано с опора, и прието или не.
//
// Суровината е една — тетрадката (`js/04b-spisak.js`). Тук не се чете файл и не
// се пита сървър; само се подрежда вече сверéното.

// Редът е този от `rules/izvori/моменти.md` — изведен от работния файл на
// оператора, не измислен тук.
const _SAB_VIDOVE = [
    { kod: 'rs',     kodove: ['RS'],            ime: 'Издадено е разрешение за строеж' },
    { kod: 'proekt', kodove: ['ODOBREN_PROEKT'], ime: 'Одобрен е инвестиционният проект' },
    { kod: 'p2',     kodove: ['PROTOKOL2'],     ime: 'Открита е строителната площадка' },
    { kod: 'zk',     kodove: ['ZK'],            ime: 'Заверена е заповедната книга' },
    { kod: 'obr3',   kodove: ['OBR3'],          ime: 'Установено е съответствието с книжата (обр. 3)' },
    { kod: 'obr5',   kodove: ['AKT5'],          ime: 'Съгласуван е строителният терен и е даден основен репер' },
    { kod: 'obr6',   kodove: ['AKT6'],          ime: 'Приета е земната основа и котите на изкопа' },
    { kod: 'obr7',   kodove: ['AKT7'],          ime: 'Приети са СМР по нива и елементи на конструкцията',
      poElementi: true },
    { kod: 'beton',  kodove: ['BETON_DNEVNIK'], ime: 'Положен е бетон (бетонов дневник)', bezData: true },
    { kod: 'obr12',  kodove: ['AKT12'],         ime: 'Приети са работи, подлежащи на закриване', poChasti: true },
    { kod: 'obr14',  kodove: ['AKT14'],         ime: 'Приета е конструкцията' },
    { kod: 'p17',    kodove: ['PROTOKOL17'],    ime: 'Проведена е 72-часова проба', poChasti: true },
    { kod: 'obr15',  kodove: ['AKT15'],         ime: 'Установена е годността за приемане' },
    { kod: 'u181',   kodove: ['UDOST_181'],     ime: 'Издадено е удостоверение по чл. 181 ЗУТ' },
    { kod: 'tp',     kodove: ['TEHN_PASPORT'],  ime: 'Съставен е технически паспорт' },
];

// Редът, който не може да се наруши. Всяка двойка е „по-ранното · по-късното ·
// защо“. Трите долу не са измислени: намерени са на истински обекти на
// 30.10.2026 при сверяване на Акт 15, окончателен доклад и паспорт.
const _SAB_RED = [
    ['rs', 'p2', 'площадката се открива след разрешението за строеж'],
    ['p2', 'obr5', 'актовете се съставят след откриване на площадката'],
    ['p2', 'obr6', 'актовете се съставят след откриване на площадката'],
    ['p2', 'obr7', 'актовете се съставят след откриване на площадката'],
    ['p2', 'obr12', 'актовете се съставят след откриване на площадката'],
    ['obr6', 'obr7', 'земната основа се приема преди конструкцията'],
    ['obr7', 'obr14', 'конструкцията се приема след актовете по нива'],
    ['obr14', 'obr15', 'годността се установява след приемане на конструкцията'],
];

// Частите. Същата таблица като `_A15_CHASTI` в `js/08-momenti.js`, нарочно
// повторена: новата повърхност не зарежда модула на Акт 15, а историята трябва
// да работи и там. `probi/proba_sabitia.js` пази двете да не се разминат.
const _SAB_CHASTI = [
    [/архитектур/i, 'Архитектура'], [/ви\s*к(?![а-я])|водопровод|канализац/i, 'ВиК'],
    [/електро|ел\.\s*инстал/i, 'Електро'], [/овк|отоплен|вентилац|климат/i, 'ОВК'],
];

function _sabChast(r) {
    const d = r.izvor || {};
    const t = [r.ime, r.vid, d.cheklist_red, (d.sadarzhanie || {}).stoynost]
        .filter(Boolean).join(' · ');
    for (const [kak, ime] of _SAB_CHASTI) if (kak.test(t)) return ime;
    return '';
}

// Кодът казва какво е; думите са последна опция — за ред без код (вписан на
// ръка или отметнат по чеклист). „DRUGO“ не е код: значи „четецът не позна“.
function _sabVid(r) {
    const kod = String(r.kod || '').trim();
    const tekst = [r.ime, r.vid].filter(Boolean).join(' · ');
    for (const v of _SAB_VIDOVE) {
        if (kod && kod !== 'DRUGO') { if (v.kodove.includes(kod)) return v; continue; }
        const kak = _SAB_DUMI[v.kod];
        if (kak && kak.test(tekst)) return v;
    }
    return null;
}

// Изразите за ред без код. Пазят се тук, а не в _SAB_VIDOVE, за да личи че са
// ПОСЛЕДНА опция.
const _SAB_DUMI = {
    rs: /разрешение\s+за\s+строеж/i,
    proekt: /одобрен[а-я]*\s+(инвестиционен\s+)?проект/i,
    p2: /протокол\s*(обр\.?|образец)?\s*№?\s*2\s*а?(?![\dа-я])|откриване\s+на\s+(строителна\s+)?площадка/i,
    zk: /заповедна\s+книга/i,
    obr3: /(акт|протокол)\s*(обр\.?|образец)?\s*№?\s*3(?![\dа-я])/i,
    obr5: /акт\s*(обр\.?|образец)?\s*№?\s*5(?![\dа-я])/i,
    obr6: /акт\s*(обр\.?|образец)?\s*№?\s*6(?![\dа-я])/i,
    obr7: /акт\s*(обр\.?|образец)?\s*№?\s*7(?![\dа-я])/i,
    beton: /бетонов\s+дневник/i,
    obr12: /акт\s*(обр\.?|образец)?\s*№?\s*12(?![\dа-я])/i,
    obr14: /акт\s*(обр\.?|образец)?\s*№?\s*14(?![\dа-я])/i,
    p17: /протокол\s*(обр\.?|образец)?\s*№?\s*17(?![\dа-я])/i,
    obr15: /акт\s*(обр\.?|образец)?\s*№?\s*15(?![\dа-я])/i,
    u181: /чл\.?\s*181/i,
    tp: /технически\s+паспорт/i,
};

function _sabChislo(data) {
    const m = String(data || '').match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
    if (!m) return 0;
    const g = m[3].length === 2 ? '20' + m[3] : m[3];
    return Number(g) * 10000 + Number(m[2]) * 100 + Number(m[1]);
}

// ИСТОРИЯТА. Един ред = едно събитие, с датата си, опорите си и приемането си.
function sabIstoria(p, st) {
    const redove = typeof dokTetradka === 'function' ? dokTetradka(p, st) : [];
    const poVid = new Map();
    for (const r of redove) {
        const v = _sabVid(r);
        if (!v) continue;
        // По части и по елементи събитието се цепи — иначе двайсет и четири
        // хартии с различни дати стават един ред и историята изчезва.
        const chast = v.poChasti ? _sabChast(r) : '';
        const klyuch = v.kod + (chast ? '·' + chast : '');
        if (!poVid.has(klyuch)) poVid.set(klyuch, { vid: v, chast, opori: [] });
        poVid.get(klyuch).opori.push(r);
    }
    const istoria = [];
    for (const [, g] of poVid) {
        const dati = g.opori.map(r => String(r.data || '').trim()).filter(Boolean)
            .sort((a, b) => _sabChislo(a) - _sabChislo(b));
        istoria.push({
            kod: g.vid.kod,
            ime: g.vid.ime + (g.chast ? ` — част ${g.chast}` : ''),
            chast: g.chast,
            data: dati[0] || '',
            do: dati.length > 1 && dati[dati.length - 1] !== dati[0] ? dati[dati.length - 1] : '',
            broj: g.opori.length,
            opori: g.opori,
            // Приемането е на събитието, а не на документа: прието е, когато
            // ВСИЧКИТЕ му опори са сверени.
            priemane: g.opori.every(r => r.sveren) ? 'потвърдено' : '',
        });
    }
    const red = _SAB_VIDOVE.map(v => v.kod);
    return istoria.sort((a, b) => {
        const d = _sabChislo(a.data) - _sabChislo(b.data);
        return d || (red.indexOf(a.kod) - red.indexOf(b.kod));
    });
}

// КОНФЛИКТИТЕ В РЕДА. Връща само истински нарушения — събития без дата не се
// съдят, защото липсата на дата не е нарушен ред.
function sabKonflikti(istoria) {
    const poKod = new Map();
    for (const s of istoria) {
        if (!s.data) continue;
        const d = _sabChislo(s.data);
        if (!poKod.has(s.kod) || d < poKod.get(s.kod).chislo)
            poKod.set(s.kod, { chislo: d, sabitie: s });
    }
    const out = [];
    for (const [rano, kysno, zashto] of _SAB_RED) {
        const a = poKod.get(rano), b = poKod.get(kysno);
        if (!a || !b || b.chislo >= a.chislo) continue;
        out.push({
            rano: a.sabitie, kysno: b.sabitie, zashto,
            tekst: `„${b.sabitie.ime}“ (${b.sabitie.data}) е преди „${a.sabitie.ime}“ `
                 + `(${a.sabitie.data}) — ${zashto}`,
        });
    }
    return out;
}
