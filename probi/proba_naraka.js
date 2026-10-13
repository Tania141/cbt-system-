// Ръчните полета: няма бутон „потвърди предложеното“.
const fs = require('fs'); const s = fs.readFileSync(__dirname + '/../app.js', 'utf8');
function grab(n){const i=s.indexOf('function '+n+'(');if(i<0)throw new Error('няма '+n);
  let k=s.indexOf('{',i),b=0;for(;k<s.length;k++){if(s[k]==='{')b++;else if(s[k]==='}'){b--;if(!b)return s.slice(i,k+1);}}}
function konst(n){const i=s.indexOf('const '+n+' = ');const j=s.indexOf('\n};',i);return s.slice(i,j+3);}

const esc = "const _s2esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));";
const f = new Function(esc + '\n'
  + 'const _KES_POLETA=' + s.slice(s.indexOf('const _KES_POLETA = [') + 19, s.indexOf('\n];', s.indexOf('const _KES_POLETA = [')) + 2) + ';\n'
  + 'const _KES_IME=Object.fromEntries(_KES_POLETA.map(([k,i])=>[k,i]));\n'
  + konst('_KES_NARAKA') + '\n' + konst('_KES_DOKAZ') + '\n' + konst('_KES_PODSKAZKA') + '\n'
  + "const _kesZn=v=>String(v??'').toLowerCase();\n"
  + [grab('_kesDokazHtml'), grab('_kesIztochnik'), grab('_kesPoleHtml')].join('\n')
  + '\nreturn {_kesPoleHtml,_KES_NARAKA};')();

const tekst = h => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const ok = [], lo = [];
const t = (u, c) => (c ? ok : lo).push(u);

// 1. ръчно поле с предложение от АИ — няма „потвърди“
const h1 = f._kesPoleHtml('identifikator', { sastoyanie: 'predlozheno', stoynost: '68134.4354.781', chasti: ['Архитектурна'] });
t('ръчно + предложено: няма бутон „потвърди“', !/kesPotvardi\(/.test(h1));
t('ръчно + предложено: има „Впиши на ръка“', /kesPoprav\(/.test(h1) && /Впиши на ръка/.test(h1));
t('ръчно + предложено: показва прочетеното', /68134\.4354\.781/.test(h1));
t('ръчно + предложено: маркирано с [___]', /\[___\]/.test(h1));

// 2. обикновено поле — бутонът си е там
const h2 = f._kesPoleHtml('etaji', { sastoyanie: 'predlozheno', stoynost: '5', chasti: ['Архитектурна'] });
t('обикновено поле: бутонът „потвърди“ си стои', /kesPotvardi\(/.test(h2));

// 3. празно ръчно поле
const h3 = f._kesPoleHtml('kategoria', null);
t('празно ръчно: [___] вместо [ празно ]', /\[___\]/.test(h3) && !/\[ празно \]/.test(h3));
const h4 = f._kesPoleHtml('etaji', null);
t('празно обикновено: си остава [ празно ]', /\[ празно \]/.test(h4));

// 4. вписаното на ръка си личи
const h5 = f._kesPoleHtml('identifikator', { sastoyanie: 'popraveno', stoynost: '68134.4354.781', koga: '2026-10-13' });
t('вписано на ръка е обозначено', /вписано на ръка/.test(h5));

// 5. точно двете полета са ръчни
t('ръчни са точно identifikator и kategoria',
  JSON.stringify(Object.keys(f._KES_NARAKA).sort()) === JSON.stringify(['identifikator', 'kategoria']));

// 6. баланс
for (const [i, h] of [h1, h2, h3, h4, h5].entries()) {
  const o = (h.match(/<div/g) || []).length, z = (h.match(/<\/div>/g) || []).length;
  t(`баланс на div в пример ${i + 1} (${o}/${z})`, o === z);
}

console.log('\nръчното поле изглежда така:\n  ' + tekst(h1) + '\n');
ok.forEach(x => console.log('  ok  ' + x));
lo.forEach(x => console.log('  ЛО  ' + x));
console.log(lo.length ? '\n' + lo.length + ' проблема' : '\nвсичко е наред');
process.exit(lo.length ? 1 : 0);
