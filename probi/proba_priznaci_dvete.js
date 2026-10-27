// ПРИЗНАЦИТЕ КЪМ ЧЕКЛИСТА — НА ДВЕ МЕСТА.
//
// `_nadzorPriznaci` (`js/08-momenti.js`) за старото ПВА и `aktPriznaci`
// (`akt/yadro.js`) за новото, защото модул 08 не се зарежда там.
//
// Разминат ли се, двете ПВА ще искат РАЗЛИЧНИ документи за един и същ строеж —
// и то мълчаливо: чеклистът просто ще отговори друго. Затова тази проба пуска
// двете върху едни и същи данни и сравнява отговорите им.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const KOREN = path.join(__dirname, '..');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

// Двете функции се изваждат от файловете си и се пускат с еднаква кухня:
// съставките идват от един и същи списък, за да се сравнява само сметката.
function vzemi(fajl, ime, podpora) {
    const src = fs.readFileSync(path.join(KOREN, fajl), 'utf8');
    const i = src.indexOf('function ' + ime);
    if (i < 0) return null;
    // краят на функцията: първата затваряща скоба в началото на ред
    const j = src.indexOf('\n}', i);
    const telo = src.slice(i, j + 2);
    const html = `<!DOCTYPE html><html><body><script>
        ${podpora}
        ${telo}
        window.__f = ${ime};
    </script></body></html>`;
    const greshki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(html, { runScripts: 'dangerously', virtualConsole: vc });
    return { f: dom.window.__f, greshki };
}

const SAST = "const _S = p => (p.sastavki_proba || []).map(k => ({ kod: k }));";

const staro = vzemi('js/08-momenti.js', '_nadzorPriznaci',
    SAST + '\nfunction _kesSastavkiNa(p) { return _S(p); }');
const novo = vzemi('akt/yadro.js', 'aktPriznaci',
    SAST + '\nfunction aktSastavki(p, st) { return _S(p); }');

t('старото ПВА дава _nadzorPriznaci', !!(staro && staro.f), staro && staro.greshki);
t('новото ПВА дава aktPriznaci', !!(novo && novo.f), novo && novo.greshki);

if (staro && staro.f && novo && novo.f) {
    const sluchai = [
        ['сграда с машини', { pi: '1', sastavki_proba: ['sgrada'] },
         { vid: 'sgrada', kategoria: '4', imaMashini: true }],
        ['линеен с шахтов ТП', { pi: '2', sastavki_proba: ['shtp', 'kabel_srn'] },
         { vid: 'lineen', kategoria: '3', dpk_naznachena: true }],
        ['празен строеж', { pi: '3' }, {}],
        ['всичко включено', { pi: '4', sastavki_proba: ['sgrada', 'bktp'] },
         { vid: 'sgrada', kategoria: '1', imaMashini: true, metalnaKonstrukcia: true,
           dpk_naznachena: true, protokol17_poiskan: true }],
    ];
    for (const [ime, p, st] of sluchai) {
        const a = staro.f({ ...p, ...st }, st);
        const b = novo.f({ ...p, ...st }, st);
        t(`„${ime}“ — двете дават едно и също`,
          JSON.stringify(Object.keys(a).sort().map(k => [k, a[k]]))
          === JSON.stringify(Object.keys(b).sort().map(k => [k, b[k]])), { a, b });
    }

    // Същината: условието на научен ред трябва да има какво да изпълни.
    const p = { pi: '2', sastavki_proba: ['shtp', 'kabel_srn'], vid: 'lineen' };
    const pr = novo.f(p, p);
    t('съставките излизат като признаци',
      pr.sast_shtp === true && pr.sast_kabel_srn === true, pr);
    t('видът излиза и на латиница, и на кирилица — старите условия са на кирилица',
      pr.vid === 'lineen' && pr['вид'] === 'lineen', pr);
    t('непритежавана съставка НЕ се появява', pr.sast_bktp === undefined, pr);
}

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — признаците са едни`);
process.exit(loshi.length ? 1 : 0);
