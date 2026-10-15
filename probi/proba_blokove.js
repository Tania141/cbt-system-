// Текстовите блокове: прочетеното се потвърждава веднъж и не се преписва.
//
// Измерено от истински обект (Петракиев Надежда): окончателният доклад е 93 %
// преписан текст, Акт 15 — 88 %. Описанията идват от записките.
const { kod, grab, parche } = require('./kod');

const s = kod();
const F = new Function(
    "const _s2esc=x=>String(x??'');let _zapisi=[];\n"
    + parche(s, 'const _BL_SASTOYANIA', 'function _blHtml')
    + [grab(s, '_blHtml'), grab(s, '_blRedHtml'), grab(s, '_blFakt'),
       grab(s, 'blPotvardi'), grab(s, 'blPoprav'), grab(s, 'blOtmeni'),
       grab(s, 'blVzemiNovoto'), grab(s, 'blOstaviMoeto'),
       grab(s, '_blZaDokument'), grab(s, '_blChakat')].join('\n')
    + '\nlet _t=null,_otgovor=null;'
    + 'const _zhivObekt=()=>_t;const _stroezh=p=>p;const _s2Koy=()=>"оператор";'
    + 'const _s2ZapishiTiho=(p,k)=>_zapisi.push(k);const _prerisuvai=()=>{};'
    + 'const prompt=()=>_otgovor;'
    + '\nreturn {_blSleej,_blHtml,_blVzemi,_blKlyuch,_blZaDokument,_blChakat,blPotvardi,blPoprav,blOtmeni,'
    + 'blVzemiNovoto,blOstaviMoeto,set:p=>{_t=p},otgovor:v=>{_otgovor=v},zapisi:()=>_zapisi};');
const B = F();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const REZYUME = { blokove: [
    { chast: 'Архитектура', chast_kod: 'ARH', fajl: 'arh.pdf', razdeli: [
        { podzaglavie: 'Ситуационно решение', tekst: 'Сградата се разполага в южната част на имота.', stranica: 2 },
        { podzaglavie: 'Обемно-пространствено решение', tekst: 'Сградата е на едно наземно ниво.', stranica: 2 }] },
    { chast: 'ВиК', chast_kod: 'VIK', fajl: 'vik.pdf', razdeli: [
        { podzaglavie: 'Водопровод', tekst: 'Сградата ще бъде захранена от собствен водоизточник.', stranica: 3 }] },
] };

const p = {};
B.set(p);
B._blSleej(p, REZYUME);
const b = B._blVzemi(p);
const klyuch = B._blKlyuch('Архитектура', 'Ситуационно решение');

t('трите блока са поети', Object.keys(b).length === 3, Object.keys(b));
t('блокът помни откъде е', b[klyuch].fajl === 'arh.pdf' && b[klyuch].stranica === 2, b[klyuch]);
t('новият блок е „предложен“', b[klyuch].sastoyanie === 'predlozheno');

// Ново четене на същото не удвоява.
B._blSleej(p, REZYUME);
t('повторното четене не удвоява', Object.keys(B._blVzemi(p)).length === 3);

// Потвърждаване.
B.blPotvardi(encodeURIComponent(klyuch));
t('потвърденото си личи', b[klyuch].sastoyanie === 'potvardeno' && b[klyuch].koy === 'оператор');

// Ново четене с ДРУГ текст не подменя потвърденото, а пита.
const DRUGO = JSON.parse(JSON.stringify(REZYUME));
DRUGO.blokove[0].razdeli[0].tekst = 'Сградата се разполага в СЕВЕРНАТА част на имота.';
B._blSleej(p, DRUGO);
t('потвърденият текст не се подменя от ново четене',
  /южната/.test(b[klyuch].tekst), b[klyuch].tekst);
t('но се казва, че записката дава друго',
  /СЕВЕРНАТА/.test(b[klyuch].novo_chetene || ''), b[klyuch].novo_chetene);

B.blOstaviMoeto(encodeURIComponent(klyuch));
t('„остави моето“ маха предупреждението', !b[klyuch].novo_chetene && /южната/.test(b[klyuch].tekst));

