// Отваря PWA наистина и минава през всичките страници.
//
// Дотук пробите проверяваха отделни функции. Тази проверява, че приложението
// изобщо се вдига и че всяка страница се рисува, без да хвърли грешка — това е
// мрежата, без която разделянето на файла е сляпо. (13.10.2026)
//
// Сървърът не се вика: всяко /api/… се отговаря отвътре. Пробата е за PWA.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

// Пътят може да се подаде, за да се пробва и счупено копие:
//   node probi/proba_stranici.js  <път до html>
const HTML = process.argv[2] || path.join(__dirname, '..', 'index.html');

// ── отговорите вместо сървъра ──────────────────────────────────────────────
const OTGOVORI = {
    // Формата е същата като на сървъра (api.py: red, po_izbor, po_podrazbirane,
    // grupi[].{moment,minal,gotovi,lipsvat,se_sastavya,dokumenti}). Пропуснат
    // ключ тук значи фалшива тревога, а не дефект — затова се пази пълна.
    '/api/nadzor': {
        red: ['ОСИП', 'РС', 'Протокол 1', 'Протокол 2', 'Акт 14', 'Акт 15', 'Акт 16', 'ОД'],
        po_izbor: ['Акт 16'], po_podrazbirane: { 'Акт 16': true },
        grupi: [{ moment: 'ОСИП', minal: true, gotovi: 0, lipsvat: 2,
                  se_sastavya: true, po_podrazbirane: true, dokumenti: [
            { dokument: 'Виза за проектиране', uslovie: 'винаги', vliza_v: ['ОСИП'], sastoyanie: 'очаква се' },
            { dokument: 'Документ за собственост на имота', uslovie: 'винаги', vliza_v: ['ОСИП'], sastoyanie: 'очаква се' }] },
            { moment: 'Акт 15', minal: false, gotovi: 0, lipsvat: 0,
              se_sastavya: true, po_podrazbirane: true, dokumenti: [
            { dokument: 'Протокол за единични изпитвания', uslovie: 'винаги', vliza_v: ['Акт 15'], sastoyanie: 'не му е времето' }] }] },
    '/api/zk': { nachalen: 1, sledvasht: 2, prazniny: [], knigi: [] },
    '/api/consultants': { consultants: [] },
    '/api/danni': {},
    '/api/history': { history: [] },
};
function otgovor(url) {
    for (const k of Object.keys(OTGOVORI)) if (url.includes(k)) return OTGOVORI[k];
    return {};
}

// ── обектът, с който се тества ─────────────────────────────────────────────
// Истинският обект винаги има консултант; без него „Съставяне на документи“
// основателно вика „Консултантът не е намерен“ и пробата гони призраци.
const KONSULTANT = {
    id: 1, name: 'СиБиТи Консулт ЕООД', eik: '123456789', type: 'ЮЛ',
    license: 'РК-0001', manager: 'инж. Проба Пробова', rep: 'инж. Проба Пробова',
    address: 'гр. София', employees: [],
};

const OBEKT = {
    id: 'proba-1', pi: '68134.4354.781', name: 'Жилищна сграда — проба',
    nik: 'Проба', consultant: { id: 1, name: 'СиБиТи Консулт ЕООД' },
    clients: [{ type: 'ЮЛ', name: 'Възложител ЕООД', eik: '987654321' }],
    builder: { company: 'Строител АД', eik: '111222333', manager: 'инж. Строителев' },
    permit: { number: '147', date: '12.03.2024', issuer: 'Главен архитект' },
    vid: 'сграда', prednaznachenie: 'жилищна', kategoria: 5,
    fakti: { identifikator: { sastoyanie: 'predlozheno', stoynost: '68134.4354.781', chasti: ['Архитектурна'] },
             etaji: { sastoyanie: 'predlozheno', stoynost: '5', chasti: ['Архитектурна'] } },
    sobstvenost: {
        lica: [{ id: 'l1', ime: 'Иван Георгиев Петров' }],
        obekti: [{ id: 'o1', vid: 'земя', identifikator: '68134.4354.781' }],
        sabitia: [{ id: 's1', obekt: 'o1', data: '01.01.2020', vid: 'първоначално',
                    ot: null, na: 'l1', dyal: '1/1', dokument: 'НА № 1' }],
    },
};

const STRANICI = ['passports', 'new-passport', 'imot', 'sobstvenost', 'kakav', 'proekt',
                  'dokumentite', 'osip', 'nadzor', 'consultants', 'zk', 'normativna',
                  'history', 'settings'];

