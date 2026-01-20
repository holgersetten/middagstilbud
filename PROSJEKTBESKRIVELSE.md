# 📋 Mattilbud - Komplett prosjektbeskrivelse

## 🎯 Prosjektets formål

**Mattilbud** er en norsk web-applikasjon som hjelper brukere å finne de beste tilbudene på matvarer fra 12 forskjellige norske dagligvarekjeder. Systemet henter automatisk ukentlige tilbudsaviser, kategoriserer produkter intelligent med AI, og presenterer dem på en brukervennlig måte slik at man enkelt kan planlegge middager basert på hva som er på tilbud.

---

## 🏗️ Arkitektur

Prosjektet er bygget som en **monorepo** med tydelig lagdeling:

```
mattilbud/
├── backend/          # Backend Node.js/TypeScript
│   ├── core/         # Business logic (kategorisering, regler)
│   ├── persistence/  # Datahenting og lagring
│   └── rest/         # Express REST API
└── frontend/         # React SPA med Vite
```

### Teknisk stack

**Backend:**
- **Runtime**: Node.js med TypeScript
- **Web framework**: Express.js
- **Database**: SQLite (better-sqlite3) for caching og prishistorikk
- **AI**: OpenAI GPT-4o-mini for automatisk kategorisering
- **Scraping**: Axios + Tjek API (squid-api.tjek.com)
- **Scheduler**: node-schedule for automatiske ukentlige oppdateringer

**Frontend:**
- **Framework**: React 19.1.1 med TypeScript
- **Build tool**: Vite 7.1.7
- **Routing**: React Router v7.9.5
- **Styling**: Tailwind CSS 4.1 + Radix UI komponenter
- **Icons**: Lucide React

---

## 🏪 Støttede butikker (12 aktive)

1. **Bunnpris** (dealerId: 5b11sm)
2. **Rema 1000** (dealerId: faa0Ym)
3. **Meny** (dealerId: 4333pm)
4. **Spar** (dealerId: c062vm)
5. **Kiwi** (dealerId: 257bxm)
6. **Obs** (dealerId: 51dawm)
7. **Coop Extra** (dealerId: 80742m)
8. **Coop Mega** (dealerId: de79dm)
9. **Coop Prix** (dealerId: f5d5lm)
10. **Coop Marked** (dealerId: 68baam)
11. **Joker** (dealerId: b3e8Fm)
12. **Matkroken** (dealerId: 2686gD)

**Totalt ~760 tilbud** lastet inn ukentlig.

---

## 🔄 Dataflyt og funksjonalitet

### 1. **Datahenting (Tjek API)**

**Viktig bug som ble fikset:** Tjek API respekterer IKKE `offset`/`limit` pagination parametere. API-et returnerer alltid alle hotspots uansett.

**Løsning:**
- Fjernet all pagination-logikk
- Henter kun **latest catalog** (ikke alle 7 aktive kataloger)
- Ett API-kall per butikk → ~111 tilbud per katalog

```typescript
// backend/persistence/src/services/tjekApiService.ts
async getCatalogHotspots(catalogId: string): Promise<Hotspot[]> {
    const url = `${this.baseURL}/catalogs/${catalogId}/hotspots`;
    const response = await axios.get<Hotspot[]>(url, { headers: this.headers });
    return response.data || []; // Ingen pagination!
}
```

### 2. **Produktidentitet (productKey)**

Eksterne ID-er (`hotspotId`) er ustabile over tid. Derfor brukes en **normalisert produktnøkkel**:

```typescript
productKey = normalizeTitle(title) + size + pieces + store
// Eksempel: "fana kjøtt løkrull|100g|x1|bunnpris"
```

Dette sikrer:
- ✅ Cache-oppslag fungerer på tvers av uker
- ✅ Prishistorikk kan spores over tid
- ✅ Manuelle overstyringer blir permanente

### 3. **AI-kategorisering (Smarteste delen!)**

Systemet bruker **2-iterativt kategoriseringssystem** med strenge confidence thresholds:

**Confidence-krav:**
- `mainCategory` ≥ 90%
- `subCategory` ≥ 88%
- `ingredientKey` ≥ 90%

**Prosess:**
1. **Cache lookup** - Sjekk om produktet er sett før
2. **AI-kategorisering** (GPT-4o-mini) - Kun nye produkter
3. **Confidence gating** - Kun høy-kvalitet lagres som "trusted"
4. **Iterasjon 2** - Retry pending items med fresh context
5. **Manual review** - Lavconfidence items → AdminReview UI

