// Кешът: браузърът не бива да върви със стар код, без да личи.
//
// На 23.10.2026 Акт 15 излизаше празен от код, който ВЕЧЕ беше поправен и
// горе. Причината не беше в кода: сървърът не казваше нищо за кеширане —
// само етикет за сверяване — а адресите на скриптовете нямат версия. Без
// `Cache-Control` браузърът сам решава колко да ползва старото копие, без да
// пита сървъра.
//
// Същият корен има и бележката в index.html от 14.10.2026: „стар service
// worker продължава да сервира от кеша и Ctrl+F5 не винаги го бие“.
const fs = require('fs');
const path = require('path');

const KOREN = path.join(__dirname, '..');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const caddy = fs.readFileSync(path.join(KOREN, 'Caddyfile'), 'utf8');
const redove = caddy.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');

t('Caddyfile казва на браузъра за кеша',
  /Cache-Control/.test(redove), redove.slice(0, 200));

t('правилото е „сверявай всеки път“, не „не кеширай“',
  /Cache-Control\s+"?no-cache"?/.test(redove),
  (redove.match(/Cache-Control[^\n]*/) || [''])[0]);

const matcher = (redove.match(/@kod\s+path([^\n]*)/) || ['', ''])[1];
for (const vid of ['*.html', '*.js', '*.css'])
    t(`правилото хваща ${vid}`, matcher.includes(vid), matcher.trim());

t('правилото се прилага към този набор',
  /header\s+@kod\s+Cache-Control/.test(redove),
  (redove.match(/header[^\n]*/) || [''])[0]);

// Наборът трябва да покрива ВСИЧКО, което браузърът изпълнява. Добави ли се
// утре нов вид файл с код, правилото трябва да го хване и него.
const izpalnimi = new Set();
for (const papka of ['js', 'akt', '.']) {
    const p = path.join(KOREN, papka);
    if (!fs.existsSync(p)) continue;
    for (const f of fs.readdirSync(p)) {
        const r = path.extname(f).toLowerCase();
        if (['.js', '.css', '.html'].includes(r)) izvadi(r);
    }
}
function izvadi(r) { izpalnimi.add('*' + r); }
const nepokriti = [...izpalnimi].filter(x => !matcher.includes(x));
t('няма изпълним файл извън правилото', nepokriti.length === 0, nepokriti);

// И двете страници трябва да се сервират — правилото за кеша не бива да е
// изяло try_files.
t('try_files още пуска „/akt/“ към своя index.html',
  /try_files\s+\{path\}\s+\{path\}\/index\.html\s+\/index\.html/.test(redove),
  (redove.match(/try_files[^\n]*/) || [''])[0]);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — кешът не крие стар код`);
process.exit(loshi.length ? 1 : 0);