// Празен бутон не трие текста — пробата го намери на 15.10.2026.
const predi_vzemane = b[klyuch].tekst;
B.blVzemiNovoto(encodeURIComponent(klyuch));
t('„вземи новото“ без предложение не трие нищо', b[klyuch].tekst === predi_vzemane);

// Трето четене с още един различен текст — сега има какво да се вземе.
const TRETO = JSON.parse(JSON.stringify(REZYUME));
TRETO.blokove[0].razdeli[0].tekst = 'Сградата се разполага в северната част, до оградата.';
B._blSleej(p, TRETO);
B.blVzemiNovoto(encodeURIComponent(klyuch));
t('„вземи новото“ сменя текста', /до оградата/.test(b[klyuch].tekst), b[klyuch].tekst);
t('и го връща за потвърждаване', b[klyuch].sastoyanie === 'predlozheno');

// Непотвърдено ново четене се подменя мълчаливо — няма какво да се пази.
const k2 = B._blKlyuch('ВиК', 'Водопровод');
const DRUGO2 = JSON.parse(JSON.stringify(REZYUME));
DRUGO2.blokove[1].razdeli[0].tekst = 'Сградата се захранва от уличен водопровод.';
B._blSleej(p, DRUGO2);
t('непотвърденото се подменя мълчаливо', /уличен/.test(b[k2].tekst), b[k2].tekst);

// Поправка.
B.otgovor('Сградата се разполага в южната част, до съществуващата сграда.');
B.blPoprav(encodeURIComponent(klyuch));
t('поправеното е записано', /до съществуващата/.test(b[klyuch].tekst), b[klyuch].tekst);
t('поправеното има свое състояние', b[klyuch].sastoyanie === 'popraveno');

// Отказ от поправка не пипа нищо.
B.otgovor(null);
const predi = b[klyuch].tekst;
B.blPoprav(encodeURIComponent(klyuch));
t('отказът от поправка не променя текста', b[klyuch].tekst === predi);

// Изгледът.
const html = B._blHtml(p);
t('изгледът групира по части', /Архитектура/.test(html) && /ВиК/.test(html));
t('изгледът казва колко чакат', /чакат/.test(html), html.slice(0, 200));
t('показва файла и страницата', /arh\.pdf/.test(html) && /стр\. 2/.test(html));
const o = (html.match(/<div/g) || []).length, z = (html.match(/<\/div>/g) || []).length;
t(`баланс на div (${o}/${z})`, o === z);

t('историята е писана', B.zapisi().length >= 4, B.zapisi());

// ── към документа ─────────────────────────────────────────────────────────
// Операторът, 15.10.2026: „излива се целият текст, както е по записка, в
// съответния раздел“. Влиза САМО потвърденото.
const NR = String.fromCharCode(10);
const zaDok = B._blZaDokument(p);
t('частта е заглавие', zaDok.split(NR)[0] === 'Част Архитектура', zaDok.split(NR)[0]);
t('подзаглавието се пази', /Ситуационно решение/.test(zaDok));
t('непотвърденото НЕ влиза', !/уличен водопровод/.test(zaDok), zaDok);
t('чакащите се броят', B._blChakat(p) >= 1, B._blChakat(p));

B.blPotvardi(encodeURIComponent(B._blKlyuch('ВиК', 'Водопровод')));
const zaDok2 = B._blZaDokument(p);
t('втората част се появява', /Част ВиК/.test(zaDok2), zaDok2);
t('вече влиза и текстът ѝ', /уличен водопровод/.test(zaDok2), zaDok2);
t('частите са подредени', zaDok2.indexOf('Част Архитектура') < zaDok2.indexOf('Част ВиК'));
t('текстът е многоредов — шаблонът го разбива на абзаци',
  zaDok2.split(NR).length >= 6, zaDok2.split(NR).length);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема` : `\n${dobri.length} проверки — блоковете се пазят и потвърждават`);
process.exit(loshi.length ? 1 : 0);
