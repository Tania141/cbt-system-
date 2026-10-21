// АКТ СИСТЕМ · 07-sobstvenost.js
// регистърът на собствеността — лица, обекти, събития
//
// Отделен от app.js на 13.10.2026 (стъпка 2 от ПОДРЕЖДАНЕ.md).
// Файловете се включват по РЕД и споделят едно и също глобално
// пространство — точно както беше в единия скрипт.

//  СОБСТВЕНОСТТА — регистър, не форма (13.10.2026)
// ═══════════════════════════════════════════════════════════
// България е регистър на АКТОВЕ, не на права: кой е собственик днес не пише
// никъде — извежда се от веригата. Затова тук няма поле „собственик“ и няма
// поле „възложител“. Има три таблици и една сметка.
//
// Операторът, 13.10.2026: „Собственост на земята — възложител; право на строеж
// — възложител; купил апартамент — възложител. Всяко възникнало вещно право е
// Възложител по ЗУТ.“ Значи „възложител“ е РОЛЯ: питаш към дата и системата
// изброява. На ОСИП може да са много; от Акт 15 нататък съставът се мени.
//
// Докъде се копае назад не е преценка, а сметка: докато земята се събере до
// 1/1. Дяловете са ДРОБИ — три по 1/3 от 1/2 дава точно 1/6, докато с проценти
// излиза 16.67% и сборът не става цяло.

// ── дроби ──────────────────────────────────────────────────────────────────
const _nod = (a, b) => (b ? _nod(b, a % b) : Math.abs(a));
// „1/6“, „3/4“, „1“, а също „8,38%“ и „2,169%“.
// Процентите СЕ ПРИЕМАТ (13.10.2026): в нотариален акт за идеални части в
// комплекс законният текст наистина пише „8,38 %“, а не дроб. Пазят се като
// ТОЧНА дроб (8,38% → 419/5000), за да не се трупа закръгление.
function _dr(txt) {
    const t = String(txt ?? '').trim().replace(',', '.').replace(/\s+/g, '');
    if (!t) return null;
    const m = t.match(/^(\d+)\/(\d+)$/);
    if (m) { const d = +m[2]; return d ? _drSvi({ n: +m[1], d }) : null; }
    const pr = t.match(/^(\d+(?:\.\d+)?)%$/);
    if (pr) {
        const [cyalo, drob = ''] = pr[1].split('.');
        const znam = 100 * Math.pow(10, drob.length);
        return _drSvi({ n: +(cyalo + drob), d: znam });
    }
    if (/^\d+$/.test(t)) return { n: +t, d: 1 };
    if (/^\d+\.\d+$/.test(t)) {          // „0.5“ — приема се, но не се насърчава
        const [c, d2] = t.split('.');
        return _drSvi({ n: +(c + d2), d: Math.pow(10, d2.length) });
    }
    return null;
}

