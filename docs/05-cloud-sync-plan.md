# Plan wdrożenia serwera z anonimizacją (Hackathon MVP)

## 1. Koncepcja Biznesowa (Dla Jury)
Aby pogodzić użyteczność (współdzielenie konta Kasi i Mamy) z prywatnością (brak wrażliwych danych w bazie), zastosujemy **Klucz Rodzinny (E2EE/Pseudonimizacja)**:
- Użytkownicy nie zakładają klasycznego konta e-mail/hasło.
- Aplikacja generuje lokalnie unikalny **Klucz Rodziny** (np. `KASIA-MAMA-1234`).
- Serwer w bazie danych trzyma **tylko anonimowe identyfikatory** i zaszyfrowane paczki z wynikami przypisane do tego klucza. Serwer nie wie, że to "Kasia Kowalska", ani nie widzi jej PESEL-u gołym okiem.
- Telefony znające ten sam klucz mogą pobrać i rozszyfrować te dane u siebie.

## 2. Architektura Techniczna (Stack)
Wykorzystamy nasz istniejący serwer (`apps/api` zbudowany na **Hono**), by nie mnożyć bytów, i zrobimy to super-szybko:
1. **Baza danych**: Dodamy **Drizzle ORM** i lokalną bazę **SQLite** do Hono (bardzo szybki setup, zero konfiguracji zewnętrznych serwerów, a na koniec można to w 5 minut przenieść do chmury Cloudflare/Turso).
2. **Tabela `profiles`**: Przechowuje zanonimizowane dane (id, family_id, płeć, rok urodzenia – potrzebne do reguł badań, zaszyfrowane "imie").
3. **Tabela `records`**: Przechowuje historię badań.
4. **Zustand Sync**: W aplikacji mobilnej dopiszemy mały moduł, który w tle zrzuca dane z `AsyncStorage` do naszego API na serwerze i pobiera je w razie potrzeby.

## 3. Co z numerem PESEL do AI dzwoniącego?
PESEL (wymagany do umówienia wizyty) będzie przechowywany **tylko na telefonie**.
Kiedy użytkownik kliknie "Zadzwoń do przychodni", telefon weźmie PESEL ze swojej lokalnej, bezpiecznej pamięci i dołączy go do jednorazowego zapytania do serwera. Serwer Hono odbierze PESEL, użyje go do wykonania połączenia telefonicznego (przez zewnętrzne AI) i natychmiast **wyczyści go z pamięci serwera** (nie trafi do bazy danych).

## 4. Kolejność prac (Vibe Coding)
1. Aktualizacja regulaminu `AGENTS.md`, aby usankcjonować nową architekturę hybrydową.
2. Instalacja Drizzle ORM i Better-SQLite3 w `apps/api`.
3. Utworzenie schematu bazy danych.
4. Napisanie endpointów synchronizacji (Upload/Download state).
5. Podłączenie logiki API do sklepów Zustand w aplikacji mobilnej.
