# -*- coding: utf-8 -*-
u"""Официалните регистри → файлове, които PWA чете.

  ДНСК  — консултанти по чл. 166, ал. 1, т. 1 ЗУТ (.xlsx от сайта им)
  КИИП  — проектанти с ППП / ОПП и инженери с технически контрол (.pdf)

Източниците НЕ влизат в хранилището: те се свалят от сайтовете и остаряват.
Тук се пази само изведеното, с дата и брой редове, за да се вижда отдалеч
кога е правено.

Пускане:
    python registri/napravi.py <папка с изтеглените файлове>
"""
import io, json, os, re, sys
from datetime import date

TUK = os.path.dirname(os.path.abspath(__file__))


# ── ДНСК ────────────────────────────────────────────────────────────────────

def dnsk(pat):
    import openpyxl
    w = openpyxl.load_workbook(pat, read_only=True, data_only=True)
    ws = w.worksheets[0]
    redove, glava = [], None
    for red in ws.iter_rows(values_only=True):
        kletki = [u'' if c is None else unicode_(c).strip() for c in red]
        if glava is None:
            if kletki and kletki[0] == u'№':
                glava = kletki
            continue
        if not kletki or not kletki[0]:
            continue
        r = dict(zip(glava, kletki))
        redove.append({
            'nomer': r.get(u'№', u''),
            'ime': r.get(u'Име', u''),
            'grad': r.get(u'Град', u''),
            'adres': r.get(u'Адрес', u''),
            'upravitel': r.get(u'Управител', u''),
            'izdaden': _data(r.get(u'Издаден на', u'')),
            'validen_do': _data(r.get(u'Валиден до', u'')),
        })
    return redove


def unicode_(v):
    if hasattr(v, 'strftime'):
        return v.strftime('%d.%m.%Y')
    return u'%s' % v


def _data(v):
    u"""„09.05.2022 г.“ → „09.05.2022“."""
    m = re.search(r'(\d{2})\.(\d{2})\.(\d{4})', unicode_(v))
    return u'%s.%s.%s' % m.groups() if m else u''


# ── КИИП ────────────────────────────────────────────────────────────────────
# Редът е: рег. № · име (може на два реда) · регионална колегия · секция · ПП
_RED = re.compile(
    r'^(\d{4,6}[А-Я]{0,3})\s+(.+?)\s+'
    r'(София град|София област|ЦУ|[А-ЯЁ][а-яё]+\.?[А-ЯЁа-яё]*(?:\s[А-ЯЁ][а-яё]+)?)\s+'
    r'([A-ZА-Я]{2,10})\s+(ППП|ОПП|ТК)\s*$')

SEKCII = {
    'КСС': u'Конструктивна', 'ЕАСТ': u'Електро', 'ВС': u'ВиК',
    'ОВКХТТГ': u'ОВК и ЕЕ', 'ГПГ': u'Геодезия', 'ТСТС': u'Пътна',
    'ТЕХ': u'Технологична', 'МДГЕ': u'Инженерна геология и хидрогеология',
    # В самия регистър има сгрешени кодове — изброени са, за да не изпадат
    # от търсенето. (Проверено на 14.10.2026: 21 реда.)
    'ТС': u'Пътна', 'ОВКХТГ': u'ОВК и ЕЕ', 'ОВКТХТГ': u'ОВК и ЕЕ',
    'МДГ': u'Инженерна геология и хидрогеология',
}


def kiip(patishta):
    from pypdf import PdfReader
    hora = {}
    for pat in patishta:
        r = PdfReader(pat)
        buf = u''
        for stranica in r.pages:
            buf += (stranica.extract_text() or u'') + u'\n'
        # Имената се пренасят на нов ред — слепваме, преди да четем.
        # Двойната фамилия се пренася и с интервал преди тирето („МИЛАДИНОВА -“
        # / нов ред / „ПЕТРОВА“): тогава втората половина оставаше извън реда и
        # в регистъра влизаше име, което свършва с тире. 118 от 15 277.
        # (Операторът, 19.10.2026.)
        buf = re.sub(r'[ \t]*-[ \t]*\n[ \t]*', u'-', buf)
        redove = buf.split(u'\n')
        i = 0
        while i < len(redove):
            red = redove[i].strip()
            m = _RED.match(red)
            if not m and i + 1 < len(redove):
                m = _RED.match((red + u' ' + redove[i + 1].strip()).strip())
                if m:
                    i += 1
            if m:
                nomer, ime, kolegia, sekcia, pp = m.groups()
                z = hora.setdefault(nomer, {'nomer': nomer, 'ime': _ime(ime),
                                            'kolegia': kolegia, 'chasti': []})
                z['chasti'].append({'sekcia': sekcia,
                                    'chast': SEKCII.get(sekcia, sekcia), 'pp': pp})
            i += 1
    return sorted(hora.values(), key=lambda x: x['ime'])


