# Meal Templates Arkitektur

## 📋 Oversikt

Systemet bruker en tre-lags arkitektur for å gjøre det enkelt å endre og vedlikeholde middagsoppskrifter:

```
Archetypes → Templates → Resolved Templates
  (regler)    (minimal)    (komplett)
```

## 🎯 De tre komponentene

### 1. **Archetypes** (`archetypes.ts`)
Definer grunnleggende mattypemønster én gang.

```typescript
pasta: {
    allowedCarbs: ['pasta', 'spaghetti', ...],
    forbiddenIngredients: ['potet', 'ris', ...],
    carbFallback: undefined,  // Ingen spesifikk fallback
}
```

**Når du endrer en archetype → påvirker alle templates som bruker den**

### 2. **Templates** (`mealTemplates.ts`)
Små, fokuserte beskrivelser av retter.

```typescript
{
    id: 'kjottdeig_pasta',
    name: 'Kjøttdeig med pasta',
    archetype: 'pasta',  // ← Arver regler herfra
    protein: ['kjøttdeig', 'karbonadedeig'],
    vegetables: ['tomat', 'løk', 'paprika'],
    // carbs: ikke spesifisert → bruker archetype's allowedCarbs
    // forbids: kan legge til ekstra forbud
}
```

**Når du endrer en template → påvirker bare den retten**

### 3. **Resolver** (`resolveMealTemplate()`)
Slår sammen archetype + template til et komplett objekt.

```typescript
const resolved = resolveMealTemplate(template);
// resolved.carbs = ['pasta', 'spaghetti', ...] (fra archetype)
// resolved.forbids = [...archetype.forbids, ...template.forbids]
```

**Generatoren bruker kun resolved templates.**

## 🔧 Hvordan bruke

### Legge til ny rett

```typescript
// mealTemplates.ts
{
    id: 'svin_wok',
    name: 'Svin i wok',
    archetype: 'wok',  // ← Arver wok-regler
    protein: ['svinekjøtt', 'svinefilet'],
    vegetables: ['paprika', 'løk', 'brokkoli']
    // Alt annet arves fra 'wok' archetype
}
```

### Overstyre archetype-regler

```typescript
{
    id: 'spesiell_pasta',
    name: 'Spesiell pasta',
    archetype: 'pasta',
    protein: ['laks'],
    carbs: ['penne', 'fusilli'],  // ← Overstyr archetype
    forbids: ['tomat'],  // ← Ekstra forbud (i tillegg til archetype)
}
```

### Endre alle pastaretter samtidig

```typescript
// archetypes.ts
pasta: {
    allowedCarbs: [..., 'orzo', 'rigatoni'],  // ← Legger til nye
    forbiddenIngredients: [..., 'pølser'],    // ← Alle pasta-retter får dette
}
```

## 📊 Eksempel: En fullstendig flow

### 1. Archetype definerer regler:
```typescript
wok: {
    allowedCarbs: ['ris', 'nudler'],
    forbiddenIngredients: ['pasta', 'potet'],
}
```

### 2. Template er minimal:
```typescript
{
    archetype: 'wok',
    protein: ['kylling'],
    vegetables: ['paprika']
}
```

### 3. Resolver gir fullstendig objekt:
```typescript
resolved = {
    protein: ['kylling'],
    carbs: ['ris', 'nudler'],  // fra archetype
    vegetables: ['paprika'],
    forbids: ['pasta', 'potet'], // fra archetype
}
```

## 💡 Beste praksis

### ✅ Gjør dette:
- Definer generelle regler i archetype
- Hold templates små og enkle
- Overstyr kun når nødvendig
- Bruk `resolveAllTemplates()` i generator

### ❌ Ikke gjør dette:
- Ikke dupliser regler i templates
- Ikke hardkod alle carbs i hver template
- Ikke bruk templates direkte (uten resolve)

## 🔄 Oppdaterings-impact

| Endring | Påvirkning |
|---------|------------|
| Endre archetype | Alle templates med den archetype |
| Endre template | Bare den retten |
| Legge til template | Ingen eksisterende retter |
| Legge til archetype | Brukes av nye templates |

## 🚀 Fremtidige utvidelser

Enkelt å legge til:
- Nye archetypes (f.eks. `salat`, `suppe`)
- Sesongregler i archetypes
- Vanskelighetsnivå per archetype
- Kostnadskategorier
- Allergen-regler

Alt uten å endre eksisterende templates! 🎉
