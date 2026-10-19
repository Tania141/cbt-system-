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
    + grab(s, '_kesSastavkiNa') + '\n'
    + 'return {_KES_POLETA,_kesPriloshim,_KES_ZA_VID,_sastavki,_SASTAVKI,_kesOtSastavki,'
    + '_tekstZapiski,_sastavkiOtPriznaci,_kesSastavkiNa};')();

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

// ── съставките бият вида ──────────────────────────────────────────────────
// Операторът, 19.10.2026: „няма как да искаме коти и виза за шахтов ТП“.
const ZAGL_SHTP = 'Външно електрозахранване с нови кабели СрН, нови кабели НН и нов '
    + 'шахтов ТП 2х800kVA, 20/0.4kV за „Жилищна сграда с ресторант, подземни гаражи“';
const sahtov = F._sastavki(ZAGL_SHTP).map(x => x.kod);
t('кабелите се разпознават', sahtov.includes('kabel_srn') && sahtov.includes('kabel_nn'), sahtov);
t('шахтовият ТП се разпознава', sahtov.includes('shtp'), sahtov);
t('„ТП — не е казано какъв“ отпада, щом е казано', !sahtov.includes('tp_neyasen'), sahtov);

const pita = (k, zagl) => F._kesPriloshim(k, 'sgrada', F._sastavki(zagl));
t('шахтов ТП не иска кота било', !pita('kota_bilo', ZAGL_SHTP));
t('шахтов ТП не иска кота корниз', !pita('korniz_dop', ZAGL_SHTP));
t('но иска кота изкоп и репер', pita('kota_izkop', ZAGL_SHTP) && pita('reper_nomer', ZAGL_SHTP));
t('и захранван обект', pita('zahranvan_obekt', ZAGL_SHTP));

const ZAGL_BKTP = 'Външно електрозахранване с нови кабели СрН и нов БКТП 800kVA, 20/0,4kV';
t('надземният БКТП иска кота било', pita('kota_bilo', ZAGL_BKTP));
t('и отстояния', pita('otstoyania', ZAGL_BKTP));
t('но не иска асансьор', !pita('asansior', ZAGL_BKTP));

// Съставките са ОБЕДИНЕНИЕ: сградата до кабела не отнема въпроси.
const ZAGL_SMES = 'Жилищна сграда с подземни гаражи и нов шахтов ТП';
t('сграда + шахтов ТП пита и сградните', pita('asansior', ZAGL_SMES) && pita('etaji', ZAGL_SMES));
t('и гаражните', pita('drenaj', ZAGL_SMES) && pita('garaj', ZAGL_SMES));

// ВиК
const ZAGL_VIK = 'Уличен канал кл. 208 и съпътстващ водопровод кл. 169';
t('канал и водопровод се разпознават',
  F._sastavki(ZAGL_VIK).map(x => x.kod).sort().join(',').includes('kanal'), F._sastavki(ZAGL_VIK).map(x => x.kod));
t('ВиК обект не пита за етажи', !pita('etaji', ZAGL_VIK));
t('но пита за ВиК присъединяване', pita('vik', ZAGL_VIK));

// Изгребна яма — пълноправна съставка (операторът: „в много населени места
// няма канализация“).
t('изгребната яма се разпознава',
  F._sastavki('Еднофамилна жилищна сграда с изгребна яма').some(x => x.kod === 'izgrebna'));

// Непознато заглавие не крие нищо.
t('заглавие без съставки пита всичко',
  F._KES_POLETA.every(([k]) => F._kesPriloshim(k, '', F._sastavki('Строеж'))));

// ── съставките идват и от ЗАПИСКИТЕ, не само от заглавието ────────────────
// Операторът, 19.10.2026: „асансьорът не се разглежда в заглавието на проекта,
// има го в записката по част архитектура и ел; басейн също“.
const p1 = {
    stroej: 'Многофамилна жилищна сграда с подземни гаражи',
    zapiski: { chasti: [{ chast_ime: 'Архитектура',
        opisanie_blokove: [{ podzaglavie: 'Вертикални комуникации',
            tekst: 'Сградата се обслужва от един асансьор с товароподемност 630 кг и басейн на покрива.' }] }] },
};
const s1 = F._kesSastavkiNa(p1);
const kodove = s1.map(x => x.kod);
t('асансьорът идва от записката', kodove.includes('asansior'), kodove);
t('басейнът също', kodove.includes('basein'), kodove);
t('и се помни ОТКЪДЕ', (s1.find(x => x.kod === 'asansior') || {}).ot === 'записките',
  s1.map(x => x.kod + ':' + x.ot));
t('заглавието си остава извор',
  (s1.find(x => x.kod === 'sgrada') || {}).ot === 'заглавието', s1.map(x => x.ot));
t('асансьорът отваря своя въпрос', F._kesPriloshim('asansior', '', s1));
t('и СПО, защото е съоръжение с повишена опасност', F._kesPriloshim('spo', '', s1));

// Признак „да“ е съставка сам по себе си.
const p2 = { stroej: 'Външно електрозахранване с кабели НН',
             fakti: { asansior: { sastoyanie: 'potvardeno', stoynost: 'да' } } };
const s2 = F._kesSastavkiNa(p2);
t('потвърденият признак прави съставка', s2.some(x => x.kod === 'asansior'), s2.map(x => x.kod));
t('и казва, че идва от признак', /признак/.test((s2.find(x => x.kod === 'asansior') || {}).ot || ''),
  s2.map(x => x.ot));

const p3 = { stroej: 'Сграда', fakti: { asansior: { sastoyanie: 'potvardeno', stoynost: 'не' } } };
t('„не“ не прави съставка', !F._kesSastavkiNa(p3).some(x => x.kod === 'asansior'));

// Ръчно махнатото не се връща, макар записката пак да го казва.
const p4 = { ...p1, sastavki: { mahnati: ['basein'], dobaveni: [] } };
t('махнатото на ръка не се връща', !F._kesSastavkiNa(p4).some(x => x.kod === 'basein'));

// Записката казва „шахтов“ — неясният ТП отпада и оттам.
const p5 = { stroej: 'Външно електрозахранване с нов ТП 2х800kVA',
             zapiski: { chasti: [{ opisanie_blokove: [{ tekst: 'Предвижда се шахтов трафопост.' }] }] } };
const s5 = F._kesSastavkiNa(p5).map(x => x.kod);
t('записката изяснява какъв е трафопостът', s5.includes('shtp') && !s5.includes('tp_neyasen'), s5);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема`
    : `\n${dobri.length} проверки — питат се само приложимите`);
process.exit(loshi.length ? 1 : 0);
