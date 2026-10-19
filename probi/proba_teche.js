// Потвърденото тече надолу — но не тихо.
//
// Операторът, 19.10.2026: „защо след като потвърдя кой е възложителят в
// «Проверки», това не се записва в «Обекти» и където другаде се изисква“.
//
// Три случая: празно → попълва се; съвпада → нищо; различава се → НЕ се
// подменя, а се показва и операторът избира.
const { kod, grab, parche } = require('./kod');
const s = kod();

const F = new Function(
    "const _s2esc=x=>String(x??'');let _zapisi=[];\n"
    + parche(s, 'const _POKAZATEL_KAM_GRAD', 'function zapishiImot')
    + [grab(s, '_kesRazminavaniaHtml'), grab(s, '_kesRazminavane'),
       grab(s, 'kesVzemiOtProekta'), grab(s, 'kesOstaviPasporta')].join('\n')
    + '\nlet _o=null;const _zhivObekt=()=>_o;const _stroezh=()=>_o;\n'
    + 'const _s2ZapishiTiho=(p,k)=>_zapisi.push(k);const renderKakavPage=()=>{};\n'
    + 'const _sbKlienti=(p)=>((p.sobstvenost&&p.sobstvenost.klienti)||[]);\n'
    + 'return {_priznaciKamPoleta,_priznaciKamPasport,_vazlozhitelKamPasport,_techeNadolu,'
    + '_pokazateliKamGrad,_kesRazminavaniaHtml,kesVzemiOtProekta,kesOstaviPasporta,'
    + 'set:o=>{_o=o},zapisi:()=>_zapisi};')();

const dobri = [], loshi = [];
const t = (ime, verno, kak) => (verno ? dobri : loshi).push(ime + (verno ? '' : '  → ' + JSON.stringify(kak)));

const potv = v => ({ sastoyanie: 'potvardeno', stoynost: v });
const nov = (fakti, dop) => {
    const o = { pi: '68134.4354.781', fakti, ...dop };
    F.set(o);
    return o;
};

// ── празното се попълва ───────────────────────────────────────────────────
const a = nov({ obekt: potv('Жилищна сграда с гаражи'), faza: potv('техническа'),
                kategoria: potv('четвърта категория, буква „в“') });
F._priznaciKamPasport(a, a);
t('празното се попълва', a.stroej === 'Жилищна сграда с гаражи', a.stroej);
t('фазата влиза в оценката', a.osip.faza === 'техническа', a.osip);
t('категорията влиза като текст', /четвърта/.test(a.osip.kategoria), a.osip);
t('няма разминавания', !Object.keys(a.razminavania || {}).length, a.razminavania);

// ── съвпадащото не вдига шум ──────────────────────────────────────────────
const b = nov({ obekt: potv('Жилищна сграда') }, { stroej: 'жилищна сграда' });
F._priznaciKamPasport(b, b);
t('съвпадение без оглед на буквите не е разминаване',
  !Object.keys(b.razminavania || {}).length && b.stroej === 'жилищна сграда', b);

// ── различното НЕ се подменя ──────────────────────────────────────────────
const c = nov({ obekt: potv('Жилищна сграда с гаражи') }, { stroej: 'Многофамилна жилищна сграда' });
F._priznaciKamPasport(c, c);
t('различното не се подменя', c.stroej === 'Многофамилна жилищна сграда', c.stroej);
t('различното се записва като разминаване',
  c.razminavania.stroej && c.razminavania.stroej.ot_proekt === 'Жилищна сграда с гаражи',
  c.razminavania);
t('изгледът показва двете стойности',
  /Многофамилна/.test(F._kesRazminavaniaHtml(c)) && /с гаражи/.test(F._kesRazminavaniaHtml(c)));

F.kesVzemiOtProekta(encodeURIComponent('stroej'));
t('„вземи от проекта“ записва', c.stroej === 'Жилищна сграда с гаражи', c.stroej);
t('и маха разминаването', !Object.keys(c.razminavania).length);

const d = nov({ obekt: potv('А') }, { stroej: 'Б' });
F._priznaciKamPasport(d, d);
F.kesOstaviPasporta(encodeURIComponent('stroej'));
t('„остави паспорта“ не пипа стойността', d.stroej === 'Б' && !Object.keys(d.razminavania).length);

// ── идентификаторът само се сверява ───────────────────────────────────────
const e = nov({ identifikator: potv('68134.4354.999') });
F._priznaciKamPasport(e, e);
t('ПИ не се подменя', e.pi === '68134.4354.781', e.pi);
t('но разминаването се казва', e.razminavania.pi && e.razminavania.pi.samo_sverka, e.razminavania);
t('и няма бутон за взимане', !/вземи от проекта/.test(F._kesRazminavaniaHtml(e)));

// ── категорията само попълва празно ───────────────────────────────────────
const g = nov({ kategoria: potv('трета категория') }, { osip: { kategoria: 'четвърта категория' } });
F._priznaciKamPasport(g, g);
t('категорията от проекта не бие разрешението', g.osip.kategoria === 'четвърта категория');
t('но се казва', !!g.razminavania.kategoria, g.razminavania);

// ── възложителят ──────────────────────────────────────────────────────────
const v1 = nov({ sobstvenik: potv('Иван Петров Георгиев') });
F._vazlozhitelKamPasport(v1, v1);
t('празен паспорт се попълва от потвърденото',
  (v1.clients || []).length === 1 && v1.clients[0].name === 'Иван Петров Георгиев', v1.clients);
t('и се помни, че идва от проекта', v1.clients[0].ot_proekt === true);

const v2 = nov({ sobstvenik: potv('„Алфа Билд“ ЕООД') });
F._vazlozhitelKamPasport(v2, v2);
t('фирмата се разпознава като ЮЛ', v2.clients[0].type === 'ЮЛ', v2.clients);

const v3 = nov({ sobstvenik: potv('Иван Петров') },
                { sobstvenost: { klienti: [{ name: 'Мария Иванова' }] } });
F._vazlozhitelKamPasport(v3, v3);
t('регистърът бие проекта — нищо не се пише', !v3.clients, v3.clients);

const v4 = nov({ sobstvenik: potv('Иван Петров') }, { clients: [{ name: 'Георги Димитров' }] });
F._vazlozhitelKamPasport(v4, v4);
t('различният възложител не се подменя',
  v4.clients[0].name === 'Георги Димитров' && !!v4.razminavania.clients, v4.razminavania);

const v5 = nov({ sobstvenik: potv('иван петров') }, { clients: [{ name: 'Иван Петров' }] });
F._vazlozhitelKamPasport(v5, v5);
t('същият възложител не вдига шум', !Object.keys(v5.razminavania || {}).length);

// ── непотвърденото не тече ────────────────────────────────────────────────
const h = nov({ obekt: { sastoyanie: 'predlozheno', stoynost: 'Нещо' } });
F._priznaciKamPasport(h, h);
t('предложеното не влиза в паспорта', !h.stroej, h.stroej);

dobri.forEach(x => console.log('  ok  ' + x));
loshi.forEach(x => console.log('  ЛО  ' + x));
console.log(loshi.length ? `\n${loshi.length} проблема`
    : `\n${dobri.length} проверки — потвърденото тече, но не тихо`);
process.exit(loshi.length ? 1 : 0);
