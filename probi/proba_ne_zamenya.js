// Обектите от сървъра САМО ДОБАВЯТ — не заменят локалните (11.11.2026).
//
// Операторът отвори старото ПВА; то подмени обектите с копията от сървъра,
// а там стига само паспортът. Вчерашните 22 акта обр. 7 и таблицата на
// дневника изчезнаха без дума. И: новото ПВА казва високо, когато не записва.
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

// 1. Старото: блокът, който сваля обектите от сървъра
const src = fs.readFileSync(path.join(__dirname, '..', 'js', '01-osnova.js'), 'utf8');
t('старото ПВА вече не подменя обектите със сървърните',
  !/appData\.projects = nomeraNaObekti\(data\)/.test(src), '');
t('от сървъра влизат само липсващите', /const novi = otSarvara\.filter\(p => !imaTuk\(p\)\)/.test(src), '');

// Изпълнява се логиката на сливане, извадена от кода, върху пример.
const m = /const tuk = appData\.projects \|\| \[\];[\s\S]*?const novi = otSarvara\.filter\(p => !imaTuk\(p\)\);/.exec(src);
const slei = new Function('appData', 'otSarvara', m[0] + '\nreturn [...tuk, ...novi];');
const lokalen = { id: 1731300000000, pi: '68134.702.9889', sloy2: { od: { dokumenti: [{ vid: 'акт обр. 7' }] } },
                  akt7_dnevnik: { aktove: [{ podpisan: true }] } };
const rez = slei({ projects: [lokalen] }, [
    { id: '68134.702.9889', pi: '68134.702.9889', stroej: 'старо копие без досие' },
    { id: '68134.1.2', pi: '68134.1.2', stroej: 'обект само на сървъра' },
]);
t('локалният обект остава същият — с досието и дневника', rez[0] === lokalen && rez[0].sloy2.od.dokumenti.length === 1, rez[0]);
t('копието му от сървъра не дублира (по ПИ)', rez.filter(p => p.pi === '68134.702.9889').length === 1, rez);
t('обект, който го има само на сървъра, се добавя', rez.some(p => p.pi === '68134.1.2'), rez);

// 2. Новото: неуспешен запис → лента най-горе
const dom = new JSDOM('<body><script>' + fs.readFileSync(path.join(__dirname, '..', 'akt', 'yadro.js'), 'utf8') + '</script></body>', { runScripts: 'dangerously', url: 'http://localhost/' });
const w = dom.window;
w.eval('aktProcheteno = true; Storage.prototype.setItem = () => { const e = new Error("QuotaExceededError"); e.name = "QuotaExceededError"; throw e; };');
const stana = w.eval('aktZapishi()');
const lenta = w.document.getElementById('akt-zapis-lenta');
t('неуспешният запис връща „не“', stana === false, stana);
t('и го казва високо, с причината', lenta && /НЕ Е ЗАПИСАНО — мястото в браузъра свърши/.test(lenta.textContent), lenta && lenta.textContent);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — локалното не се губи тихо`);
process.exit(loshi.length ? 1 : 0);
