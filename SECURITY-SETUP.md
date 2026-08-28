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

---

## Obrazec "Prva pomoč" → Brevo

Pot `/api/prva-pomoc` (Netlify Edge Function `netlify/edge-functions/prva-pomoc-submit.ts`) sprejme oddajo obrazca s strani `/prva-pomoc/` in `/en/prva-pomoc/`, pošlje e-pošto na vaš naslov in doda osebo na ustrezen Brevo seznam.

### Okoljske spremenljivke (Brevo)

V **Project configuration → Environment variables** dodajte:

- `BREVO_API_KEY`: API ključ iz Brevo nadzorne plošče (Settings → SMTP & API → API Keys). Obseg **Functions**.
- `BREVO_LIST_ID_SL`: številka Brevo seznama za slovenske oddaje — trenutno **4** ("Grafeio novice SL").
- `BREVO_LIST_ID_EN`: številka Brevo seznama za angleške oddaje — trenutno **3** ("Grafeio novice EN").
- `GRAFEIO_NOTIFY_EMAIL` *(neobvezno)*: kam pride obvestilo o novi oddaji. Če ni nastavljena, gre na `grafeio.creative@gmail.com`.
- `BREVO_SENDER_EMAIL` *(neobvezno)*: pošiljateljev naslov za obvestilo. Če ni nastavljen, uporabi `grafeio.creative@gmail.com` — **ta naslov mora biti potrjen pošiljatelj v Brevu** (Settings → Senders & IP), sicer pošiljanje spodleti.

Vrednosti ne zapisujte v `netlify.toml`, datoteko `.env`, dokumentacijo ali Git — enako kot pri gornji zaščiti.

### Kako deluje pošiljanje

1. Obiskovalec izpolni obrazec, JavaScript pošlje podatke na `/api/prva-pomoc`.
2. Funkcija pošlje e-pošto na `GRAFEIO_NOTIFY_EMAIL` prek Brevo API-ja, z odgovorom nastavljenim na e-naslov obiskovalca — odgovorite lahko kar z enim klikom na "Odgovori".
3. Če je nastavljen ustrezen `BREVO_LIST_ID_*`, funkcija poskusi dodati e-naslov na ta seznam. Ta korak je "best effort": če spodleti, oddaja vseeno šteje za uspešno, ker je e-pošta (korak 2) že prispela.
4. Če `BREVO_API_KEY` manjka, funkcija vrne `503` in obrazec prikaže napako, noben podatek se ne izgubi tiho.

### Preverjanje pošiljanja po objavi

1. Oddajte testno sporočilo prek obrazca na obeh jezikih.
2. Preverite, da je e-pošta prispela na `GRAFEIO_NOTIFY_EMAIL`, z vsebino sporočila in "Odgovori na" nastavljenim na testni naslov.
3. V Brevu preverite, da se je testni e-naslov pojavil na ustreznem seznamu.
4. V Google Analytics (ali GA4 DebugView) preverite dogodek `tezava_oddana`. Sproži se šele, ko obiskovalec sprejme kategorijo "Analitika" v pasici za piškotke, enako kot povsod na strani.
