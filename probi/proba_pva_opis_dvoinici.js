// Един документ — един запис в описа (26.11.2026).
//
// Радулов: договорът с ЕРМ № 1205463907 стоеше четири пъти в описа и два пъти
// в 1.5 на Акт 15. Причините, видени в данните:
//   · „✔ запиши“ за ред от „Липсва ми“ вписваше документа с истинското му име
//     И добавяше втори запис с името на реда;
//   · записи от файлове, прочетени преди изчистването, останаха — „изчисти и
//     тях“ се виждаше само при празно досие.
const fs = require('fs');
const path = require('path');
const read = f => fs.readFileSync(path.join(__dirname, '..', 'akt', f), 'utf8');
const grab = (src, ime) => { const m = new RegExp('^(async )?function ' + ime + '\\b[\\s\\S]*?\\n}', 'm').exec(src); return m ? m[0] : ''; };
const moment = read('moment.js'), dosie = read('dosie.js');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

// ── „✔ запиши“ за ред: не добавя втори запис ────────────────────────────────
{
    const st = { dokumenti: [], nadzor_otmetnati: [], sloy2: { od: { dokumenti: [], potvardeni: {}, chakat: [
        { id: 'ЕРМ.pdf', fajl: 'ЕРМ.pdf', vid: 'Договор за присъединяване', nomer: { stoynost: '1205463907' }, data: { stoynost: '13.06.2024' }, _za_red: 'Договор за присъединяване от електроразпределителното дружество' }] } } };
    const z = { p: st, st };
    let zatvoreni = 0;
    const F = new Function('z0', `
        const momentZhiv = () => z0; let momentSaobshtenie = '', momentRazdel = '', momentHod = {};
        const _momentCh = () => ({ z: z0, id: 'ЕРМ.pdf', d: {} });
        const _e = x => x, aktChakat = st => st.sloy2.od.chakat, momentRisuvai = () => {}, momentZaredi = () => {}, aktZapishi = () => {};
        const aktZapishiProveren = (st, id) => { const d = st.sloy2.od.chakat.pop(); st.sloy2.od.dokumenti.push(d); return { dokument: d, zaRed: d._za_red, svereni: 2 }; };
        // _dokVpishiSverenite — вписва с истинското име, ot = файлът
        const _dokVpishiSverenite = (o, p, dok) => { for (const d of dok) if (!p.dokumenti.some(x => x.ot === d.id))
            p.dokumenti.push({ ime: 'Договор за присъединяване към ЕРМ', nomer: '№ 1205463907 от 13.06.2024', ot: d.id }); };
        const momentZatvoriRed = (red, nomer) => { z0.st.dokumenti.push({ ime: red, nomer, ot: 'прочетен' }); this.zatvoreni = (this.zatvoreni || 0) + 1; };
        ${grab(moment, 'momentChZapishi')}
        return momentChZapishi;`)(z);
    F('x');
    t('след „✔ запиши“ за ред — ЕДИН запис в описа', st.dokumenti.length === 1, st.dokumenti);
    t('записът е с истинското име и помни реда',
      st.dokumenti[0] && st.dokumenti[0].ot === 'ЕРМ.pdf' && st.dokumenti[0].red === 'Договор за присъединяване от електроразпределителното дружество', st.dokumenti[0]);
    t('редът е отметнат', st.nadzor_otmetnati.includes('Договор за присъединяване от електроразпределителното дружество'), st.nadzor_otmetnati);
}

// ── двойниците и сираците ───────────────────────────────────────────────────
{
    const dosieDvoinici = new Function(grab(dosie, 'dosieDvoinici') + '\nreturn dosieDvoinici;')();
    const s2 = { dokumenti: [{ fajl: 'ЕРМ.pdf', id: 'ЕРМ.pdf' }, { fajl: 'акт7.pdf', id: 'акт7.pdf#стр.2' }] };
    const st = { dokumenti: [
        { ime: 'Договор за присъединяване към ЕРМ', nomer: '№ 1205463907 от 13.06.2024', ot: 'ЕРМ.pdf' },
        { ime: 'Акт обр. 7', nomer: 'от 01.03.2024', ot: 'акт7.pdf#стр.2' },
        { ime: 'Договор (стар файл)', nomer: '№ ДПЕРМ 1205463907 от 13.06.2024', ot: 'ЕРМ R30.pdf#стр.1' },
        { ime: 'Договор за присъединяване от електроразпределителното дружество', nomer: '№ 1205463907 от 13.06.2024', ot: 'прочетен' },
        { ime: 'Полица', nomer: '№ 5 от 01.01.2026', ot: 'прочетен' },
        { ime: 'Виза', nomer: '№ 2', ot: 'вписан на ръка' },
    ] };
    const dv = dosieDvoinici(st, s2).map(d => d.ime);
    t('сирак: от файл, който вече не е в досието', dv.includes('Договор (стар файл)'), dv);
    t('двойник: „прочетен“ със същия номер като документ от досието', dv.includes('Договор за присъединяване от електроразпределителното дружество'), dv);
    t('документът от досието остава (и със „#стр.“)', !dv.includes('Договор за присъединяване към ЕРМ') && !dv.includes('Акт обр. 7'), dv);
    t('„прочетен“ без двойник остава', !dv.includes('Полица'), dv);
    t('вписаното на ръка остава', !dv.includes('Виза'), dv);
    t('бутонът е в досието и пита преди да махне',
      /dosieMahniDvoinici\(\)/.test(grab(dosie, 'dosieSpisakHtml')) && /confirm\(/.test(grab(dosie, 'dosieMahniDvoinici')), '');
    t('отметките в чеклиста не се пипат', !/nadzor_otmetnati/.test(grab(dosie, 'dosieMahniDvoinici')), '');
}

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — един документ, един запис`);
process.exit(loshi.length ? 1 : 0);
