import OpenAI from 'openai';
import { MainCategory, SubCategory, CATEGORY_HIERARCHY, MAIN_CATEGORIES } from '../config/categories';

const openai = process.env.OPENAI_API_KEY 
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
    
    const prompt = `Du er en ekspert på norske matvarer. Kategoriser følgende produkter.

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
- mainCategory: Velg fra hovedkategoriene (f.eks. "Frukt og grønt")
- subCategory: Velg fra underkategorier under mainCategory
- ingredientKey: Normalisert navn på ingrediens (lowercase, generisk, f.eks. "agurk", "tomat", "melk")
  - Bruk "produkt" hvis det ikke er en ingrediens (f.eks. bleier, rengjøringsmiddel)
- confidence: 
  - 1.0: Helt sikker
  - 0.9: Veldig sikker (minimum for caching)
  - 0.7: Ganske sikker
  - 0.5: Usikker

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
                    content: 'Du er en ekspert på kategorisering av norske matvarer. Returner alltid valid JSON.'
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
            
            // Validate categories
            if (!MAIN_CATEGORIES.includes(result.mainCategory)) {
                console.warn(`Invalid mainCategory: ${result.mainCategory}`);
                continue;
            }
            
            const subCategories = CATEGORY_HIERARCHY[result.mainCategory as MainCategory];
            if (!subCategories.includes(result.subCategory as any)) {
                console.warn(`Invalid subCategory ${result.subCategory} for ${result.mainCategory}`);
                continue;
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
