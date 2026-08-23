# Zaščita digitalne vizitke in kalkulatorja cen

Poti `/mojca`, `/mojca.html` in `/grafeio-cenik/` varuje Netlify Edge Function. Geslo se preveri na strežniku, zato neprijavljeni obiskovalec ne prejme zaščitenega HTML-ja.

## Nastavitev v Netlifyju

V Netlifyju odprite projekt GRAFEIO in izberite **Project configuration → Environment variables**.

Dodajte spremenljivki:

- `GRAFEIO_ACCESS_PASSWORD`: dolgo, enkratno geslo za dostop;
- `GRAFEIO_SESSION_SECRET`: naključna skrivnost z najmanj 32 znaki.

Skrivnost seje lahko ustvarite v terminalu:

```sh
openssl rand -base64 48
```

Obema spremenljivkama omogočite obseg **Functions**. Vrednosti ne zapisujte v `netlify.toml`, datoteko `.env`, dokumentacijo ali Git.

Po nastavitvi sprožite novo objavo strani. Spremembe okoljskih spremenljivk začnejo za Edge Functions veljati šele po novi gradnji in objavi.

## Preverjanje po objavi

Preverite obe poti v zasebnem oknu brskalnika:

1. `/mojca` mora prikazati samo prijavni obrazec.
2. `/grafeio-cenik/` mora prikazati isti prijavni obrazec.
3. Napačno geslo mora vrniti obvestilo o napaki, zaščitena vsebina pa se ne sme prikazati.
4. Pravilno geslo mora odpreti zahtevano stran.
5. Po prijavi mora druga zaščitena stran delovati brez ponovnega vnosa gesla.
6. Naslovu dodajte `?logout=1`. Seja se mora končati in znova se mora prikazati prijava.
7. V izvorni kodi prijavne strani ne sme biti kontaktnih podatkov, cenika ali hasha gesla.

Če okoljski spremenljivki manjkata ali je skrivnost prekratka, funkcija zaradi varnosti vrne stanje `503` in vsebine ne razkrije.

## Lastnosti zaščite

- Seja velja osem ur.
- Piškotek je označen z `HttpOnly`, `Secure` in `SameSite=Strict`.
- Zaščitene strani se ne predpomnijo in imajo oznako `noindex`.
- Število zahtev je omejeno na 30 na minuto za posamezno domeno in naslov IP.
- Obe poti uporabljata isto prijavno sejo.

Gre za zaščito s skupnim geslom. Če bo dostop potrebovalo več oseb ali bo treba posamezni osebi dostop preklicati, jo nadomestite z uporabniškimi računi in večstopenjskim preverjanjem pristnosti.
