# Produktkategorisering – arkitektur og flyt

## Formål
Denne funksjonaliteten kategoriserer mattilbud automatisk med **høy presisjon**, og blir bedre over tid uten å introdusere permanente feil.

Systemet er designet for å håndtere:
- hundrevis av nye tilbud per uke
- mangelfulle og misvisende produkttitler
- fravær av stabile produkt-ID-er
- behov for korrekt første-kategorisering

---

## Grunnprinsipper

1. **Presisjon > dekning**
   - Feil kategorisering er verre enn manglende kategorisering.
   - Usikre tilbud settes til `Ukjent` i stedet for å gjette.

2. **Cache er sannhet**
   - Når en kategori er lagret i cache, gjenbrukes den.
   - Cache bygges gradvis og blir mer presis over tid.

3. **AI brukes kun når nødvendig**
   - Kun for nye produkter som ikke finnes i cache.
   - Batch-kjøring for lav kost og høy ytelse.

4. **Ingen automatisk “reparasjon” av feil**
   - Feil rettes manuelt én gang og lagres permanent.
   - Systemet lærer av korrigeringer.

---

## Kategorier

Systemet bruker et **lite, stabilt sett hovedkategorier**:

- Frukt  
- Grønnsaker  
- Meieri og egg  
- Pålegg  
- Kjøtt  
- Fisk og sjømat  
- Brød og bakst  
- Tørrvarer  
- Snacks og godteri  
- Drikke  
- Ukjent  

Kategoriene er definert sentralt i `categories.ts` og kan endres senere uten å bryte arkitekturen.

---

## Produktidentitet (`productKey`)

Eksterne ID-er (f.eks. `hotspotId`) er ikke stabile over tid.  
Derfor brukes en **egen stabil nøkkel**:

```
productKey = normalize(title) + size/unit + pieces + store
```

Eksempel:
```
fana kjøtt løkrull|100g|x1|bunnpris
```

`productKey` brukes til:
- cache-oppslag
- grouping før AI-kall
- manuell overstyring

---

## Pipeline

### Ved innlasting av nye tilbud

1. Bygg `productKey`
2. Cache lookup  
   - Treffer → bruk kategori
3. High-precision rules (valgfritt)  
   - Kun 5–10 helt sikre regler
4. AI-kategorisering (GPT-4o-mini, batch)
5. Confidence-gating  
   - `confidence >= 0.9` → lagres i cache  
   - ellers → `Ukjent`
6. Manuell overstyring (UI)  
   - Oppdaterer cache permanent

```
Nye tilbud
  → cache
  → sikre regler
  → AI (batch)
  → cache (kun høy confidence)
  → Ukjent / manuell
```

---

## Cache-strategi

Cache lagrer:

```ts
productKey -> {
  category,
  confidence,
  source: "ai" | "manual",
  updatedAt
}
```

Regler:
- Cache tømmes **kun én gang** (nå), pga. feil regeldata
- Cache skal **aldri masse-tømmes** igjen
- `manual` overstyrer alltid `ai`

---

## AI-strategi

- Modell: **OpenAI GPT-4o-mini**
- Brukes kun når cache ikke treffer
- Batch-størrelse: ~50 produkter
- Returnerer `{ category, confidence }`
- AI er klassifiserer, ikke sannhet

---

## Forventet utvikling over tid

- **Uke 1:** Mange AI-kall, cache bygges
- **Uke 2–3:** Færre AI-kall, mange cache-treff
- **Uke N:** ~95 % cache-hit, minimal AI-bruk

---

## Bevisste avgrensninger

- Ingen underkategorier (foreløpig)
- Ingen automatisk re-kategorisering av cache
- Ingen forsøk på perfekt regex-matching
- Ingen avhengighet til eksterne produkt-ID-er

---

## Status
Dette dokumentet beskriver **endelig og bevisst valgt arkitektur** for produktkategorisering.  
Endringer bør være eksplisitte og dokumenteres her.
