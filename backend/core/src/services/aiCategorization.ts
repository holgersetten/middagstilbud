import OpenAI from 'openai';
import { MainCategory, SubCategory, CATEGORY_HIERARCHY, MAIN_CATEGORIES } from '../config/categories';

// Sjekk både OPENAI_API_KEY og SKIP_AI flag
const openai = (process.env.OPENAI_API_KEY && process.env.SKIP_AI !== 'true')
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

export interface AICategoryResult {
    mainCategory: MainCategory;
    subCategory: SubCategory;
    ingredientKey: string;
    confidence: {
        main: number;
        sub: number;
        ingredientKey: number;
    };
}

interface ProductToCategoize {
    productKey: string;
    title: string;
    description?: string;
    store?: string;
}

/**
 * Batch-kategoriserer produkter med OpenAI GPT-4o-mini
 * Returnerer kun resultater med høy confidence (≥ 0.9)
 * Splitter i mindre batches for bedre stabilitet
 */
export async function batchCategorizeWithAI(
    products: ProductToCategoize[]
): Promise<Map<string, AICategoryResult>> {
    if (products.length === 0) {
        return new Map();
    }

    const BATCH_SIZE = 30; // Mindre batches for bedre stabilitet
    const resultMap = new Map<string, AICategoryResult>();
    const totalBatches = Math.ceil(products.length / BATCH_SIZE);
    
    console.log(`📊 Totalt ${products.length} produkter → ${totalBatches} batches (${BATCH_SIZE} per batch)`);

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        
        console.log(`🔄 Batch ${batchNum}/${totalBatches}: Kategoriserer ${batch.length} produkter...`);
        
        try {
            const batchResults = await categorizeBatch(batch);
            
            // Merge results
            for (const [key, value] of batchResults) {
                resultMap.set(key, value);
            }
            
            console.log(`✓ Batch ${batchNum}/${totalBatches}: ${batchResults.size} resultater`);
        } catch (error) {
            console.error(`✗ Batch ${batchNum}/${totalBatches} feilet:`, (error as Error).message);
        }
    }

    return resultMap;
}

/**
 * Kategoriser én batch med OpenAI
 */