**Hvorfor 2 iterasjoner (ikke 3)?**
> "Er jo et kvalitetstegn hvis det alltid er hvertfall noen som blir pending"

Med 3 iterasjoner ble AI-en overselvsikker og godkjente ALT. 2 iterasjoner balanserer automatisering med kvalitetskontroll.

```typescript
// backend/core/src/services/categoryService.ts
calculateCacheStatus(confidence, category, subCategory, ingredientKey) {
    if (mainCategory === 'Ukategorisert' || subCategory === 'Ukategorisert') return 'pending';
    if (confidence.main < 0.90) return 'pending';
    if (confidence.sub < 0.88) return 'pending';
    if (confidence.ingredientKey < 0.90) return 'pending';
    return 'trusted'; // Høy kvalitet!
}
```

### 4. **Kategorihierarki**

Systemet bruker 13 hovedkategorier med totalt **93 underkategorier** + ingredientsearch:

**Hovedkategorier:**
- Frukt & grønt (9 sub)
- Fisk & skalldyr (7 sub)
- Brød (13 sub)
- Middag (8 sub)
- Kjøtt & egg (10 sub)
- Meieri (12 sub)
- Pålegg (4 sub)
- Bakevarer (6 sub)
- Smaker og krydder (6 sub)
- Drikke (9 sub)
- Snacks (4 sub)
- Søtsaker & dessert (4 sub)
- Annet (1 sub)

**Ingredientsøk:** 150+ ingredienser (f.eks. "hvitløk", "basilikum", "laks")

---

## 📡 Backend API Endpoints

**Hoved-endpoints:**

1. `GET /api/offers` - Alle tilbud (filtrering på kategori, butikk, søk)
2. `GET /api/offers/review` - Kun pending kategoriseringer
3. `GET /api/categories` - Hele kategori-hierarkiet
4. `POST /api/offers/categorize` - Kategoriser et produkt manuelt
5. `POST /api/offers/weekly-update` - **Hovedprosessen** (hent + AI)
6. `GET /api/price-history/:productKey` - Prishistorikk for produkt
7. `POST /api/offers/test-fetch` - Test henting fra én butikk

**Category management:**
- `POST /api/categories/main/add|remove|rename`
- `POST /api/categories/subcategory/add|remove|rename`

---

## 🎨 Frontend UI

### **OffersPage (Hovedsiden)**

**Layout:**
```
🍞 Breadcrumb navigation
🔍 Søkefelt (max-w-xl) | [Pris ↕] [Butikker 🏪]
🏪 12 butikklogoer (justify-between, samme bredde som over)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 760 tilbud badge
🎴 Tilbudskort (grid)
```

**Features:**
- ✅ **Kategorisøk**: 13 hovedkategorier → 93 underkategorier
- ✅ **Butikkfilter**: Klikk logo for å filtrere (blue ring = aktiv)
- ✅ **Fritekst-søk**: Typewriter-effekt placeholder
- ✅ **Sortering**: Pris stigende/synkende
- ✅ **Prisvisning**: `før kr → nå kr` med discount %

**Viktig designvalg:**
- Butikklogoer `h-12 w-12` spredt med `justify-between`
- Samme totale bredde som søkefelt + filterknapper
- `flex-shrink-0` sikrer konstant størrelse

### **AdminReview (Admin-UI)**

**Features:**
- ✅ **Pending review**: Alle produkter med lav confidence
- ✅ **Søk og filter**: Fritekst + butikkfilter (nå med logoer!)
- ✅ **Show all offers**: Toggle for å se hele databasen
- ✅ **Manual override**: Dropdown for main/sub/ingredient
- ✅ **Automatisk oppdatering**: Fjerner fra pending ved kategorisering

---

## 💾 Datalagring

### **SQLite Database**

**Tabeller:**

1. **category_cache** (hovedtabell)
```sql
CREATE TABLE category_cache (
    productKey TEXT PRIMARY KEY,
    mainCategory TEXT,
    subCategory TEXT,
    ingredientKey TEXT,
    confidence REAL,
    cacheStatus TEXT,  -- 'trusted' | 'pending'
    lastUpdated TEXT
);
```

2. **price_history** (tidsserie)
```sql
CREATE TABLE price_history (
    id INTEGER PRIMARY KEY,
    productKey TEXT,
    price REAL,
    store TEXT,
    timestamp TEXT
);
```

