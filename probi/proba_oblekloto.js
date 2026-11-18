// Облеклото на новото ПВА — одобрено от оператора на 18.11.2026
// (раздел 0 на ЗАДАНИЕ-ДОСИЕТО.md). Пробата пази решенията, не вида:
// основата RAL 6004 и RAL 1004, средата 15 % 1004, обектът 30 % 6004,
// шрифт с кирилица, логото „Фронтон и кота“ и лентата горе в 6004.
const fs = require('fs');
const path = require('path');

const PAPKA = path.join(__dirname, '..', 'akt');
const css = fs.readFileSync(path.join(PAPKA, 'stil.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const html = fs.readFileSync(path.join(PAPKA, 'index.html'), 'utf8');

const dobri = [], loshi = [];
const t = (ime, verno) => (verno ? dobri : loshi).push(ime);
const root = (css.match(/:root\s*\{([^}]*)\}/) || [])[1] || '';
const tok = ime => ((root.match(new RegExp('--' + ime + ':\\s*([^;]+);')) || [])[1] || '').trim().toLowerCase();

t('RAL 6004 е #1f4447', tok('ral6004') === '#1f4447');
t('RAL 1004 е #e0a21c', tok('ral1004') === '#e0a21c');
t('„чака теб“ е RAL 1004', tok('gold') === tok('ral1004'));
t('средата е бяло + 15 % RAL 1004 (#faf1dd)', tok('krem') === '#faf1dd');
t('обектът е бяло + 30 % RAL 6004 (#bcc7c8)', tok('obekt') === '#bcc7c8');
t('петте значения: зелено, червено, сиво, синьо', ['green', 'red', 'sivo', 'blue'].every(k => /^#[0-9a-f]{6}$/.test(tok(k))));
t('зеленото не е синьо-зеленото на основата', tok('green') !== tok('ral6004'));

const body = (css.match(/\bbody\s*\{([^}]*)\}/) || [])[1] || '';
t('фонът на работата е топлият (krem)', /background:\s*var\(--krem\)/.test(body));
t('шрифтът не е DM Sans (няма кирилица)', !/DM Sans/.test(body) && /var\(--f-ui\)/.test(body));
t('Golos Text, PT Serif и IBM Plex Mono се зареждат', /Golos\+Text/.test(html) && /PT\+Serif/.test(html) && /IBM\+Plex\+Mono/.test(html));
t('имената на моментите са със серифи', /\.moment-ime\s*\{[^}]*var\(--f-doc\)/.test(css));

const shapka = (css.match(/\.shapka\s*\{([^}]*)\}/) || [])[1] || '';
t('лентата горе е в RAL 6004', /background:\s*var\(--ral6004\)/.test(shapka));
const ime = (html.match(/<div class="shapka-ime">([\s\S]*?)<\/div>/) || [])[1] || '';
t('логото: фронтон, кота и знак в RAL 1004', /M4 27L16 5l12 22/.test(ime) && /H29/.test(ime) && /#e0a21c/i.test(ime));
t('до логото „АКТ“ и „СИСТЕМ“', />АКТ</.test(ime) && />СИСТЕМ</.test(ime));
t('логото води към плота', /href="#\/plot"/.test(ime));

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — облеклото стои`);
process.exit(loshi.length ? 1 : 0);
