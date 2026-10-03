# 05 — Algorytm „kiedy zacząć szukać terminu”

To jest nasz główny wyróżnik — musi być poprawny, przetestowany i łatwy do wytłumaczenia jury w jednym zdaniu:

> *„Bierzemy datę, do której badanie powinno być zrobione, i odejmujemy realny czas czekania na NFZ w Twojej okolicy plus zapas na skierowanie.”*

## 1. Termin badania (`dueDate`)

```
if record.status == 'booked'        → urgency = 'booked', dueDate = bookedFor
lastDone = exact date                 → dueDate = lastDone + intervalMonths
lastDone = 'over_interval'            → dueDate = today, overdue = true
lastDone = 'never'|'unknown'|brak     → dueDate = today
```

Ankieta „Kiedy ostatnio?” pyta w przedziałach **liczonych od interwału danego badania** (I = interwał dla tej osoby, z modifierami):

| Odpowiedź | Etykieta (np. kolonoskopia, I = 120) | Zapis w rekordzie (`assumedLastDone`) |
|---|---|---|
| `within_half_interval` | „W ciągu ostatnich 5 lat” (0–½ I) | data = dzień odpowiedzi − ¼ I (środek przedziału) |
| `within_interval` | „5–10 lat temu” (½–1 I) | data = dzień odpowiedzi − ¾ I |
| `over_interval` | „Ponad 10 lat temu” | `'over_interval'` → zaległe |
| `never` / `unknown` | „Nigdy” / „Nie pamiętam” | bez zmian |

Przedział zamieniamy na datę **w dniu odpowiedzi**, bo czytany względem coraz późniejszego `today` przesuwałby termin w nieskończoność. Stare odpowiedzi (`within_1y`, `1_3y`, `over_3y`) migruje store rekordów (v1 → v2) według daty `updatedAt`.

Interwał: `intervalMonths` z reguły, nadpisany przez najbardziej restrykcyjny pasujący `modifier`.

## 2. Czas wyprzedzenia (`leadTimeDays`)

```
base =
  booking == 'queue'   → waitTime.p75Days   (fallback: DEFAULT_QUEUE_DAYS = 60)
  booking == 'program' → 21                 (umówienie się na program/mammobus)
  booking == 'walk_in' → 3

referralBuffer = referral ? 14 : 0          (wizyta u POZ po skierowanie)

leadTimeDays = clamp(base + referralBuffer, min = 3, max = 270)
```

Dlaczego **p75, a nie średnia:** średnia zaniża dla użytkownika, który trafi na gorszą placówkę; p75 = „w 3 na 4 placówkach zdążysz”.

## 3. Agregacja czasu oczekiwania (API, WS2)

```
1. Pobierz kolejki dla wszystkich nfzBenefits badania w województwie (case=1), cache 24h.
2. Odfiltruj rekordy z average-period ≤ 0 / null lub bez współrzędnych.
3. waitDays = statistics.provider-data.average-period  (średnie oczekiwanie wg placówki, dni)
   — `dates` z NFZ jest null w 100% rekordów (zweryfikowane WS2-1, 2026-10-03).
4. Promień: zacznij od radiusKm (domyślnie 15); jeśli < 3 placówki → 30 → 60 → całe województwo.
5. Zwróć p50, p75, min, facilitiesCount, faktyczny radiusKm, asOf.

Percentyle: interpolacja liniowa (= Excel `PERCENTILE.INC`, numpy `linear`), żeby liczby w API i na slajdach (`pitch/scripts/wait-stats.mjs`) były identyczne. Wynik zaokrąglony do pełnych dni.
```
Odległość: haversine. Brak współrzędnych użytkownika → całe województwo, **wliczając rekordy placówek bez lat/lng** (odległość nie jest wtedy potrzebna). Rekordy bez lat/lng wypadają tylko z agregacji po promieniu.

Placówki dziecięce odrzucamy po nazwie miejsca (`DZIECI`, `DZIECIĘC*`, `PEDIATR*`), nie po fladze `benefits-for-children` — flaga oznacza, że placówka przyjmuje dzieci *dodatkowo* (zweryfikowane WS2, 2026-10-03).

## 4. Data powiadomienia i pilność

```
notifyDate = dueDate − leadTimeDays

urgency =
  status == 'done' && dueDate > today + 365 → 'done' (pokazuj w sekcji Zrobione)
  notifyDate ≤ today                        → 'act_now'
  notifyDate ≤ endOfYear(today)             → 'this_year'
  else                                      → 'later'
```

Powiadomienia (WS3): planowane lokalnie na `notifyDate 09:00` (i dodatkowo `bookedFor − 1 dzień` dla umówionych). Przeliczane przy każdym otwarciu aplikacji i zmianie danych — stare anulowane, nowe zaplanowane (idempotentnie, ID = `${profileId}:${examId}:${kind}`).

## 5. Wymagane przypadki testowe (WS1, Vitest)

- [ ] Brak historii → dueDate = today, urgency = act_now
- [ ] Badanie zrobione wczoraj (`lastDone` = data, `status: 'none'`), interwał 24 mies. → later, notifyDate ≈ today + 24 mies. − leadTime. (Przy `status: 'done'` obowiązuje §4 → urgency `done`.)
- [ ] queue z p75 = 70 dni + referral → leadTime = 84
- [ ] queue bez danych NFZ → default 60, leadTimeSource = 'default'
- [ ] modifier z historią rodzinną obniża wiek startu (kolonoskopia od 40)
- [ ] osoba poza przedziałem wieku → badanie nie występuje w planie
- [ ] płeć wyklucza badanie (mammografia u M)
- [ ] status booked → urgency booked, notifyDate = bookedFor − 1
- [ ] clamp: p75 = 400 dni → leadTime = 270
- [ ] sortowanie planu: act_now → booked → this_year → later → done; w obrębie act_now malejąco po leadTimeDays (najdłuższa kolejka pierwsza), potem notifyDate
- [ ] stała `today` — test nie zależy od daty systemowej