**Backup:**
- `category_cache.json` (primær cache)
- `category_cache_backup.json` (sikkerhetskopi)
- `manual_overrides.json` (admin-overstyringer)

### **JSON offer files**

```
backend/persistence/src/resources/offers/
├── bunnpris_offers.json (71 tilbud)
├── coop_extra_offers.json (111 tilbud) ← Fixed!
├── rema_1000_offers.json (71 tilbud)
└── ... (12 filer totalt)
```

---

## 🚀 Oppstart og drift

### **Lokal utvikling**

```bash
# Start alt (frontend + backend)
.\run-app.bat

# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
```

### **Ukentlig oppdatering**

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/offers/weekly-update" -Method POST
```

**Prosess (2-iterativt):**
```
STEG 1: Hent tilbud (12 butikker)
   → 760 tilbud hentet
   → Lagret til JSON-filer

STEG 2: Hent bilder
   → Metadata lagret (URL, ikke download)

STEG 3: AI kategorisering (2 iterasjoner)
   🔄 Iterasjon 1/2...
      ➜ 58 nye produkter → 55 trusted, 3 pending
   🔄 Iterasjon 2/2...
      ➜ 3 pending → 2 trusted, 1 pending
   
✅ Ferdig! 1 produkt trenger manuell review
```

---

## 🎯 Viktige designprinsipper

### 1. **Presisjon > Dekning**
Feil kategorisering er verre enn "Ukategorisert". AI må være sikker!

### 2. **Cache er sannhet**
Når en kategori er lagret, gjenbrukes den. Cache bygges gradvis og blir bedre over tid.

### 3. **Stable product identity**
`productKey` er mer stabil enn eksterne ID-er. Dette gjør prishistorikk mulig.

### 4. **Quality signals matter**
At noen produkter forblir "pending" er BRA - det viser at AI ikke bare godkjenner alt.

### 5. **Manual review is valuable**
Admin-UI er ikke for "failures" - det er kvalitetskontroll.

---

## 🐛 Kjente bugs og løsninger

### ✅ FIKSET: Pagination-bug
**Problem:** Tjek API ignorerer offset/limit → infinite loop  
**Løsning:** Fjernet pagination, ett kall per katalog

### ✅ FIKSET: Duplicate catalogs
**Problem:** Fetched 7 aktive kataloger → 6x duplicates  
**Løsning:** Hent kun latest catalog

### ✅ FIKSET: Regex typo
**Problem:** `/\/s+/g` i stedet for `/\s+/g` → filer med spaces  
**Løsning:** Rettet regex, slettet duplikater

### ✅ FIKSET: React key warnings
**Problem:** Duplikat `productKey` → key conflicts  
**Løsning:** `key={offerId || hotspotId || productKey}-${idx}`

### ✅ FIKSET: AI over-confidence
**Problem:** 3 iterasjoner → alle blir trusted  
**Løsning:** Redusert til 2 iterasjoner

---

## 📈 Statistikk

- **760 tilbud** totalt (opp fra 702 etter pagination-fix)
- **Coop Extra**: 56 → **111 tilbud** (100% økning!)
- **12 aktive butikker** i Norge
- **~93% cache hit rate** (de fleste produkter er sett før)
- **2-3% pending rate** (sundt nivå av kvalitetskontroll)

---

## 🔮 Fremtidige forbedringer

1. **Automatisk scheduling** - Cron job for ukentlig oppdatering
2. **Push notifications** - Varsle når favoritt-ingredienser er på tilbud
3. **Oppskriftsforslag** - Generer middagsforslag basert på tilbud
4. **Prissammenligning** - "Dette produktet er billigst hos X"
5. **Brukerpreferanser** - Lagre favorittbutikker/kategorier
6. **Mobile app** - React Native versjon
7. **AI-forbedringer** - Fine-tune model på norske produktnavn

---

## 📝 Utviklingsstatus

**Ferdigstilt:**
- ✅ Full backend med 18 API endpoints
- ✅ React frontend med routing og moderne UI
- ✅ AI-kategorisering med confidence thresholds
- ✅ Admin-UI for kvalitetskontroll
- ✅ Prishistorikk og trending
- ✅ 12 butikker integrert

**Pågående:**
- 🔄 Optimalisere UI layout (butikklogoer)
- 🔄 Teste kvalitet på 2-iterativ AI

**Planlagt:**
- 📅 Automatisk scheduling
- 📅 User accounts og favoritter

---

Dette er et solid, produksjonsklart system for å hjelpe norske forbrukere spare penger på dagligvarer! 🎯🍎💰
