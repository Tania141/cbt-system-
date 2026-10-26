// Вътрешните документи не бива да се сервират.
//
// Хранилището на ПВА-то се раздава ЦЯЛОТО като папка — всеки файл в него е
// публичен адрес. На 26.10.2026 се оказа, че `ЗАДАНИЕ.md`, `ДНЕВНИК.md` и
// `КАРТА-НА-МОМЕНТИТЕ.md` се четат от всеки, без парола. В тях има думи на
// оператора, имена на клиенти и цели технически проекти по чужди обекти.
//
// Тази проба пази правилото и — по-важното — следи да не се появи НОВ вид
// вътрешен файл, който пак да се окаже навън.
const fs = require('fs');
const path = require('path');

const KOREN = path.join(__dirname, '..');
const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const caddy = fs.readFileSync(path.join(KOREN, 'Caddyfile'), 'utf8');
const redove = caddy.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');

t('Caddyfile спира вътрешните документи',
  /respond\s+@\w+\s+404/.test(redove), redove.slice(0, 300));

const matcher = (redove.match(/@vatreshni\s+path([^\n]*)/) || ['', ''])[1];
t('правилото хваща *.md', matcher.includes('*.md'), matcher.trim());

// Кои файлове в корена НЕ са част от приложението. Появи ли се утре вътрешен
// документ с друго разширение, пробата ще го покаже.
const PRILOZHENIE = new Set(['.html', '.js', '.css', '.json', '.png', '.jpg', '.svg',
                             '.ico', '.webmanifest', '.lnk']);
const vatreshni = fs.readdirSync(KOREN)
    .filter(f => fs.statSync(path.join(KOREN, f)).isFile())
    .filter(f => !PRILOZHENIE.has(path.extname(f).toLowerCase()))
    .filter(f => f !== 'Caddyfile' && !f.startsWith('.'));

const nepokriti = vatreshni.filter(f => {
    const r = path.extname(f).toLowerCase();
    return r && !matcher.includes('*' + r);
});
t('няма вътрешен файл извън правилото', nepokriti.length === 0, nepokriti);

// Самото приложение трябва да си остане сервирано.
t('index.html НЕ е спрян', !matcher.includes('*.html'), matcher.trim());
t('скриптовете НЕ са спрени', !matcher.includes('*.js'), matcher.trim());

// И правилата отпреди да не са изядени.
t('правилото за кеша си стои', /Cache-Control\s+"?no-cache"?/.test(redove));
t('try_files си стои',
  /try_files\s+\{path\}\s+\{path\}\/index\.html\s+\/index\.html/.test(redove));

console.log('\nвътрешни документи в корена: ' + vatreshni.join(', ') + '\n');
dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — вътрешното си остава вътре`);
process.exit(loshi.length ? 1 : 0);
