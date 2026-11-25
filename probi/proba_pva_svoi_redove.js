// ТВОИТЕ РЕДОВЕ В „ЛИПСВА МИ“ (25.11.2026).
//
// „Изисквай“ от „Подобни обекти“ и „приеми“ от „Видени, но неописани“ вече
// идват от сървъра в групата на момента (`rules/sobstveni_momenti.py`). Пробата
// пази екрана: редът се вижда, казва, че е твой и откъде; „за преценка“ не
// сваля процента, докато не решиш.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const PAPKA = path.join(__dirname, '..', 'akt');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak).slice(0, 300)));
const tx = el => ((el && el.textContent) || '').replace(/\s+/g, ' ').trim();

function stranica() {
    let html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
    for (const m of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)])
        html = html.replace(m[0], () => '<script>' + fs.readFileSync(path.resolve(PAPKA, m[1]), 'utf8') + '</script>');
    return html;
}

const OB = { id: 'ob1', pi: '1.2.3', nik: 'Проба', vid: 'sgrada', tekusht_moment: 'Акт 15' };
const DOK = [
    { dokument: 'Разрешение за строеж', etap: 'начало', sastoyanie: 'налично' },
    { dokument: 'Протокол обр. 17 по ВиК', etap: 'подпис', sastoyanie: 'очаква се', sobstven: true,
      osnovanie: 'от подобен обект: „Денка“ (2025) · 2 от 2', za_precenka: false },
    { dokument: 'Удостоверение за кадастъра', etap: 'подпис', sastoyanie: 'очаква се', sobstven: true,
      osnovanie: 'добавен от оператора · срещан 1 път', za_precenka: true },
];

(async () => {
    const vc = new VirtualConsole(), greshki = [];
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranica(), { runScripts: 'dangerously',
        url: 'http://localhost/akt/#/moment/ob1/0/' + encodeURIComponent('Акт 15'), pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({ projects: [OB], consultants: [] }));
            w.localStorage.setItem('akt_token', 'proba');
            w.fetch = async () => ({ ok: true, status: 200, headers: { get: () => 'application/json' }, text: async () => '{}',
                json: async () => ({ red: ['Акт 15'], grupi: [{ moment: 'Акт 15', dokumenti: JSON.parse(JSON.stringify(DOK)) }] }) });
        } });
    const w = dom.window, d = w.document;
    w.confirm = () => true; w.alert = () => {}; w.scrollTo = () => {};
    await new Promise(r => setTimeout(r, 400));

    const red = ime => d.querySelector(`.lipsva-red[data-dokument="${ime}"]`);
    t('твоят ред „изисквай“ е в „Липсва ми“ на Акт 15', !!red('Протокол обр. 17 по ВиК'), tx(d.querySelector('.razdel-telo')));
    t('и казва, че е твой и откъде', /твой ред · от подобен обект: „Денка“ \(2025\)/.test(tx(red('Протокол обр. 17 по ВиК'))),
      tx(red('Протокол обр. 17 по ВиК')));
    t('приетото „за преценка“ го казва', /за преценка — „не се отнася“, ако не важи/.test(tx(red('Удостоверение за кадастъра'))),
      tx(red('Удостоверение за кадастъра')));
    t('и има качи · впиши · не се отнася', /качи/.test(tx(red('Удостоверение за кадастъра')))
      && /не се отнася/.test(tx(red('Удостоверение за кадастъра'))));

    const g = { moment: 'Акт 15', dokumenti: DOK };
    const dve = w.aktDveChisla(g, []);
    t('„за преценка“ не сваля процента — 1 от 2, не 1 от 3', dve.podpis.imam === 1 && dve.podpis.ot === 2, dve.podpis);
    const dve2 = w.aktDveChisla(g, ['Удостоверение за кадастъра']);
    t('„не се отнася“ на него — брои се като имаш', dve2.podpis.imam === 2 && dve2.podpis.ot === 3, dve2.podpis);
    t('изисканият твой ред се брои като липсващ', dve.podpis.lipsvat.includes('Протокол обр. 17 по ВиК'), dve.podpis);
    t('без грешки', !greshki.length, greshki.slice(0, 3));

    dobri.forEach(x => console.log('  ok  ' + x));
    loshi.forEach(x => console.log('  ЛО  ' + x));
    console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — твоите редове в „Липсва ми“`);
    process.exit(loshi.length ? 1 : 0);
})();