// Процентите в актовете са закръглени: 2,169% × 46 не прави точно 100%.
// Затова „цяло“ значи „до една хилядна“, когато дяловете идват от проценти.
const _drBlizoEdno = f => Math.abs(f.n / f.d - 1) < 0.001;
const _drSvi = f => { const g = _nod(f.n, f.d) || 1; return { n: f.n / g, d: f.d / g }; };
const _drSabi = (a, b) => _drSvi({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
const _drIzvadi = (a, b) => _drSvi({ n: a.n * b.d - b.n * a.d, d: a.d * b.d });
const _drTekst = f => (f.n === 0 ? '0' : f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
const _drEdno = f => f.n === f.d;
const _NULA = { n: 0, d: 1 };

// ── данните ────────────────────────────────────────────────────────────────
// Стоят на ИМОТА, не на строежа: един нотариален акт важи за всички строежи в
// имота, а и земята е обща.
const _SB_VID = ['първоначално', 'покупко-продажба', 'дарение', 'наследяване',
                 'делба', 'замяна', 'учредяване право на строеж', 'апорт'];

function _sbDanni(p) {
    const s = p.sobstvenost = p.sobstvenost || {};
    s.lica = s.lica || [];
    s.obekti = s.obekti || [];
    s.sabitia = s.sabitia || [];
    if (typeof eEGN === 'function') _sbIzchistiEgn(s);
    _sbStaraForma(s);
    return s;
}

// Старите данни носеха по едно събитие на ДВИЖЕНИЕ: „от Иван на Мария 1/4“.
// Новите носят по едно на АКТ, с придобиващите вътре. Старото се превръща, за
// да не се губи; осем стари реда стават осем акта, не един — кой с кого върви
// не се познава със сигурност и не се гадае. (15.10.2026)
function _sbStaraForma(s) {
    for (const e of s.sabitia) {
        if (e.pridobivashti) continue;
        e.pridobivashti = e.na ? [{ lice: e.na, dyal: e.dyal || '' }] : [];
        delete e.na;
        delete e.dyal;
    }
}
const _sbLice = (s, id) => s.lica.find(x => x.id === id);
const _sbImeLice = (s, id) => (_sbLice(s, id) || {}).ime || '(неизвестен)';
const _sbObekt = (s, id) => s.obekti.find(x => x.id === id);
const _sbImeObekt = (s, id) => {
    const o = _sbObekt(s, id);
    return o ? (o.identifikator || o.opisanie || '(обект)') : '(обект)';
};
// Как се нарича един акт в изречение: „НА № 186 от 09.07.2019“.
const _sbImeAkt = e => [
    (e.dokument || e.vid || 'Актът').split(',')[0].trim(),
    e.data ? 'от ' + e.data : '',
].filter(Boolean).join(' ');

// ПРЕДСТАВИТЕЛСТВОТО НЕ Е ПРИДОБИВАНЕ.
// „«ХЪС ИНВЕСТ СОФИЯ» ЕООД, представлявано от ИВАН ХРИСТОВ АСЕНОВ, действащ
// чрез пълномощника си ЙОАНА КАМЕНОВА ИВАНОВА“ е ЕДНА страна, не три лица.
// Операторът, 19.10.2026: „Йоана е пълномощник на Иван, който е управител на
// ХЪС = ХЪС участва като ЮЛ с управител Иван“. Дотук разделянето по запетая
// правеше от управителя и пълномощника отделни лица и кодът се оплакваше, че
// „участват, но ги няма сред лицата“.
const _SB_PREDSTAVITELSTVO =
    /[\s,;]*(?:действащ(?:а|и|о)?\s+чрез|чрез\s+пълномощник|с\s+пълномощник|представлявано?\s+от|представляван(?:а|и|о)?\s+от|в\s+качеството\s+на\s+пълномощник)[\s\S]*$/i;

// Правната форма личи и когато името е с главни букви — тогава страната е
// фирма и не се пипа. Иначе име от регистър или акт, писано само с главни, се
// изглажда: „ЙОАНА КАМЕНОВА ИВАНОВА“ → „Йоана Каменова Иванова“.
// `\b` е ASCII: между „Д“ и запетая няма граница на дума и изразът не хващаше
// нищо на кирилица. Затова: „не следва буква“.
const _SB_FORMA = /(^|[\s„"'(])(ЕООД|ООД|ЕАД|АД|СД|КД|ЕТ|ДЗЗД|ЕИК|ЕРП|ЕРМ)(?![А-Яа-я])/;

function _sbStrana(tekst) {
    const bez = String(tekst || '').replace(_SB_PREDSTAVITELSTVO, '').trim()
        .replace(/[\s,;]+$/, '');
    if (!bez) return '';
    const samoGlavni = bez === bez.toUpperCase() && /[А-Я]/.test(bez);
    return (samoGlavni && !_SB_FORMA.test(bez) && typeof imeSGlavni === 'function')
        ? imeSGlavni(bez) : bez;
}

// Страните в едно поле. Четецът понякога слага няколко в едно („Иван…,
// Мария…“); представителството се реже ПРЕДИ разделянето, за да не станат
// управителят и пълномощникът отделни страни. (ЖИТЕН, 14.10.2026; ЕРМ, 19.10)
function _sbStrani(v) {
    const tekst = String(v || '').replace(_SB_PREDSTAVITELSTVO, '');
    return tekst.split(/\s*(?:,|;| и )\s*/)
        .map(_sbStrana).filter(x => x.length > 2);
}

// Кой е подписал от името на страната — пази се върху акта, но НЕ става лице.
function _sbKojPodpisva(tekst) {
    const m = String(tekst || '').match(_SB_PREDSTAVITELSTVO);
    return m ? m[0].replace(/^[\s,;]+/, '').trim() : '';
}

// Имената се сравняват без оглед на интервали и главни букви.
const _sbZnIme = x => String(x || '').trim().toLowerCase().replace(/\s+/g, ' ');

const _sbNovId = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// Датата се пази както е въведена (дд.мм.гггг) — за подредба се обръща.
const _sbRed = d => {
    const m = String(d || '').match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    return m ? m[3] + m[2] + m[1] : '00000000';
};

// ── сметката ───────────────────────────────────────────────────────────────
// Кой какво държи в този обект към дадена дата. Празна дата = днес.
function _sbSmetka(p, obektId, doData) {
    const s = _sbDanni(p);
    const pred = doData ? _sbRed(doData) : '99999999';
    const salda = new Map();
    const dvizh = (lice, f, znak) => {
        if (!lice) return;
        const beshe = salda.get(lice) || _NULA;
        salda.set(lice, znak > 0 ? _drSabi(beshe, f) : _drIzvadi(beshe, f));
    };
    const redove = s.sabitia
        .filter(e => e.obekt === obektId && _sbRed(e.data) <= pred)
        .sort((a, b) => _sbRed(a.data).localeCompare(_sbRed(b.data)));
    for (const e of redove) {
        let sbor = _NULA;
        for (const pr of e.pridobivashti || []) {
            const f = _dr(pr.dyal);
            if (!f) continue;
            dvizh(pr.lice, f, +1);
            sbor = _drSabi(sbor, f);
        }
        // Прехвърлителите губят толкова, колкото са получили приобретателите.
        // Ако не са лица в регистъра, губенето няма къде да се запише — и не
        // трябва: актът е коренът на веригата. (15.10.2026)
        const dava = e.ot_lica && e.ot_lica.length ? e.ot_lica : (e.ot ? [e.ot] : []);
        if (dava.length && sbor.n) {
            const vseki = _drSvi({ n: sbor.n, d: sbor.d * dava.length });
            for (const l of dava) dvizh(l, vseki, -1);
        }
    }
    return salda;
}

// Събраното: сборът на положителните салда. Стане ли 1/1 — няма какво повече
// да се копае назад.
function _sbSabrano(p, obektId, doData) {
    let sbor = _NULA;
    for (const f of _sbSmetka(p, obektId, doData).values())
        if (f.n > 0) sbor = _drSabi(sbor, f);
    return sbor;
}

// ── ролята „възложител“ ────────────────────────────────────────────────────
// Не се въвежда. Всеки, който към тази дата държи вещно право в който и да е
// обект на имота, е възложител по ЗУТ — включително суперфициарът.
function _sbVazlozhiteli(p, data) {
    const s = _sbDanni(p);
    const out = new Map();
    for (const o of s.obekti)
        for (const [lice, f] of _sbSmetka(p, o.id, data))
            if (f.n > 0) {
                const red = out.get(lice) || { lice, prava: [] };
                red.prava.push({ obekt: o.id, dyal: f });
                out.set(lice, red);
            }
    return [...out.values()].map(r => ({ ...r, ime: _sbImeLice(s, r.lice) }));
}

// ── находките ──────────────────────────────────────────────────────────────
// Кодът съди. Показва се САМО което не връзва — от сто акта обикновено три.
// Кодът съди — но само за това, което има значение. Актът за магазин в голям
// комплекс изброява гаражи, снек бар и кафе, за да ги ИЗКЛЮЧИ от сделката;
// да се иска верига за всеки от тях е шум. (Операторът, 13.10.2026: 28
// забележки, от които значение имат две.) Проверява се КОРЕНЪТ — обектът, в
// който се строи — и нищо друго.
function _sbNahodki(p) {
    const s = _sbDanni(p);
    const koren = _sbKoren(p);
    const out = [];
    if (koren) {
        const salda = _sbSmetka(p, koren.id);
        const sabrano = _sbSabrano(p, koren.id);
        const ime = _sbImeObekt(s, koren.id);
        if (!s.sabitia.some(e => e.obekt === koren.id)) {
            out.push({ vid: 'prazno', obekt: koren.id,
                tekst: `${ime} — няма нито едно събитие. Качи акта, с който е придобит.` });
        } else if (!_drBlizoEdno(sabrano)) {
            const lipsva = _drIzvadi({ n: 1, d: 1 }, sabrano);
            out.push({ vid: 'nepalno', obekt: koren.id,
                tekst: `${ime} — събрани ${_drTekst(sabrano)}, липсва ${_drTekst(lipsva)}.` });
        }
        // Минус у някого, който НИЩО не е придобивал в регистъра, не е дефект —
        // той е краят на веригата нагоре. Строителят продава магазина, без
        // неговото придобиване да е вписано, и това е нормално: събраното вече
        // е 1/1 и назад не се копае. Дефект е само когато е придобил нещо и е
        // прехвърлил ПОВЕЧЕ от него. (Сан Стефано, 13.10.2026)
        const pridobival = new Set(s.sabitia.filter(e => e.obekt === koren.id)
            .flatMap(e => (e.pridobivashti || []).map(pr => pr.lice)).filter(Boolean));
        for (const [lice, f] of salda)
            if (f.n < 0 && pridobival.has(lice)) out.push({ vid: 'minus', obekt: koren.id,
                tekst: `${_sbImeImeBezopasno(s, lice)} е прехвърлил ${_drTekst({ n: -f.n, d: f.d })} `
                     + `повече, отколкото е имал в ${ime}.` });
        for (const l of s.lica) {
            if (!l.pochinal) continue;
            const f = salda.get(l.id);
            if (f && f.n > 0) out.push({ vid: 'pochinal', lice: l.id, obekt: koren.id,
                tekst: `${_sbImeImeBezopasno(s, l.id)} е починал на ${l.pochinal}, `
                     + `а още държи ${_drTekst(f)} от ${ime} — липсва наследяване.` });
        }
    }
    // Събитията се проверяват винаги: сбъркан дял или липсващ получател е
    // дефект в самия запис, независимо кой е коренът.
    const vazhni = koren ? s.sabitia.filter(e => e.obekt === koren.id) : [];
    for (const e of vazhni) {
        if (!(e.pridobivashti || []).length)
            out.push({ vid: 'prazen_akt', sabitie: e.id,
                tekst: `${_sbImeAkt(e)} няма придобиващ — кой получава правото?` });
        for (const pr of e.pridobivashti || []) {
            if (!_dr(pr.dyal))
                out.push({ vid: 'dyal', sabitie: e.id,
                    tekst: `Дялът „${pr.dyal || ''}“ в ${_sbImeAkt(e)} не се чете `
                         + `— пиши дроб (1/2) или процент (8,38%).` });
        }
    }
    // Събитие, което сочи изтрито лице или обект. Не бива да се случва след
    // поправката на изтриването, но старите данни го носят. (15.10.2026)
    for (const e of s.sabitia) {
        if (e.ot && !_sbLice(s, e.ot))
            out.push({ vid: 'sirache', sabitie: e.id,
                tekst: `${_sbImeAkt(e)}: прехвърлителят е изтрит от списъка с лица `
                     + `— впиши го наново или махни акта.` });
        for (const pr of e.pridobivashti || []) {
            if (pr.lice && !_sbLice(s, pr.lice))
                out.push({ vid: 'sirache', sabitie: e.id,
                    tekst: `${_sbImeAkt(e)}: придобиващият е изтрит от списъка с лица `
                         + `— впиши го наново или махни акта.` });
        }
        if (e.obekt && !_sbObekt(s, e.obekt))
            out.push({ vid: 'sirache', sabitie: e.id,
                tekst: `${_sbImeAkt(e)} сочи изтрит обект.` });
    }

    // Еднакви изречения не се повтарят.
    const vidyani = new Set();
    return out.filter(n => !vidyani.has(n.tekst) && vidyani.add(n.tekst));
}

const _sbImeImeBezopasno = (s, id) => _s2esc(_sbImeLice(s, id));

// ── към документите ───────────────────────────────────────────────────────
// Операторът, 13.10.2026: в акт 7 възложител не се изисква; в протокол 2 се
// пише само името на ЕДИН представител по избор; в хедъра на документите —
// всички възложители, с по две имена.

// „Иван Георгиев Петров“ → „Иван Петров“. Фирмите се изписват както са.
function _sbDveImena(ime) {
    const d = String(ime || '').trim().split(/\s+/);
    if (d.length < 3) return d.join(' ');
    if (/(ООД|ЕООД|АД|ЕАД|СД|КД|ЕТ)/.test(ime)) return ime.trim();
    return d[0] + ' ' + d[d.length - 1];
}

// Възложителите към дата, в вида, който шаблоните вече приемат. Празен списък
// значи „регистърът още не е пълнен“ — тогава се ползва писаното на ръка.
// Правното основание в ОСИП — досега точки: „Правно основание: ......“.
// Регистърът го знае: това са актовете, с които ДНЕШНИТЕ възложители държат
// правата си. Изброяват се по веднъж, в реда на датите. Непопълнен регистър
// връща празно и шаблонът си оставя точките. (Операторът, 16.10.2026: „никъде
// не записва НА“.)
function _sbPravnoOsnovanie(p, data) {
    const s = _sbDanni(p);
    const nositeli = new Set(_sbVazlozhiteli(p, data).map(v => v.lice));
    if (!nositeli.size) return '';
    const pred = data ? _sbRed(data) : '99999999';
    const vidyani = new Set(), redove = [];
    for (const e of [...s.sabitia].sort((a, b) => _sbRed(a.data).localeCompare(_sbRed(b.data)))) {
        if (_sbRed(e.data) > pred) continue;
        if (!(e.pridobivashti || []).some(pr => nositeli.has(pr.lice))) continue;
        const tekst = [e.dokument || e.vid || '', e.data ? 'от ' + e.data : '']
            .filter(Boolean).join(' ').trim();
        if (!tekst || vidyani.has(tekst)) continue;
        vidyani.add(tekst);
        redove.push(tekst.charAt(0).toUpperCase() + tekst.slice(1));
    }
    return redove.join('; ');
}

function _sbKlienti(p, data) {
    const s = _sbDanni(p);
    return _sbVazlozhiteli(p, data).map(v => {
        const l = _sbLice(s, v.lice) || {};
        const yur = l.vid === 'юридическо';
        // Пълномощното е СВОЙСТВО НА ЛИЦЕТО, не събитие — то не придобива
        // нищо. Оттук „кой подписва“ влиза само в документите, вместо да се
        // пише на всеки акт. (Операторът, 21.10.2026.)
        const pr = l.predstavitel || null;
        return {
            type: yur ? 'ЮЛ' : 'ФЛ',
            name: l.ime || '',
            dveImena: _sbDveImena(l.ime),
            eik: l.egn || '',
            ot_registar: true,
            podpisva: pr ? pr.ime : '',
            podpisva_osnovanie: pr ? [pr.nomer && 'пълномощно № ' + pr.nomer,
                                      pr.data && 'от ' + pr.data].filter(Boolean).join(' ') : '',
            predstavitel: pr || undefined,
        };
    });
}

// Кой представлява възложителите в протокол 2. Един, по избор — пази се на
// имота, защото се сменя рядко.
function _sbPredstavitel(p, data) {
    const s = _sbDanni(p);
    const spisak = _sbVazlozhiteli(p, data);
    if (!spisak.length) return '';
    const izbran = spisak.find(v => v.lice === s.predstavitel) || spisak[0];
    return _sbDveImena(_sbImeLice(s, izbran.lice));
}

// ── чеклистът ─────────────────────────────────────────────────────────────
// Тези редове ги има в чеклиста по моменти, но на тях вече отговаря регистърът.
// Операторът, 13.10.2026: „четенето на НА и проверките да бъде само в
// Собственост — така ще освободим доста чек от листата“. Затова вместо три
// въпроса, на които се отговаря с едно и също, остава ЕДИН ред, който казва
// докъде е стигнала веригата и праща натам.
const _SB_REDOVE = [
    'Документ за собственост на имота',
    'Нотариален акт за учредено право на строеж',
    'Документ за собственост или документ за учредено право на строеж',
];

// Коренът: обектът, В КОЙТО СЕ СТРОИ. При ново строителство е земята, при
// преустройство — самият апартамент или магазин. Неговата 1/1 се събира, не
// историята на цялата сграда.
function _sbKoren(p) {
    const s = _sbDanni(p);
    return _sbObekt(s, s.koren) || s.obekti.find(o => o.vid === 'земя') || s.obekti[0] || null;
}

function _sbSastoyanie(p) {
    const s = _sbDanni(p);
    const koren = _sbKoren(p);
    if (!koren) return { gotovo: false, tekst: 'още не е започната — веригата тръгва от обекта, в който се строи' };
    const sab = _sbSabrano(p, koren.id);
    const nah = _sbNahodki(p).filter(n => !n.obekt || n.obekt === koren.id);
    if (_drBlizoEdno(sab) && !nah.length)
        return { gotovo: true, tekst: `${_sbImeObekt(s, koren.id)} — събрана 1/1, веригата връзва` };
    return { gotovo: false, tekst: nah.length ? nah[0].tekst
        : `${_sbImeObekt(s, koren.id)} — събрани ${_drTekst(sab)}` };
}

// Регистърът на ДНСК казва, че ФИРМАТА е вписана, но не кои лица са в нея.
// Операторът, 14.10.2026: „може да се изисква сканиран актуален списък на
// Консултанта и лиценз“ — затова редът се добавя към ОСИП. Той доказва, че
// човекът, който подписва акта, е правоспособен.
const _DOP_REDOVE = [
    { moment: 'ОСИП',
      dokument: 'Актуален списък на правоспособните лица на консултанта и лиценз',
      uslovie: 'винаги', vliza_v: ['ОСИП', 'Акт 15', 'ОД'] },
];

function _dopalniCheklist(r) {
    for (const red of _DOP_REDOVE) {
        const g = (r.grupi || []).find(x => x.moment === red.moment);
        if (!g || g.dokumenti.some(d => d.dokument === red.dokument)) continue;
        g.dokumenti.push({ ...red, sastoyanie: g.minal === false ? 'не му е времето' : 'очаква се' });
    }
    return r;
}

// Подменя редовете в отговора на /api/nadzor, преди той да се рисува.
function _sbPodmeniCheklist(p, r) {
    _dopalniCheklist(r);
    const sast = _sbSastoyanie(p);
    let slozhen = false;
    for (const g of r.grupi || []) {
        const beshe = g.dokumenti.length;
        g.dokumenti = g.dokumenti.filter(d => !_SB_REDOVE.includes(d.dokument));
        if (beshe === g.dokumenti.length) continue;
        if (slozhen) continue;                 // един ред за целия чеклист
        slozhen = true;
        g.dokumenti.unshift({
            dokument: 'Собственост — веригата от нотариални актове',
            uslovie: 'винаги',
            vliza_v: ['ОСИП', 'Протокол 2', 'Акт 15', 'ОД'],
            sastoyanie: sast.gotovo ? 'налично' : 'очаква се',
            ot_registara: true,
            podskazka: sast.tekst,
        });
    }
    return r;
}

// ЕГН не се пази и не се показва. Операторът, 14–15.10.2026: „четецът НЕ
// ТРЯБВА да показва ЕГН“ и „личните данни не трябва да се вписват“.
//
// Чистенето е при ВСЯКО отваряне на данните, не еднократно: така и вече
// събраното изчезва, и нищо прокраднало се не оцелява до следващия път.
function _sbIzchistiEgn(s) {
    let mahnati = 0;
    for (const l of s.lica || []) {
        if (l.egn && eEGN(l.egn)) { delete l.egn; mahnati++; }
    }
    return mahnati;
}

const _skritoEgn = v => skriiEGN(v);

// ── екранът ────────────────────────────────────────────────────────────────
const _sbDnes = () => new Date().toLocaleDateString('bg-BG').replace(/\s/g, '');

function renderSobstvenostPage() {
    const p = _obektIliIzbor('sobstvenost-content', 'sobstvenost', 'Изберете имота');
    if (!p) return;
    document.getElementById('sobstvenost-content').innerHTML =
        _lentaObekt(p, 'sobstvenost') + _sbHtml(p);
    try {
        const c = localStorage.getItem('sb_chetec') || 'mistral';
        const el = document.getElementById('sb-chetec');
        if (el) el.value = c;
    } catch (e) {}
}

function _sbHtml(p) {
    const esc = _s2esc, s = _sbDanni(p);
    const nah = _sbNahodki(p);
    const data = p._sb_data || _sbDnes();
    const vaz = _sbVazlozhiteli(p, data);
    const zemya = s.obekti.find(o => o.vid === 'земя');

    const glava = !s.obekti.length ? `
        <div class="card" style="margin-bottom:16px;border-color:var(--gold)">
            <div style="font-size:19px;font-weight:700;margin-bottom:4px">Веригата започва от земята</div>
            <p style="font-size:13px;color:var(--muted);margin-bottom:12px">
                Първият обект е поземленият имот. После всяко право в него — право на строеж,
                апартамент, гараж — е отделен обект със своя верига.
            </p>
            <button class="btn btn-primary" onclick="sbZapochni()">Започни от ${esc(p.pi || 'имота')}</button>
        </div>`
    : nah.length ? `
        <div class="alert alert-warning" style="margin:0 0 16px"><div>
            <strong>Веригата не връзва на ${nah.length} ${nah.length === 1 ? 'място' : 'места'}</strong>
            <div style="font-size:12.5px;margin-top:6px;line-height:1.8">
                ${nah.map(n => `<div>· ${n.tekst}</div>`).join('')}
            </div>
            <div style="font-size:11.5px;color:var(--muted);margin-top:8px">
                Назад се копае, докато земята се събере до 1/1 — не по-далеч.
            </div>
        </div></div>`
    : `<div class="alert alert-success" style="margin:0 0 16px">
            ✅ Веригата е пълна — събрана е цялата собственост върху
            ${esc(_sbImeObekt(s, (_sbKoren(p) || {}).id))}.
       </div>`;

    const vazlozhiteli = s.obekti.length ? `
        <div class="card" style="margin-bottom:16px">
            <div class="card-header" style="align-items:center">
                <div>
                    <div class="card-title">\u{1F464} Възложители по ЗУТ</div>
                    <div class="card-subtitle">Не се въвеждат — всеки с вещно право към тази дата е възложител.</div>
                </div>
                <input type="text" class="form-input" style="width:130px" value="${esc(data)}"
                       placeholder="дд.мм.гггг" onchange="sbData(this.value)">
            </div>
            ${vaz.length ? `<div style="font-size:13.5px;line-height:1.9">
                ${vaz.map(v => `<div><strong>${esc(v.ime)}</strong>
                    <span style="color:var(--muted)">— ${v.prava.map(pr =>
                        `${_drTekst(pr.dyal)} от ${esc(_sbImeObekt(s, pr.obekt))}`).join(' · ')}</span>
                    <label style="margin-left:8px;font-size:11.5px;color:var(--muted);cursor:pointer">
                        <input type="radio" name="sb-pred" ${s.predstavitel === v.lice
                            || (!s.predstavitel && v === vaz[0]) ? 'checked' : ''}
                               onchange="sbPredstavitel('${v.lice}')"> представител</label>
                    </div>`).join('')}
                <div style="font-size:11.5px;color:var(--muted);margin-top:8px;line-height:1.6">
                    В хедъра на документите излизат <strong>всички</strong>, с по две имена.
                    В протокол 2 — само избраният представител. В акт 7 възложител не се изисква.
                </div>
                ${(() => {
                    // Кой подписва Акт 15: всички или нотариално упълномощен.
                    const pod = _sbPodpisi(p, data);
                    if (!pod.broj) return '';
                    const chuzhdi = pod.redove.filter(r => !r.sam);
                    return `<div style="font-size:11.5px;margin-top:8px;line-height:1.7">
                        <strong>Акт 15 подписват ${pod.broj}</strong>${chuzhdi.length
                            ? ' · ' + chuzhdi.map(r => `${esc(r.podpisva)} за ${esc(r.ime)}${
                                r.osnovanie ? ' (пълномощно ' + esc(r.osnovanie) + ')' : ''}`).join(' · ')
                            : ' — всички лично'}
                        ${pod.lipsvat.map(x => `<div style="color:#b45309">⚠️ ${esc(x)}</div>`).join('')}
                    </div>`;
                })()}
            </div>` : `<div style="font-size:13px;color:var(--muted)">
                Към ${esc(data)} никой не държи вещно право — виж находките горе.</div>`}
        </div>` : '';

    const chetene = `
        <div class="card" style="margin-bottom:16px">
            <div class="card-title" style="margin-bottom:6px">\u{1F916} Прочети документ за собственост</div>
            <p style="font-size:12px;color:var(--muted);margin-bottom:10px">
                Нотариален акт, договор, удостоверение за наследници, постановление.
                Четецът търси прехвърлянията — кой на кого какъв дял; кодът проверява сбора.
            </p>
            <input type="file" id="sb-fajl" class="form-input" style="margin-bottom:8px"
                   accept=".pdf,.docx,.jpg,.jpeg,.png,.webp,.tif,.tiff" onchange="sbCheti()">
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <label for="sb-stranici" style="font-size:12.5px;color:var(--muted)">Страници (по избор):</label>
                <input type="text" id="sb-stranici" class="form-input" style="width:150px" placeholder="напр. 1-4, 20">
                <span style="font-size:11.5px;color:var(--muted)">за дълъг PDF с много актове — по-малко токени</span>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px">
                <label for="sb-chetec" style="font-size:12.5px;color:var(--muted)">Четец:</label>
                <select id="sb-chetec" class="form-input" style="width:auto;font-size:13px"
                        onchange="try { localStorage.setItem('sb_chetec', this.value) } catch (e) {}">
                    <option value="mistral">Mistral — френска фирма, обработката остава в ЕС</option>
                    <option value="claude">Claude — по-точен, но обработва в САЩ</option>
                    <option value="auto">Автоматично</option>
                </select>
                <span style="font-size:11.5px;color:var(--muted)">
                    документите за собственост носят лични данни</span>
            </div>
            <div id="sb-hod" style="font-size:12.5px;color:var(--muted);margin-top:8px"></div>
        </div>`;
    return glava + _sbChetenoHtml(p) + chetene + vazlozhiteli + _sbTablici(p);
}

function _sbTablici(p) {
    const esc = _s2esc, s = _sbDanni(p);
    const red = (h, redove, butonIme, butonFn) => `
        <details class="card" style="margin-bottom:12px" ${redove ? '' : 'open'}>
            <summary style="cursor:pointer;font-weight:600;font-size:14px">${h}</summary>
            <div style="margin-top:12px;font-size:13px;line-height:1.9">
                ${redove || '<span style="color:var(--muted)">няма</span>'}
            </div>
            <button class="btn btn-secondary btn-sm" style="margin-top:10px" onclick="${butonFn}">${butonIme}</button>
        </details>`;

    const lica = s.lica.map(l => `<div style="padding:3px 0">${esc(l.ime)}
        <span style="color:var(--muted)">· ${esc(l.vid || 'физическо')}${l.egn ? ' · ' + esc(_skritoEgn(l.egn)) : ''}${l.pochinal ? ' · † ' + esc(l.pochinal) : ''}</span>
        <button class="btn btn-ghost btn-sm" onclick="sbPredstavitelNa('${l.id}')">${
            l.predstavitel ? 'представител' : '+ представител'}</button>
        <button class="btn btn-ghost btn-sm" onclick="sbMahni('lica','${l.id}')">×</button>
        ${l.predstavitel ? `<div style="margin-left:14px;font-size:11.5px;color:var(--muted)">
            представлява се от <strong>${esc(l.predstavitel.ime)}</strong>${
            l.predstavitel.nomer ? ' · пълномощно № ' + esc(l.predstavitel.nomer) : ''}${
            l.predstavitel.data ? ' от ' + esc(l.predstavitel.data) : ''}${
            l.predstavitel.obhvat ? ' · ' + esc(l.predstavitel.obhvat) : ''}${
            l.predstavitel.do ? ' · до ' + esc(l.predstavitel.do) : ''}
            <button class="btn btn-ghost btn-sm" onclick="sbMahniPredstavitel('${l.id}')">×</button>
        </div>` : ''}</div>`).join('');

    const koren = _sbKoren(p);
    const obekti = s.obekti.map(o => {
        const sab = _sbSabrano(p, o.id);
        return `<div>${esc(o.identifikator || o.opisanie)}
            <span style="color:var(--muted)">· ${esc(o.vid || '')}${o.opisanie && o.identifikator ? ' · ' + esc(o.opisanie) : ''}</span>
            <span style="color:${_drBlizoEdno(sab) ? '#2e6b32' : '#b45309'}">· събрани ${_drTekst(sab)}</span>
            <label style="margin-left:8px;font-size:11.5px;color:var(--muted);cursor:pointer"
                   title="Копае се назад само докато ТОЗИ обект се събере до 1/1">
                <input type="radio" name="sb-koren" ${koren && koren.id === o.id ? 'checked' : ''}
                       onchange="sbKoren('${o.id}')"> тук се строи</label>
            <button class="btn btn-ghost btn-sm" onclick="sbMahni('obekti','${o.id}')">×</button></div>`;
    }).join('');

    // Един ред на АКТ, не на движение. Придобиващите са вътре в него.
    // (Операторът, 15.10.2026: „ако събитие е НА, то това събитие е 1“.)
    const sabitia = [...s.sabitia]
        .sort((a, b) => _sbRed(a.data).localeCompare(_sbRed(b.data)))
        .map(e => {
            const kak = (e.pridobivashti || []).map(pr =>
                `${esc(_sbImeLice(s, pr.lice))} <strong>${esc(pr.dyal || '?')}</strong>`).join(' · ');
            const ot = e.ot ? _sbImeLice(s, e.ot) : (e.ot_opisanie || '');
            return `<div style="padding:5px 0;border-bottom:1px solid var(--border-light)">
                <div><strong>${esc(e.vid || 'придобиване')}</strong>${e.data ? ' · ' + esc(e.data) : ''}
                    <span style="color:var(--muted)">· ${esc(_sbImeObekt(s, e.obekt))}</span>
                    <button class="btn btn-ghost btn-sm" onclick="sbMahni('sabitia','${e.id}')">×</button></div>
                <div style="margin-left:14px">придобиват: ${kak || '<span style="color:var(--red)">никой</span>'}</div>
                ${ot ? `<div style="margin-left:14px;color:var(--muted)">от: ${esc(ot)}${
                    e.ot ? '' : ' <span style="font-size:11px">(по акта; не е вписан като лице)</span>'}</div>` : ''}
                ${e.dokument ? `<div style="margin-left:14px;color:var(--muted);font-size:11.5px">${esc(e.dokument)}</div>` : ''}
                ${e.podpisali ? `<div style="margin-left:14px;color:var(--muted);font-size:11.5px">${esc(e.podpisali)}</div>` : ''}
            </div>`;
        }).join('');

    return red(`\u{1F464} Лица (${s.lica.length})`, lica, '+ Добави лице', 'sbDobaviLice()')
         + red(`\u{1F3E0} Обекти (${s.obekti.length})`, obekti, '+ Добави обект', 'sbDobaviObekt()')
         + red(`\u{1F4DC} Актове за придобиване (нот. актове и/или други документи) · ${s.sabitia.length}`, sabitia,
                '+ Впиши акт', 'sbDobaviSabitie()');
}

// ── четенето на акт ───────────────────────────────────────────────────────
// Четецът не търси „кой е собственикът“ — търси ПРЕХВЪРЛЯНЕ: кой на кого какъв
// дял. Прочетеното не влиза само; стои като предложение, докато операторът го
// приеме. Номерът на акта се вписва на ръка (вж. _KES_NARAKA — същото правило).

// Поле в картата на прочетеното: стойността идва от четеца, но се пипа.
// Дотук пишеше „вписва се на ръка“, а нямаше КЪДЕ. (Операторът, 14.10.2026:
// „къде поправям сбърканото от четеца“.)
function _sbPoleHtml(klyuch, etiket, stoynost) {
    const esc = _s2esc;
    return `<label style="font-size:11.5px;color:var(--muted)">${esc(etiket)}
        <input type="text" class="form-input" style="font-size:13px;margin-top:2px"
               value="${esc(stoynost || '')}" oninput="sbPopravi('${klyuch}', this.value)">
    </label>`;
}

// Поправката се пази веднага в прочетеното — приемането взима поправеното.
function sbPopravi(klyuch, stoynost) {
    const p = _zhivObekt();
    if (p && p._sb_procheteno) p._sb_procheteno[klyuch] = stoynost;
}

function _sbChetenoHtml(p) {
    const esc = _s2esc, ch = p._sb_procheteno;
    if (!ch) return '';
    const bel = ch.belezhki || [];
    const red = (et, st) => st ? `<div><span style="color:var(--muted)">${et}:</span> ${esc(st)}</div>` : '';
    return `
        <div class="card" style="margin-bottom:16px;border-color:var(--gold)">
            <div class="card-title" style="margin-bottom:6px">\u{1F4D6} Прочетено от „${esc(ch.fajl || '')}“</div>
            <div style="font-size:13px;line-height:1.8">
                ${red('Вид', ch.vid)}
                <div style="color:#8a6400;background:#fffbef;border-left:3px solid #d99a00;
                            padding:8px 10px;border-radius:0 6px 6px 0;margin:6px 0">
                    <strong>[___] Номерът на акта се вписва на ръка.</strong>
                    <div style="font-size:12px;margin:3px 0 8px">
                        Сверѝ с документа — сбъркана цифра сочи ЧУЖД акт и не личи после никъде.
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px">
                        ${_sbPoleHtml('nomer', '№', ch.nomer)}
                        ${_sbPoleHtml('tom', 'том', ch.tom)}
                        ${_sbPoleHtml('registar', 'рег. №', ch.registar)}
                        ${_sbPoleHtml('delo', 'дело', ch.delo)}
                        ${_sbPoleHtml('data', 'дата', ch.data)}
                        ${_sbPoleHtml('notarius', 'нотариус', ch.notarius)}
                    </div>
                </div>
                ${(ch.lica || []).length ? `<div style="margin-top:6px"><strong>Лица</strong>
                    ${ch.lica.map(l => `<div>· ${esc(l.ime)}${l.egn_eik ? ' · ' + esc(_skritoEgn(l.egn_eik)) : ''}${l.pochinal ? ' · † ' + esc(l.pochinal) : ''}</div>`).join('')}</div>` : ''}
                ${(ch.obekti || []).length ? `<div style="margin-top:6px"><strong>Обекти</strong>
                    ${ch.obekti.map(o => `<div>· ${esc(o.identifikator || o.opisanie)}${o.identifikator && o.opisanie ? ' · ' + esc(o.opisanie) : ''}</div>`).join('')}</div>` : ''}
                ${(ch.prehvarliania || []).length ? `<div style="margin-top:6px"><strong>Прехвърляния</strong>
                    ${ch.prehvarliania.map(x => `<div>· ${esc(x.vid || '')} · <strong>${esc(x.dyal || '?')}</strong>
                        от ${esc(x.ot || '—')} на ${esc(x.na || '?')}
                        <span style="color:var(--muted)">· ${esc(x.obekt || '')}</span></div>`).join('')}</div>`
                 : '<div style="margin-top:6px;color:var(--red)">Няма прочетено прехвърляне.</div>'}
            </div>
            ${bel.length ? `<div class="alert alert-warning" style="margin:10px 0 0"><div>
                <strong>Кодът казва</strong>
                <div style="font-size:12.5px;margin-top:4px;line-height:1.7">
                    ${bel.map(b => `<div>· ${esc(b)}</div>`).join('')}</div></div></div>` : ''}
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
                <button class="btn btn-primary" onclick="sbPriemi()">Приеми в регистъра</button>
                <button class="btn btn-ghost" onclick="sbOtkazhi()">Откажи</button>
            </div>
            <p style="font-size:11.5px;color:var(--muted);margin:8px 0 0">
                Лицата и обектите, които ги няма, се добавят. Прочетеното не влиза,
                докато не натиснеш „Приеми“.
            </p>
        </div>`;
}

async function sbCheti() {
    const p = _zhivObekt();
    const vhod = document.getElementById('sb-fajl');
    const hod = document.getElementById('sb-hod');
    const f = vhod && vhod.files && vhod.files[0];
    if (!p || !f) return;
    if (/\.doc$/i.test(f.name)) { hod.textContent = 'Стар .doc — запиши го като .docx или PDF.'; return; }
    hod.textContent = `Чета „${f.name}“…`;
    try {
        const r = await apiCall('/api/sobstvenost/chete', 'POST', {
            pi: p.pi,
            // Документите за собственост носят лични данни, затова се четат с
            // европейски доставчик. Mistral е френска фирма и обработката
            // остава в ЕС; Claude е в САЩ. Изборът е отделен от общия четец —
            // тук по подразбиране не е „auto“. (Операторът, 15.10.2026)
            chetec: localStorage.getItem('sb_chetec') || 'mistral',
            stranici: (document.getElementById('sb-stranici') || {}).value || '',
            fajl: { ime: f.name, media_type: f.type, data: await fileToBase64(f) },
        });
        if (r.greshka) { hod.textContent = `⚠️ ${r.greshka}`; return; }
        p._sb_procheteno = r.dokument;
        hod.textContent = '';
        _prerisuvai();
    } catch (e) {
        hod.textContent = `❌ ${e.message}`;
    }
}

function sbOtkazhi() {
    const p = _zhivObekt(); if (!p) return;
    delete p._sb_procheteno;
    _prerisuvai();
}

// „1/1“ на трима души значи по 1/3 на всеки. Делението е точно, защото
// дяловете са дроби. Нечетим дял се оставя както е — операторът ще го поправи.
function _drDeli(tekst, n) {
    const f = _dr(tekst);
    if (!f || n < 2) return String(tekst || '').trim();
    return _drTekst(_drSvi({ n: f.n, d: f.d * n }));
}

// Приемането е сверяване по име: лице или обект, което вече го има, не се
// създава втори път — иначе един и същ Иван става двама и веригата се къса.
// Две събития са едно и също, когато съвпадат по обект, вид, страни, дял и
// дата. Номерът на документа НЕ влиза: същият акт, препрочетен с поправен
// номер, пак е същото прехвърляне.
//
// Страните се сравняват по ИМЕ, не по вътрешен номер: изтрито и пресъздадено
// лице получава нов номер и същото събитие минаваше за ново. Така се удвоиха
// осем прехвърляния на шестнайсет. (ЖИТЕН, 15.10.2026)
function _sbEdnakvi(s, a, b) {
    const ime = id => (id ? String((_sbLice(s, id) || {}).ime || id).trim().toLowerCase() : '');
    const spisak = e => (e.pridobivashti || [])
        .map(pr => ime(pr.lice) + ' ' + String(pr.dyal || '').trim()).sort().join(' | ');
    return a.obekt === b.obekt && a.vid === b.vid
        && ime(a.ot) === ime(b.ot)
        && String(a.data || '').trim() === String(b.data || '').trim()
        && spisak(a) === spisak(b);
}

function sbPriemi() {
    const p = _zhivObekt(); if (!p) return;
    const ch = p._sb_procheteno; if (!ch) return;
    const s = _sbDanni(p);
    const klyuch = x => String(x || '').trim().toLowerCase().replace(/\s+/g, ' ');
    // Четецът понякога слага няколко лица в едно поле („Иван…, Мария…“), макар
    // указанието да иска по един ред на човек. Едно лице от две имена чупи
    // цялата верига, затова се разделят тук. (ЖИТЕН, 14.10.2026)
    const imena = v => _sbStrani(v);

    // Намира лице, ако вече е в регистъра. НЕ създава — създаването е само
    // при придобиване.
    const nameriLice = (ime) => {
        const l = s.lica.find(x => klyuch(x.ime) === klyuch(ime));
        return l ? l.id : null;
    };

    const lice = (ime, dop) => {
        if (!klyuch(ime)) return null;
        let l = s.lica.find(x => klyuch(x.ime) === klyuch(ime));
        if (!l) { l = { id: _sbNovId(), ime: String(ime).trim(), vid: 'физическо' }; s.lica.push(l); }
        dop = dop || dopalnenia[klyuch(ime)];
        if (dop) { if (dop.vid) l.vid = dop.vid;
                   if (dop.egn_eik && !eEGN(dop.egn_eik)) l.egn = l.egn || dop.egn_eik;
                   if (dop.pochinal) l.pochinal = l.pochinal || dop.pochinal; }
        return l.id;
    };
    const obekt = (opis) => {
        if (!klyuch(opis)) return (s.obekti[0] || {}).id || null;
        let o = s.obekti.find(x => klyuch(x.identifikator) === klyuch(opis)
                                || klyuch(x.opisanie) === klyuch(opis));
        if (!o) {
            o = { id: _sbNovId(), vid: 'самостоятелен обект', identifikator: '', opisanie: String(opis).trim() };
            const ot = (ch.obekti || []).find(x => klyuch(x.identifikator) === klyuch(opis)
                                                || klyuch(x.opisanie) === klyuch(opis));
            if (ot) { o.identifikator = ot.identifikator || ''; o.opisanie = ot.opisanie || o.opisanie;
                      o.vid = ot.vid || o.vid; }
            s.obekti.push(o);
        }
        return o.id;
    };

    // Лицата НЕ се създават вкупом. Създава се този, който придобива —
    // по-долу, при самия акт. Тук само се запомнят допълненията (вид, ЕИК),
    // за да се ползват, ако лицето наистина влезе.
    const dopalnenia = {};
    for (const l of ch.lica || []) if (l && l.ime) dopalnenia[klyuch(l.ime)] = l;
    // Обектите — САМО тези, в които има прехвърляне. Актът изброява и чужди
    // обекти, за да ги изключи от сделката („всички останали обекти в
    // комплекса“); те не са обекти на този регистър. (13.10.2026)
    const zasegnati = new Set((ch.prehvarliania || [])
        .map(x => klyuch(x.obekt)).filter(Boolean));
    for (const o of ch.obekti || []) {
        const k1 = klyuch(o.identifikator), k2 = klyuch(o.opisanie);
        if (zasegnati.has(k1) || zasegnati.has(k2)) obekt(o.identifikator || o.opisanie);
    }

    // Видът на ДОКУМЕНТА не е видът на СДЕЛКАТА. Щом има том, регистър, дело
    // или нотариус — документът е нотариален акт, каквато и да е сделката
    // вътре. (Операторът, 15.10.2026: „НА е записан като договор за
    // покупко-продажба“.)
    const notarialen = [ch.tom, ch.registar, ch.delo, ch.notarius]
        .some(x => String(x || '').trim());
    const vidDokument = notarialen ? 'нотариален акт' : (ch.vid || 'документ за собственост');
    // „Росица Рашева – Нотариус“ → „Росица Рашева“: думата я пишем ние.
    const notarius = String(ch.notarius || '')
        .replace(/[\s–—-]*нотариус\s*$/i, '').trim();
    const dokument = [vidDokument, ch.nomer && '№ ' + ch.nomer, ch.tom && 'том ' + ch.tom,
                      ch.registar && 'рег. № ' + ch.registar, ch.delo && 'дело ' + ch.delo,
                      notarius && 'нотариус ' + notarius].filter(Boolean).join(', ');
    let n = 0, veche = 0;
    // ЕДИН АКТ — ЕДНО СЪБИТИЕ. Дяловете са вътре в него, не са отделни
    // събития. (Операторът, 15.10.2026: „ако събитие е НА, то това събитие е
    // 1, а не 2“.)
    //
    // И: ЛИЦЕ СЕ СЪЗДАВА, КОГАТО ПРИДОБИВА. Прехвърлителят е описание към
    // акта, докато не докажем и неговото придобиване — тогава се качва
    // неговият акт и той вече придобива. Затова четиримата продавачи на
    // ЖИТЕН не стават лица: те са в разказа, не в регистъра.
    // РАЗКАЗЪТ НЕ СЕ ЗАПИСВА. Нотариалният акт почти винаги започва с това как
    // продавачът е станал собственик — по наследство, по делба, по предишна
    // покупка. За четеца това изглежда като още едно прехвърляне.
    //
    // Познава се по правило, не по догадка: ако някой придобива в един ред и
    // прехвърля в друг ред от СЪЩИЯ документ, първият ред е предисловие.
    // Актът доказва собствеността на крайния приобретател; нагоре не се копае.
    // (Операторът, 15.10.2026: „четиримата продавачи са в разказа.“)
    const redove = ch.prehvarliania || [];
    const prehvarliat = new Set(redove.flatMap(x => imena(x.ot).map(klyuch)));
    const sdelki = redove.filter(x => !imena(x.na).every(na => prehvarliat.has(klyuch(na))));
    // Замяна: двамата си прехвърлят взаимно и правилото би изхвърлило всичко.
    for (const x of (sdelki.length ? sdelki : redove)) {
        const poluchateli = imena(x.na);
        if (!poluchateli.length) continue;
        const dava = imena(x.ot);
        const obektId = obekt(x.obekt);
        const dyal = _drDeli(x.dyal, poluchateli.length);
        // Прехвърлителите стават лица САМО ако вече са в регистъра — тогава
        // салдата им трябва да паднат. Иначе остават имена върху акта.
        const otLica = dava.map(nameriLice).filter(Boolean);
        const otLice = otLica.length === dava.length && otLica.length === 1 ? otLica[0] : null;
        const sabitie = {
            id: _sbNovId(), obekt: obektId, vid: x.vid || 'покупко-продажба',
            data: ch.data || '', dokument,
            ot: otLice,
            ot_lica: otLica.length === dava.length && otLica.length > 1 ? otLica : undefined,
            ot_opisanie: dava.join(', '),
            // Кой е подписал от името на страните — личи върху акта, но не е лице.
            podpisali: [_sbKojPodpisva(x.ot), _sbKojPodpisva(x.na)].filter(Boolean).join('; '),
            pridobivashti: poluchateli.map(na => ({ lice: lice(na), dyal })),
            ot_chetene: ch.fajl || '', citat: x.citat || '',
        };
        if (s.sabitia.some(e => _sbEdnakvi(s, e, sabitie))) { veche++; continue; }
        s.sabitia.push(sabitie);
        n++;
    }

    delete p._sb_procheteno;
    _sbZapishi(p, veche
        ? `${n} нови прехвърляния от „${ch.fajl || ''}“ · ${veche} вече ги имаше`
        : `прочетени ${n} прехвърляния от „${ch.fajl || ''}“`);
    if (veche) showAlert(n ? 'warning' : 'success', n
        ? `Добавени ${n} нови; ${veche} вече бяха в регистъра и не се удвоиха.`
        : `Нищо ново — всичките ${veche} прехвърляния вече бяха в регистъра.`);
}

// ── въвеждането ────────────────────────────────────────────────────────────
// Засега на ръка. Четенето на нотариален акт от АИ-то идва след това и ще пълни
// същите три таблици — номерът на акта остава ръчен (вж. _KES_NARAKA).
function _sbZapishi(p, kakvo) { _s2ZapishiTiho(p, 'Собственост: ' + kakvo); _prerisuvai(); }

// Коренът: при ново строителство е земята, при преустройство — самият
// апартамент или магазин. Иначе системата иска земята на цяла жилищна сграда,
// за да смениш предназначението на един магазин. (Операторът, 13.10.2026)
function sbKoren(id) {
    const p = _zhivObekt(); if (!p) return;
    _sbDanni(p).koren = id;
    _sbZapishi(p, 'строи се в ' + _sbImeObekt(_sbDanni(p), id));
}

function sbPredstavitel(lice) {
    const p = _zhivObekt(); if (!p) return;
    _sbDanni(p).predstavitel = lice;
    _sbZapishi(p, 'представител за протокол 2');
}

function sbData(v) { const p = _zhivObekt(); if (p) { p._sb_data = v.trim(); _prerisuvai(); } }

function sbZapochni() {
    const p = _zhivObekt(); if (!p) return;
    const s = _sbDanni(p);
    s.obekti.push({ id: _sbNovId(), vid: 'земя', identifikator: p.pi || '', opisanie: 'поземлен имот' });
    _sbZapishi(p, 'земята е първият обект');
}

// ПЪЛНОМОЩНОТО Е СВОЙСТВО НА ЛИЦЕТО.
// Операторът, 21.10.2026: „може да го сложим в собствеността, така ще имаме
// възложител и неговия упълномощен представител“. И: „Акт 15 може да подпише
// само нотариално заверен упълномощен, с приложено пълномощно, подобно на НА“.
//
// Пази четирите неща, които после се проверяват: кой представлява кого, с
// какъв документ, за какво и докога.
function sbPredstavitelNa(lice) {
    const p = _zhivObekt(); if (!p) return;
    const s = _sbDanni(p);
    const l = _sbLice(s, lice); if (!l) return;
    const sega = l.predstavitel || {};
    const ime = (prompt(`Кой представлява ${l.ime}?` + String.fromCharCode(10, 10)
        + 'Трите имена; празно = махни представителя', sega.ime || '') || '').trim();
    if (!ime) { delete l.predstavitel; _sbZapishi(p, `${l.ime} — махнат представител`); return; }
    const nomer = (prompt('Пълномощно — рег. № на нотариалната заверка:', sega.nomer || '') || '').trim();
    const data = (prompt('Дата на заверката (дд.мм.гггг):', sega.data || '') || '').trim();
    const obhvat = (prompt('За какво е пълномощното?' + String.fromCharCode(10, 10)
        + 'напр. „общо“ или „да подписва актове и протоколи“',
        sega.obhvat || 'общо') || '').trim();
    const do_ = (prompt('До кога важи (дд.мм.гггг)? Празно = без срок:', sega.do || '') || '').trim();
    l.predstavitel = { ime, nomer, data, obhvat, do: do_ };
    _sbZapishi(p, `${l.ime} — представител ${ime}`);
}

function sbMahniPredstavitel(lice) {
    const p = _zhivObekt(); if (!p) return;
    const l = _sbLice(_sbDanni(p), lice); if (!l || !l.predstavitel) return;
    const ime = l.predstavitel.ime;
    delete l.predstavitel;
    _sbZapishi(p, `${l.ime} — махнат представител ${ime}`);
}

// Кой подписва Акт 15 — и достатъчно ли е. Там изискването е по-строго: всички
// възложители, а заместването е само с нотариално заверено пълномощно.
function _sbPodpisi(p, data) {
    const s = _sbDanni(p);
    const vaz = _sbVazlozhiteli(p, data);
    const redove = [], lipsvat = [];
    for (const v of vaz) {
        const l = _sbLice(s, v.lice) || {};
        const pr = l.predstavitel;
        if (!pr) { redove.push({ ime: v.ime, podpisva: v.ime, sam: true }); continue; }
        const bezDokument = !String(pr.nomer || '').trim() && !String(pr.data || '').trim();
        if (bezDokument) lipsvat.push(`${v.ime} се представлява от ${pr.ime}, но няма пълномощно`);
        else if (pr.obhvat && !/общо|подпис|акт/i.test(pr.obhvat))
            lipsvat.push(`пълномощното на ${pr.ime} е „${pr.obhvat}“ — не покрива подписване на акт`);
        redove.push({ ime: v.ime, podpisva: pr.ime, sam: false,
                      osnovanie: [pr.nomer && '№ ' + pr.nomer, pr.data && 'от ' + pr.data]
                          .filter(Boolean).join(' ') });
    }
    return { redove, lipsvat, broj: vaz.length };
}

function sbDobaviLice() {
    const p = _zhivObekt(); if (!p) return;
    const ime = (prompt('Име на лицето (или фирма):') || '').trim();
    if (!ime) return;
    const yur = /(ООД|ЕООД|АД|ЕАД|СД|КД|ЕТ)\b/.test(ime);
    // За физическо лице не се пита ЕГН: лицето се разпознава по име и по
    // нотариалния акт, а той е и по-силното доказателство. (15.10.2026)
    const egn = yur ? (prompt('ЕИК (по избор):') || '').trim() : '';
    _sbDanni(p).lica.push({ id: _sbNovId(), ime, vid: yur ? 'юридическо' : 'физическо', egn });
    _sbZapishi(p, `лице „${ime}“`);
}

function sbDobaviObekt() {
    const p = _zhivObekt(); if (!p) return;
    const vid = (prompt('Вид: земя · сграда · самостоятелен обект · право на строеж', 'самостоятелен обект') || '').trim();
    if (!vid) return;
    const ident = (prompt('Идентификатор по КККР (вписва се на ръка):') || '').trim();
    const opis = (prompt('Описание — апартамент 15, гараж 3…:') || '').trim();
    if (!ident && !opis) return;
    _sbDanni(p).obekti.push({ id: _sbNovId(), vid, identifikator: ident, opisanie: opis });
    _sbZapishi(p, `обект „${ident || opis}“`);
}

function sbDobaviSabitie() {
    const p = _zhivObekt(); if (!p) return;
    const s = _sbDanni(p);
    if (!s.obekti.length) return alert('Първо добави обект.');

    const izbor = (spisak, podkana) => {
        const red = spisak.map((x, i) => `${i + 1}. ${x.tekst}`).join(String.fromCharCode(10));
        const o = prompt(podkana + String.fromCharCode(10, 10) + red);
        if (o === null) return undefined;
        const i = parseInt(o, 10) - 1;
        return spisak[i] ? spisak[i].id : null;
    };

    const obekt = izbor(s.obekti.map(o => ({ id: o.id, tekst: _sbImeObekt(s, o.id) })), 'За кой обект?');
    if (!obekt) return;

    const vid = (prompt('Какъв е документът?' + String.fromCharCode(10, 10) + _SB_VID.join(', '),
                        'покупко-продажба') || '').trim();
    if (!vid) return;

    // Придобиващите: по един на ред, с дяла след името.
    // „Иван Петров 1/2“ — така се пише цял акт наведнъж.
    const redove = (prompt(
        'Кой придобива и с какъв дял?' + String.fromCharCode(10, 10)
        + 'По един на ред, дялът след името:' + String.fromCharCode(10)
        + 'Даниела Валентинова Занева 1/2' + String.fromCharCode(10)
        + 'Павел Валериев Христов 1/2') || '').split(String.fromCharCode(10))
        .map(x => x.trim()).filter(Boolean);
    if (!redove.length) return;

    const pridobivashti = [];
    for (const red of redove) {
        const m = red.match(/^(.+?)\s+([0-9]+\s*\/\s*[0-9]+|[0-9]+(?:[.,][0-9]+)?\s*%|1)$/);
        if (!m) return alert(`Не разбирам реда „${red}“.\n\nПиши име и дял: Иван Петров 1/2`);
        const ime = m[1].trim(), dyal = m[2].trim();
        if (!_dr(dyal)) return alert(`Дялът „${dyal}“ не се чете. Пиши дроб (1/2) или процент (8,38%).`);
        let l = s.lica.find(x => _sbZnIme(x.ime) === _sbZnIme(ime));
        if (!l) {
            const yur = /(ООД|ЕООД|АД|ЕАД|СД|КД|ЕТ)\b/.test(ime);
            l = { id: _sbNovId(), ime, vid: yur ? 'юридическо' : 'физическо', egn: '' };
            s.lica.push(l);
        }
        pridobivashti.push({ lice: l.id, dyal });
    }

    // Прехвърлителят е ОПИСАНИЕ, докато не докажем и неговото придобиване.
    const otTekst = (prompt('От кого? (имената, както са в акта; празно = не се сочи)') || '').trim();
    const otLice = otTekst
        ? (s.lica.find(x => _sbZnIme(x.ime) === _sbZnIme(otTekst)) || {}).id || null : null;

    const data = (prompt('Дата (дд.мм.гггг):') || '').trim();
    const dokument = (prompt('Документът — НА № …, том, рег. №, дело, нотариус:') || '').trim();

    s.sabitia.push({ id: _sbNovId(), obekt, vid, data, dokument,
                     ot: otLice, ot_opisanie: otTekst, pridobivashti });
    _sbZapishi(p, `${vid}${data ? ' от ' + data : ''} — ${pridobivashti.length} придобиващи`);
}

// Лице или обект, който участва в събития, не се маха мълчаливо: събитията му
// остават да сочат в празното и излизат като „от (неизвестен)“. Операторът го
// видя на ЖИТЕН. (15.10.2026)
function sbMahni(tablica, id) {
    const p = _zhivObekt(); if (!p) return;
    const s = _sbDanni(p);
    const svarzani = tablica === 'sabitia' ? []
        : s.sabitia.filter(e => tablica === 'lica'
            ? (e.ot === id || (e.pridobivashti || []).some(pr => pr.lice === id))
            : e.obekt === id);
    const ime = tablica === 'lica' ? _sbImeLice(s, id)
              : tablica === 'obekti' ? _sbImeObekt(s, id) : 'реда';

    if (svarzani.length) {
        if (!confirm(`„${ime}“ участва в ${svarzani.length} `
            + `${svarzani.length === 1 ? 'събитие' : 'събития'}.\n\n`
            + `Да ги махна ли заедно с него?\n`
            + `Ако откажеш, нищо не се маха — събитията не бива да сочат в празното.`)) return;
        s.sabitia = s.sabitia.filter(e => !svarzani.includes(e));
    } else if (!confirm(`Да махна ли „${ime}“?`)) {
        return;
    }
    s[tablica] = s[tablica].filter(x => x.id !== id);
    _sbZapishi(p, svarzani.length
        ? `махнат „${ime}“ и ${svarzani.length} негови събития`
        : `махнат „${ime}“`);
}


function renderProektPage() {
    const p = _obektIliIzbor('proekt-content', 'proekt', 'Изберете обекта');
    if (!p) return;
    document.getElementById('proekt-content').innerHTML =
        _lentaObekt(p, 'proekt') + '<div id="zapiski-karta"></div>';
    renderZapiskiKarta();
}

function renderDokumentitePage() {
    const obekt = _obektIliIzbor('dokumentite-content', 'dokumentite', 'Изберете обекта');
    if (!obekt) return;
    const p = _stroezh(obekt);
    document.getElementById('dokumentite-content').innerHTML =
        _lentaObekt(obekt, 'dokumentite') + _lentaStroezhi(obekt) + `
        <div class="card">
            <div class="card-title" style="margin-bottom:8px">🤖 Прочети документите — за Акт 15 / ОД</div>
            <p style="font-size:12px;color:var(--muted);margin-bottom:12px">
                Избери документите на обекта (PDF, снимки, .docx). АИ-то чете всеки —
                номер, дата, издател, обект, участници и на какво се позовава; кодът
                сравнява между тях и показва <strong>къде се разминават</strong>.
                Файловете не се пазят — пазят се само прочетените факти.
                Прочетеното от скан е <strong>за потвърждение</strong>: няма текст, срещу който да се свери.
            </p>
            <input type="file" id="s2-fajlove" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.docx"
                   class="form-input" style="margin-bottom:10px">
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
                <label for="s2-stranici" style="font-size:13px;color:var(--muted)">Страници (по избор):</label>
                <input type="text" id="s2-stranici" class="form-input" style="width:160px" placeholder="напр. 1-4, 20">
                <span style="font-size:12px;color:var(--muted)">само за дълъг PDF (нотариални актове) — чете се
                    само това, по-малко токени; празно = целият файл. Важи за всички избрани PDF.</span>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
                <label for="s2-chetec" style="font-size:13px;color:var(--muted)">Четец:</label>
                <select id="s2-chetec" class="form-input" style="width:auto"
                        onchange="try { localStorage.setItem('s2_chetec', this.value) } catch (e) {}">
                    <option value="auto">Автоматично — Claude, при проблем Mistral</option>
                    <option value="claude">Само Claude</option>
                    <option value="mistral">Само Mistral</option>
                </select>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button type="button" class="btn btn-primary btn-sm" onclick="sloy2Cheti()">📖 Прочети избраните</button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="sloy2Sravni()">🔁 Сравни пак</button>
                <button type="button" class="btn btn-ghost btn-sm" onclick="sloy2Izchisti()">Изчисти прочетеното</button>
            </div>
            <div id="s2-hod" style="margin-top:10px;font-size:12px"></div>
            <div id="s2-rezultat" style="margin-top:12px"></div>
        </div>
        <details class="card" style="margin-top:16px">
            <summary style="cursor:pointer;font-weight:600;font-size:14px">📜 Разрешение за строеж и изходни съгласувания</summary>
            <div id="dokumenti-content" style="margin-top:12px"></div>
        </details>`;
    try { const c = localStorage.getItem('s2_chetec'); if (c) document.getElementById('s2-chetec').value = c; } catch (e) {}
    if (p.sloy2?.od?.dokumenti?.length) sloy2Sravni();
    renderDokumentiPage();          // вече рисува ВЪТРЕ в „Документите“
}



// ═══════════════════════════════════════════════════════════