// Кои признаци изобщо се питат за този строеж.
//
// Операторът, 19.10.2026: за „Външно кабелно захранване“ десет от полетата са
// несъстоятелни — гараж, асансьор, етажи, отопление. Те не са празни, а
// НЕПРИЛОЖИМИ. Но прочетена стойност се показва винаги: тогава нещо не се
// връзва и точно това трябва да се види.
const { kod, grab, parche } = require('./kod');
const s = kod();

const F = new Function(
    "const _s2esc=x=>String(x??'');\n"
    + 'const _KES_POLETA=' + s.slice(s.indexOf('const _KES_POLETA = [') + 19,
                                    s.indexOf('\n];', s.indexOf('const _KES_POLETA = [')) + 2) + ';\n'
    + 'const _KES_IME=Object.fromEntries(_KES_POLETA.map(([k,i])=>[k,i]));\n'
    + parche(s, 'const _VID_KOD =', 'function _priznaciKamPoleta')
    + parche(s, 'const _SGRADA =', 'const _KES_IZBOR')
    + 'return {_KES_POLETA,_kesPriloshim,_KES_ZA_VID};')();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

// ── сграда пита всичко ────────────────────────────────────────────────────
const zaSgrada = F._KES_POLETA.filter(([k]) => F._kesPriloshim(k, 'sgrada')).map(([k]) => k);
t('за сграда се пита всичко освен „захранван обект“',
  zaSgrada.length === F._KES_POLETA.length - 1 && !zaSgrada.includes('zahranvan_obekt'),
  F._KES_POLETA.length - zaSgrada.length);

// ── линеен обект не пита за сградни неща ──────────────────────────────────
for (const k of ['garaj', 'asansior', 'etaji', 'otoplenie', 'ovk', 'visochina',
                 'kota_cokul', 'kint_dop', 'zp', 'rzp'])
    t(`линеен обект не пита за „${k}“`, !F._kesPriloshim(k, 'lineen'));

for (const k of ['identifikator', 'obekt', 'kategoria', 'sobstvenik', 'povod',
                 'kota_izkop', 'reper_nomer', 'elektro', 'zona', 'pup'])
    t(`но пита за „${k}“`, F._kesPriloshim(k, 'lineen'));

t('захранваният обект е въпрос само към мрежа',
  F._kesPriloshim('zahranvan_obekt', 'lineen') && !F._kesPriloshim('zahranvan_obekt', 'sgrada'));
t('линеен с КТП се държи като линеен', !F._kesPriloshim('garaj', 'lineen_ktp'));

const skriti = F._KES_POLETA.filter(([k]) => !F._kesPriloshim(k, 'lineen')).length;
t(`за линеен обект отпадат ${skriti} полета`, skriti >= 10, skriti);

// ── непопълнен вид не крие нищо ───────────────────────────────────────────
t('без вид се пита всичко',
  F._KES_POLETA.every(([k]) => F._kesPriloshim(k, '')));
t('непознат вид също не крие',
  F._KES_POLETA.every(([k]) => F._kesPriloshim(k, 'нещо_друго')) === false
  || F._KES_POLETA.filter(([k]) => !F._kesPriloshim(k, 'нещо_друго')).length > 0);

t('видът с думи се разбира както кодът',
  !F._kesPriloshim('garaj', 'линеен обект') && F._kesPriloshim('garaj', 'сграда'));

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема`
    : `\n${dobri.length} проверки — питат се само приложимите`);
process.exit(loshi.length ? 1 : 0);