async function pusni() {
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push('jsdom: ' + (e.message || e)));
    vc.on('error', (...a) => greshki.push('конзола: ' + a.join(' ')));

    const dom = new JSDOM(fs.readFileSync(HTML, 'utf8'), {
        runScripts: 'dangerously', url: 'http://localhost/', pretendToBeVisual: true,
        virtualConsole: vc, beforeParse(w) {
            // Обектът влиза през localStorage — така, както влиза при истинска
            // работа. (13.10.2026: подаван отвън през window.appData, той НЕ
            // стигаше до приложението и страниците рисуваха „Изберете обект“;
            // пробата беше куха и минаваше дори счупена.)
            w.localStorage.setItem('akt_v5', JSON.stringify({
                projects: [OBEKT], currentProject: OBEKT, consultants: [KONSULTANT], history: [],
                apiUrl: 'http://localhost/api',
            }));
            w.localStorage.setItem('akt_token', 'proba');
            w.localStorage.setItem('akt_user', JSON.stringify({ email: 'proba@proba.bg', role: 'admin' }));
        },
    });
    const w = dom.window;

    // Сървърът, само на хартия.
    w.fetch = async (url) => ({
        ok: true, status: 200, headers: { get: () => 'application/json' },
        json: async () => otgovor(String(url)),
        text: async () => JSON.stringify(otgovor(String(url))),
        blob: async () => new w.Blob([]),
    });
    w.alert = () => {};
    w.confirm = () => true;
    w.prompt = () => null;
    w.scrollTo = () => {};
    if (w.navigator && !w.navigator.serviceWorker) {
        Object.defineProperty(w.navigator, 'serviceWorker',
            { value: { register: async () => ({}) }, configurable: true });
    }

    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 300));

    if (typeof w.navigateTo !== 'function') {
        console.log('  ЛО  приложението не се вдигна — няма navigateTo');
        for (const g of greshki.slice(0, 5)) console.log('      ' + g);
        return 1;
    }

    // Без обект страниците рисуват „Изберете обект“ и всичко минава на сухо.
    const broj = w.document.getElementById('nav-passports-count');
    if (!broj || broj.textContent.trim() === '0') {
        console.log('  ЛО  обектът не е зареден — пробата би минала на сухо');
        return 1;
    }

    const dobri = [], loshi = [];
    for (const str of STRANICI) {
        const predi = greshki.length;
        let padna = null;
        try {
            w.navigateTo(str);
            await new Promise(r => setTimeout(r, 400));
        } catch (e) {
            padna = e.message;
        }
        const novi = greshki.slice(predi);
        const kutiya = w.document.getElementById('page-' + str);
        const prazna = !kutiya || !kutiya.textContent.trim();
        // Страниците ловят грешките си сами и показват червен ред — текстът е
        // налице и празната проверка минава. Затова се чете и КАКВО пише.
        // (Пробата с нарочно счупване, 13.10.2026: не хвана нищо.)
        const tekst = kutiya ? kutiya.textContent : '';
        const chervenoto = kutiya && kutiya.querySelector('.alert-error');
        const sledi = tekst.match(/is not defined|is not a function|Cannot read|TypeError|ReferenceError|undefined/);
        if (padna) loshi.push([str, padna]);
        else if (novi.length) loshi.push([str, novi[0]]);
        else if (prazna) loshi.push([str, 'страницата остава празна']);
        else if (chervenoto) loshi.push([str, 'червен ред: ' + chervenoto.textContent.trim().slice(0, 90)]);
        else if (sledi) loshi.push([str, 'следа от грешка в текста: „' + sledi[0] + '“']);
        else dobri.push(str);
    }

    for (const d of dobri) console.log('  ok  страница „' + d + '“ се рисува');
    for (const [str, zashto] of loshi) console.log('  ЛО  страница „' + str + '“ — ' + zashto);

    // Необработените грешки при зареждане също са дефект.
    const priZarezhdane = greshki.filter(g => !loshi.some(([, z]) => z === g));
    for (const g of priZarezhdane.slice(0, 5)) console.log('  ЛО  при зареждане: ' + g);

    const lo = loshi.length + Math.min(priZarezhdane.length, 5);
    console.log(lo ? `\n${lo} проблема от ${STRANICI.length} страници`
                   : `\n${dobri.length} страници — всички се рисуват`);
    return lo ? 1 : 0;
}

// Грешка, която изскочи извън страницата (например в асинхронно продължение),
// също е дефект — иначе пробата умира с гол стек и „Node.js v22“ накрая.
const izvan = kak => e => {
    console.log('  ЛО  ' + kak + ': ' + (e && e.message));
    console.log('\n1 проблем — приложението хвърли извън страницата');
    process.exit(1);
};
process.on('uncaughtException', izvan('необработена грешка'));
process.on('unhandledRejection', izvan('необработено отхвърляне'));

pusni().then(k => process.exit(k)).catch(e => { console.log('  ЛО  ' + e.stack); process.exit(1); });
