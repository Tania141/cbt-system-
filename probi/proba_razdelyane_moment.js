// PDF с много документи се разделя — и в „Папката“, и в „📎 качи“.
//
// Радулов, 09.11.2026: акт7-1_8.pdf (8 акта обр. 7, по една страница) влезе в
// досието като ЕДИН документ. Разделянето беше върнато само в „Папката“;
// „📎 качи“ на реда четеше целия файл наведнъж.
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'akt', 'moment.js'), 'utf8');
const grab = ime => { const m = new RegExp('^(async )?function ' + ime + '\\b[\\s\\S]*?\\n}', 'm').exec(src); return m ? m[0] : ''; };

global.momentFajlove = {};
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

t('„Папката“ чете през общия помощник', /momentChetiFajl\(/.test(grab('momentProchetiOtmetnatite')), '');
t('„📎 качи“ чете през общия помощник', /momentChetiFajl\(/.test(grab('momentKachiFajl')), '');
t('никой вход не вика /chete покрай разделянето',
  !/sloy2\/chete/.test(grab('momentProchetiOtmetnatite') + grab('momentKachiFajl')), '');

(async () => {
    const zaiavki = [];
    const aktApi = async (url, _m, telo) => {
        zaiavki.push([url, telo.stranici || '']);
        if (url.endsWith('razdeli')) return { chasti: Array.from({ length: 8 }, (_, i) => ({ stranici: String(i + 1) })) };
        return { dokument: { vid: 'Акт обр. 7', stranici: telo.stranici } };
    };
    const momentBase64 = async () => 'AAA';
    const localStorage = { getItem: () => null };
    const momentChetiFajl = new Function('aktApi', 'momentBase64', 'localStorage',
        grab('momentChetiFajl') + '\nreturn momentChetiFajl;')(aktApi, momentBase64, localStorage);
    const z = { p: { pi: '1' } };
    const novi = await momentChetiFajl(z, { type: 'application/pdf' }, 'акт7-1_8.pdf', () => {});
    t('8 акта в един PDF → 8 документа', novi.length === 8, novi.length);
    t('всеки се чете със своята страница', zaiavki.filter(x => x[0].endsWith('chete')).map(x => x[1]).join(',') === '1,2,3,4,5,6,7,8', zaiavki);

    zaiavki.length = 0;
    const edno = await momentChetiFajl(z, { type: 'image/jpeg' }, 'акт.jpg', () => {});
    t('снимка не се разделя', edno.length === 1 && !zaiavki.some(x => x[0].endsWith('razdeli')), zaiavki);

    // Системата казва как е разделила (09.11.2026).
    t('прочетеното носи как е разделен файлът', novi.razdelyane && novi.razdelyane.chasti === 8, novi.razdelyane);
    zaiavki.length = 0;
    const aktApi1 = async (url, _m, telo) => { zaiavki.push([url, telo.po_stranici]);
        return url.endsWith('razdeli') ? { chasti: [{ stranici: '1-8' }], n: 8, chetec: 'Mistral' } : { dokument: { vid: 'Акт' } }; };
    const cheti1 = new Function('aktApi', 'momentBase64', 'localStorage',
        grab('momentChetiFajl') + '\nreturn momentChetiFajl;')(aktApi1, momentBase64, localStorage);
    const edin = await cheti1(z, { type: 'application/pdf' }, 'акт7-1_8.pdf', () => {});
    t('8 стр. като един документ — личи', edin.razdelyane.n === 8 && edin.razdelyane.chasti === 1, edin.razdelyane);
    const _e = x => String(x);
    const razdHtml = new Function('_e', grab('momentRazdelyaneHtml') + '\nreturn momentRazdelyaneHtml;')(_e);
    const html = razdHtml(edin.razdelyane);
    t('и екранът предлага „по 1 страница“', /един документ/.test(html) && /momentRazdeliPo\('[^']+', 1\)/.test(html), html);
    await cheti1(z, { type: 'application/pdf' }, 'акт7-1_8.pdf', () => {}, 1);
    t('„по 1 страница“ стига до сървъра', zaiavki.some(x => x[0].endsWith('razdeli') && x[1] === 1), zaiavki);
    t('нотариален акт (1 стр.) — нищо не се казва', razdHtml({ n: 1, chasti: 1, ime: 'x' }) === '', '');

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — и двата входа разделят`);
    process.exit(loshi.length ? 1 : 0);
})();