async function categorizeBatch(
    products: ProductToCategoize[]
): Promise<Map<string, AICategoryResult>> {
    if (products.length === 0) {
        return new Map();
    }

    const categoryStructure = JSON.stringify(CATEGORY_HIERARCHY, null, 2);
    
    const prompt = `Du er en ekspert på norske matvarer og dagligvarer. Kategoriser følgende produkter.

VIKTIG: Dette inkluderer både matvarer OG andre dagligvarer som selges i butikker (husholdningsartikler, klær, verktøy, byggevarer osv). 
Bruk "Hus & hjem" kategorien for ikke-matvarer.

KATEGORISTRUKTUR:
${categoryStructure}

PRODUKTER (med cacheKey som ID):
${products.map(p => `- "${p.productKey}": ${p.title}${p.description ? ` (${p.description})` : ''}`).join('\n')}

Returner JSON med format:
{
  "results": [
    {
      "id": "<cacheKey>",
      "mainCategory": "Frukt og grønt",
      "subCategory": "Grønnsaker",
      "ingredientKey": "agurk",
      "confidence": {
        "main": 0.97,
        "sub": 0.95,
        "ingredientKey": 0.96
      }
    }
  ]
}

REGLER:
STEG 1 - Velg mainCategory:
- Les produkttittel og vurder ALLE hovedkategorier
- Velg den mest passende hovedkategorien basert på produktets primære formål
- Eksempel: "Extra tyggegummi" → "Snacks & godteri" (riktig hovedkategori)

STEG 2 - Velg subCategory:
- Nå som mainCategory er valgt, les gjennom ALLE subkategorier under denne
- Velg den MEST SPESIFIKKE subkategorien som passer
- IKKE velg første beste - sjekk om det finnes en mer presis!
- Viktige eksempler for norsk kontekst:
  * "Extra tyggegummi" → "Snacks, godteri & sjokolade > Tyggegummi" (IKKE "Godteri")
  * "Gilde spekeskinke" → "Pålegg & frokost > Kjøttpålegg
  * "Bacon" → "Pålegg & frokost > Bacon" (egen kategori!)
  * "Makrell i tomat" → "Pålegg & frokost > Fiskepålegg" (IKKE "Fisk & skalldyr > Fisk" - det spises på brød!)
  * "Tunfisk i olje/vann" → "Pålegg & frokost > Fiskepålegg" (hermetisk fisk som spises på brød = pålegg)
  * "Mills majones" → "Tilbehør > Sauser og dressing"
  * "Tine kremgo" → "Ost > Smøreost"
  * "Pesto" → "Tilbehør > Sauser og dressing"
  * "Rislunsj" → "Meieri & egg > Yoghurt" (norsk frokostprodukt med yoghurt)
  * "Bygglunsj" → "Meieri & egg > Yoghurt" (norsk frokostprodukt med yoghurt)
  * "Potetmos" → "Tilbehør > Stuinger" (IKKE "Middag > Ferdigretter")
  * "Brød" → "Brød > Brød" (hovedkategori er nå "Brød", ikke "Bakeri")
  * "Panelovn" → "Hus & hjem > Oppvarming"
  * "Varmepumpe" → "Hus & hjem > Oppvarming"
  * "Interiørmaling" → "Hus & hjem > Byggevarer"
  * "Laminatgulv" → "Hus & hjem > Byggevarer"
  * "Brannslukker" → "Hus & hjem > Sikkerhet"
  * "Verktøysett" → "Hus & hjem > Verktøy"
  * "Regnjakke" → "Hus & hjem > Klær og sko"
  * "Gryte" → "Hus & hjem > Kjøkken"
- Bruk "Annet" KUN hvis produktet virkelig ikke passer i noen av de spesifikke subkategoriene

STEG 3 - Velg ingredientKey:
- 1-2 nært beslektede søkeord som beskriver hovedingrediensen eller produkttypen
- ALDRI bruk "produkt" - finn alltid et spesifikt navn!
- For MATVARER: Hovedingrediens eller produkttype
  * Eksempler: "tyggegummi", "tomat", "melk", "leverpostei", "salami", "proteinbar"
  * Sammensatte: "sjokolademelk", "tunfisk thai", "spekeskinke"
  * Merkevarer: Generaliser ("Nugatti" → "sjokoladepålegg", "Extra" → "tyggegummi")
- For IKKE-MATVARER: Produkttype eller funksjon
  * Eksempler: "panelovn", "maling", "verktøysett", "regnjakke", "gryte", "brannslukker"
- VIKTIG: Maksimalt 1-2 ord, skal reflektere hva tingen er - IKKE liste mange ingredienser med komma!

STEG 4 - Sett confidence:
- 0.95: Helt sikker (produktet passer perfekt i kategorien)
- 0.90: Veldig sikker (produktet passer godt)
- 0.85: Ganske sikker (noe usikkerhet)
- VIKTIG: Vær generøs med 0.95! Hvis produktet klart tilhører en kategori, bruk 0.95
- De fleste vanlige matvarer skal ha minst 0.90 confidence

Returner KUN JSON object, ingen annen tekst.`;

    if (!openai) {
        console.warn('⚠️ OpenAI API-nøkkel mangler, hopper over AI-kategorisering');
        return new Map();
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Du er en ekspert på kategorisering av norske matvarer. Returner alltid valid JSON. KRITISK: subCategory MÅ tilhøre mainCategory i kategoristrukturen! Les ALLE subkategorier nøye før du velger. Vanlige feil å unngå: Tyggegummi er egen kategori (ikke Godteri), Spekemat er under Pålegg & frokost (ikke Kjøtt), Bacon er egen kategori (ikke Kjøttpålegg). Velg alltid den mest spesifikke subkategorien. Vær generøs med høy confidence når kategorien er åpenbar. ALDRI bruk "produkt" som ingredientKey - finn alltid et spesifikt navn!'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3, // Lav temperatur for konsistente resultater
            response_format: { type: 'json_object' }
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error('Ingen respons fra OpenAI');
        }

        const parsed = JSON.parse(content);
        const results = Array.isArray(parsed) ? parsed : parsed.results || [];
        const resultMap = new Map<string, AICategoryResult>();

        for (const result of results) {
            if (!result.id || !result.mainCategory || !result.subCategory || !result.ingredientKey) {
                continue;
            }
            
            // Validate mainCategory - hvis ugyldig, hopp over helt
            if (!MAIN_CATEGORIES.includes(result.mainCategory)) {
                console.warn(`Invalid mainCategory: ${result.mainCategory}`);
                continue;
            }
            
            // IKKE hopp over ved ugyldig subCategory - la categoryService.ts reparere til "Annet"
            const subCategories = CATEGORY_HIERARCHY[result.mainCategory as MainCategory];
            if (!subCategories.includes(result.subCategory as any)) {
                console.warn(`⚠️ AI foreslo ugyldig subCategory "${result.subCategory}" for "${result.mainCategory}" - vil bli reparert til "Annet"`);
                // IKKE continue - returner resultatet slik at det kan repareres
            }
            
            resultMap.set(result.id, {
                mainCategory: result.mainCategory as MainCategory,
                subCategory: result.subCategory as SubCategory,
                ingredientKey: result.ingredientKey.toLowerCase().trim(),
                confidence: {
                    main: result.confidence?.main || 0,
                    sub: result.confidence?.sub || 0,
                    ingredientKey: result.confidence?.ingredientKey || 0
                }
            });
        }

        return resultMap;
    } catch (error) {
        console.error('❌ AI kategorisering feilet:', (error as Error).message);
        return new Map();
    }
}

/**
 * Kategoriser enkeltprodukt (brukes sjelden, batch er foretrukket)
 */
export async function categorizeWithAI(
    title: string,
    description?: string
): Promise<AICategoryResult | null> {
    const results = await batchCategorizeWithAI([
        { productKey: 'single', title, description }
    ]);
    
    return results.get('single') || null;
}