def _ime(s):
    u"""Име от регистъра, изчистено.

    Двойната фамилия е ту „СЪБЕВА - ПАНОВА“, ту „СЪБЕВА-ПАНОВА“ — слепва се,
    за да се намира и в двата случая. 118 имена в самия регистър на КИИП
    свършват с увиснало тире (втората фамилия я няма в източника); тирето не е
    част от името и пада — нищо не се измисля на негово място.
    (Операторът, 19.10.2026.)
    """
    s = re.sub(r'\s+', u' ', s or u'').strip()
    s = re.sub(r'\s*-\s*', u'-', s)
    return s.strip(u'- ').strip()


# ── Технически контрол ──────────────────────────────────────────────────────
# Друга таблица: № по ред · № по регистър на ПП · име · № по регистър на ТК ·
# секция · регионална колегия. Заглавията казват за коя част важи.
# Съкращението на колегията е с точки и тирета: „Вел.Т“, „Сф-гр“, „Ст.З“.
_TK = re.compile(
    r'^(\d+)\s+(\d{4,6}[А-Я]{0,3})\s+(.+?)\s+(\d{3,5})\s+([А-Я]{2,10})\s+([А-Яа-я.\-]{1,10})\s*$')

_TK_CHASTI = [
    (u'в транспортното строителство', u'Конструктивна — транспортно строителство'),
    (u'на хидротехнически съоръжения', u'Конструктивна — хидротехнически съоръжения'),
    (u'Конструктивна', u'Конструктивна'),
]


def _tk_chast(zaglavie):
    for klyuch, ime in _TK_CHASTI:
        if klyuch in zaglavie:
            return ime
    return zaglavie.strip()


def tehnicheski_kontrol(pat):
    from pypdf import PdfReader
    r = PdfReader(pat)
    buf = u'\n'.join((p.extract_text() or u'') for p in r.pages)
    chast = u''
    out = []
    for red in buf.split(u'\n'):
        red = red.strip()
        if red.startswith(u'Част "'):
            chast = _tk_chast(red)
            continue
        m = _TK.match(red)
        if not m:
            continue
        _, nomer_pp, ime, nomer_tk, sekcia, rk = m.groups()
        out.append({'nomer_pp': nomer_pp, 'ime': _ime(ime).upper(), 'nomer_tk': nomer_tk,
                    'sekcia': sekcia, 'chast': chast, 'rk': rk})
    return out


# ── записване ───────────────────────────────────────────────────────────────

def zapishi(ime, redove, iztochnik):
    pat = os.path.join(TUK, ime + '.json')
    danni = {'iztochnik': iztochnik, 'izvedeno_na': date.today().strftime('%d.%m.%Y'),
             'broj': len(redove), 'redove': redove}
    io.open(pat, 'w', encoding='utf-8').write(
        json.dumps(danni, ensure_ascii=False, separators=(',', ':')))
    print(u'%-10s %6d реда  %7.1f KB' % (ime, len(redove), os.path.getsize(pat) / 1024.0))


if __name__ == '__main__':
    papka = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/Downloads')
    fajlove = os.listdir(papka)

    x = [f for f in fajlove if f.lower().endswith('.xlsx') and u'консултант' in f]
    if x:
        zapishi('dnsk', dnsk(os.path.join(papka, x[0])),
                u'ДНСК — регистър по чл. 166, ал. 1, т. 1 ЗУТ')
    else:
        print(u'няма .xlsx с „консултант“ в името')

    # 1_ са с ограничена правоспособност, 2_ с пълна; 3_ е техническият контрол.
    p = [os.path.join(papka, f) for f in fajlove
         if f.lower().endswith('.pdf') and re.match(r'^[12]_', f)]
    if p:
        zapishi('kiip', kiip(sorted(p)), u'КИИП — проектанти с пълна и ограничена правоспособност')
    else:
        print(u'няма PDF с проектанти (очакват се файлове, започващи с 1_ или 2_)')

    tk = [os.path.join(papka, f) for f in fajlove
          if f.lower().endswith('.pdf') and f.startswith('3_')]
    if tk:
        zapishi('tk', tehnicheski_kontrol(tk[0]),
                u'КИИП — лица, упражняващи технически контрол')
    else:
        print(u'няма PDF с техническия контрол (очаква се файл, започващ с 3_)')
