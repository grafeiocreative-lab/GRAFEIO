# Deployment na GitHub Pages

## Enkratna vzpostavitev

### 1. GitHub repozitorij
1. Pojdi na https://github.com/new
2. Ime repozitorija: `grafeio` (ali `grafeio-web`)
3. Vidljivost: **Public** (GitHub Pages je brezplačen samo za public)
4. Klikni "Create repository"

### 2. Git inicializacija (v terminalu, v mapi grafeio/)
```bash
git init
git add .
git commit -m "first commit — grafeio landing page"
git branch -M main
git remote add origin https://github.com/TVOJ_USERNAME/grafeio.git
git push -u origin main
```

### 3. GitHub Pages vklop
1. Odpri repozitorij na GitHubu
2. Settings → Pages (levi meni)
3. Source: **Deploy from a branch**
4. Branch: `main` / `/ (root)`
5. Save

### 4. Živa stran
Po 1–2 minutah dostopna na:
`https://TVOJ_USERNAME.github.io/grafeio/`

---

## Posodobitve (po prvem deployu)
```bash
git add .
git commit -m "opis spremembe"
git push
```
GitHub Pages se samodejno posodobi v ~1 minuti.

---

## Lastna domena (grafeio.si)
Ko boste imeli domeno:
1. Settings → Pages → Custom domain → vnesite `grafeio.si`
2. Pri registratorju domene dodajte DNS zapise:
   ```
   A     @    185.199.108.153
   A     @    185.199.109.153
   A     @    185.199.110.153
   A     @    185.199.111.153
   CNAME www  TVOJ_USERNAME.github.io
   ```
3. Označite "Enforce HTTPS"
