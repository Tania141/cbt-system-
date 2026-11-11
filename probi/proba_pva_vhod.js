// Входът в новото ПВА (11.11.2026).
//
// Операторът: „паролата е 24 часа, тя отваря старото ПВА винаги, за да се
// презареди“ — а старото подменяше обектите и изтри работата. Новото влиза само.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const PAPKA = path.join(__dirname, '..', 'akt');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

function stranica() {
    let html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');
    for (const m of [...html.matchAll(/<script src="([^"]+)"><\/script>/g)])
        html = html.replace(m[0], () => '<script>' + fs.readFileSync(path.resolve(PAPKA, m[1]), 'utf8') + '</script>');
    return html;
}

const jwt = exp => 'x.' + Buffer.from(JSON.stringify({ sub: '1', exp })).toString('base64url') + '.y';

async function otvori(token, otgovor) {
    const greshki = [], zaiavki = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => greshki.push(String(e.message || e)));
    const dom = new JSDOM(stranica(), {
        runScripts: 'dangerously', url: 'http://localhost/akt/#/plot', pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
            w.localStorage.setItem('akt_v5', JSON.stringify({ projects: [], consultants: [], apiUrl: 'http://localhost/api' }));
            if (token) w.localStorage.setItem('akt_token', token);
            w.localStorage.setItem('akt_user', JSON.stringify({ email: 'tania@example.com' }));
            w.fetch = async (url, opt) => {
                zaiavki.push([String(url), JSON.parse((opt && opt.body) || '{}')]);
                if (/auth\/login/.test(url)) return otgovor;
                return { ok: false, status: 401, json: async () => ({}) };
            };
        },
    });
    const w = dom.window;
    await new Promise(r => w.addEventListener('load', r, { once: true }));
    await new Promise(r => setTimeout(r, 150));
    return { w, d: w.document, greshki, zaiavki };
}

(async () => {
// 1. Без токен — входът веднага, с имейла от последния път
const a = await otvori(null, { ok: true, status: 200, json: async () => ({ token: jwt(Date.now() / 1000 + 86400), email: 'tania@example.com', role: 'admin' }) });
t('без токен — входът е отворен', !!a.d.getElementById('akt-vhod'), '');
t('имейлът от последния път е попълнен', a.d.getElementById('vhod-email').value === 'tania@example.com', '');
a.d.getElementById('vhod-parola').value = 'тайна';
await a.w.aktVlez();
const z = a.zaiavki.find(x => /auth\/login/.test(x[0]));
t('влизането ходи до сървъра с имейла и паролата', z && z[1].email === 'tania@example.com' && z[1].password === 'тайна', z);
t('токенът се пази — същият ключ, който чете и старото', /^x\./.test(a.w.localStorage.getItem('akt_token') || ''), '');
t('входът се затваря', !a.d.getElementById('akt-vhod'), '');
t('в шапката — кой е влязъл и „изход“', /tania@example\.com/.test(a.d.getElementById('shapka-vhod').textContent)
  && /изход/.test(a.d.getElementById('shapka-vhod').textContent), a.d.getElementById('shapka-vhod').textContent);
t('данните не са пипнати', JSON.parse(a.w.localStorage.getItem('akt_v5')).projects.length === 0, '');

// 2. Изтекъл токен — входът
const b = await otvori(jwt(Date.now() / 1000 - 10), null);
t('изтекъл токен — входът е отворен', !!b.d.getElementById('akt-vhod'), '');

// 3. Грешна парола — казва се, входът остава
const c = await otvori(null, { ok: false, status: 401, json: async () => ({ error: 'Грешен имейл или парола' }) });
c.d.getElementById('vhod-parola').value = 'грешна';
await c.w.aktVlez();
t('грешна парола — казва се на място', /Грешен имейл или парола/.test(c.d.getElementById('vhod-greshka').textContent)
  && !!c.d.getElementById('akt-vhod'), c.d.getElementById('vhod-greshka').textContent);

// 4. Валиден токен, но сървърът казва 401 — входът се отваря тук
const d = await otvori(jwt(Date.now() / 1000 + 86400), null);
t('с валиден токен — без вход', !d.d.getElementById('akt-vhod'), '');
await d.w.aktApi('/api/nadzor', 'POST', {}).catch(() => {});
t('401 от сървъра — входът се отваря тук, не в старото', !!d.d.getElementById('akt-vhod'), '');
t('грешката за изтекъл достъп вече не праща към старото ПВА',
  !/index\.html/.test(d.w.aktGreshkaHtml({ izteklo: true })), d.w.aktGreshkaHtml({ izteklo: true }));

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — новото ПВА влиза само`);
process.exit(loshi.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
