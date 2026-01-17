import { MainCategory, SubCategory, DEFAULT_MAIN_CATEGORY, DEFAULT_SUB_CATEGORY } from '../config/categories';
import { AICategoryResult } from './aiCategorization';

/**
 * Mock AI kategorisering for testing uten API-kostnader
 * Bruker enkle keyword-regler for å simulere AI-respons
 */

interface ProductToCategoize {
    productKey: string;
    title: string;
    description?: string;
    store?: string;
}

const mockRules: Array<{ 
    keywords: string[]; 
    mainCategory: MainCategory; 
    subCategory: SubCategory;
    ingredientKey: string;
    confidence: { main: number; sub: number; ingredientKey: number };
}> = [
    { 
        keywords: ['melk', 'yoghurt', 'fløte'], 
        mainCategory: 'Meieri og egg', 
        subCategory: 'Melk',
        ingredientKey: 'melk',
        confidence: { main: 0.95, sub: 0.93, ingredientKey: 0.96 }
    },
    { 
        keywords: ['ost', 'brunost', 'prim'], 
        mainCategory: 'Meieri og egg', 
        subCategory: 'Ost',
        ingredientKey: 'ost',
        confidence: { main: 0.96, sub: 0.95, ingredientKey: 0.97 }
    },
    { 
        keywords: ['smør'], 
        mainCategory: 'Meieri og egg', 
        subCategory: 'Smør og margarin',
        ingredientKey: 'smør',
        confidence: { main: 0.97, sub: 0.96, ingredientKey: 0.98 }
    },
    { 
        keywords: ['egg'], 
        mainCategory: 'Meieri og egg', 
        subCategory: 'Egg',
        ingredientKey: 'egg',
        confidence: { main: 0.98, sub: 0.97, ingredientKey: 0.99 }
    },
    { 
        keywords: ['eple', 'banan', 'appelsin', 'pære', 'druer'], 
        mainCategory: 'Frukt og grønt', 
        subCategory: 'Frukt',
        ingredientKey: 'frukt',
        confidence: { main: 0.92, sub: 0.91, ingredientKey: 0.90 }
    },
    { 
        keywords: ['tomat', 'agurk', 'paprika', 'salat', 'gulrot', 'løk'], 
        mainCategory: 'Frukt og grønt', 
        subCategory: 'Grønnsaker',
        ingredientKey: 'grønnsaker',
        confidence: { main: 0.93, sub: 0.92, ingredientKey: 0.91 }
    },
    { 
        keywords: ['kjøtt', 'biff', 'entrecote'], 
        mainCategory: 'Kjøtt', 
        subCategory: 'Storfe',
        ingredientKey: 'kjøtt',
        confidence: { main: 0.91, sub: 0.89, ingredientKey: 0.92 }
    },
    { 
        keywords: ['kylling', 'kyllingfilet'], 
        mainCategory: 'Kjøtt', 
        subCategory: 'Kylling og fjærkre',
        ingredientKey: 'kylling',
        confidence: { main: 0.94, sub: 0.93, ingredientKey: 0.95 }
    },
    { 
        keywords: ['bacon', 'pølse'], 
        mainCategory: 'Kjøtt', 
        subCategory: 'Påleggskjøtt',
        ingredientKey: 'bacon',
        confidence: { main: 0.92, sub: 0.90, ingredientKey: 0.91 }
    },
    { 
        keywords: ['laks'], 
        mainCategory: 'Fisk og sjømat', 
        subCategory: 'Fisk',
        ingredientKey: 'laks',
        confidence: { main: 0.95, sub: 0.94, ingredientKey: 0.96 }
    },
    { 
        keywords: ['torsk', 'fisk'], 
        mainCategory: 'Fisk og sjømat', 
        subCategory: 'Fisk',
        ingredientKey: 'fisk',
        confidence: { main: 0.90, sub: 0.88, ingredientKey: 0.89 }
    },
    { 
        keywords: ['reker'], 
        mainCategory: 'Fisk og sjømat', 
        subCategory: 'Skalldyr',
        ingredientKey: 'reker',
        confidence: { main: 0.93, sub: 0.92, ingredientKey: 0.94 }
    },
    { 
        keywords: ['brød', 'rundstykke', 'loff'], 
        mainCategory: 'Bakeri og bakst', 
        subCategory: 'Brød',
        ingredientKey: 'brød',
        confidence: { main: 0.94, sub: 0.93, ingredientKey: 0.95 }
    },
    { 
        keywords: ['pasta', 'spaghetti', 'makaroni'], 
        mainCategory: 'Frokost og korn', 
        subCategory: 'Annet',
        ingredientKey: 'pasta',
        confidence: { main: 0.89, sub: 0.87, ingredientKey: 0.88 }
    },
    { 
        keywords: ['ris'], 
        mainCategory: 'Frokost og korn', 
        subCategory: 'Annet',
        ingredientKey: 'ris',
        confidence: { main: 0.91, sub: 0.90, ingredientKey: 0.92 }
    },
    { 
        keywords: ['chips'], 
        mainCategory: 'Snacks og godteri', 
        subCategory: 'Chips',
        ingredientKey: 'chips',
        confidence: { main: 0.96, sub: 0.95, ingredientKey: 0.97 }
    },
    { 
        keywords: ['godteri', 'sjokolade'], 
        mainCategory: 'Snacks og godteri', 
        subCategory: 'Smågodt',
        ingredientKey: 'godteri',
        confidence: { main: 0.96, sub: 0.94, ingredientKey: 0.95 }
    },
    { 
        keywords: ['brus', 'cola', 'pepsi'], 
        mainCategory: 'Drikke', 
        subCategory: 'Brus',
        ingredientKey: 'brus',
        confidence: { main: 0.97, sub: 0.96, ingredientKey: 0.98 }
    },
    { 
        keywords: ['juice', 'appelsinjuice'], 
        mainCategory: 'Drikke', 
        subCategory: 'Juice',
        ingredientKey: 'juice',
        confidence: { main: 0.95, sub: 0.94, ingredientKey: 0.96 }
    },
    { 
        keywords: ['vann'], 
        mainCategory: 'Drikke', 
        subCategory: 'Vann',
        ingredientKey: 'vann',
        confidence: { main: 0.98, sub: 0.97, ingredientKey: 0.99 }
    },
    { 
        keywords: ['kaffe'], 
        mainCategory: 'Drikke', 
        subCategory: 'Kaffe',
        ingredientKey: 'kaffe',
        confidence: { main: 0.96, sub: 0.95, ingredientKey: 0.97 }
    },
];

export async function batchCategorizeWithAIMock(
    products: ProductToCategoize[]
): Promise<Map<string, AICategoryResult>> {
    console.log('🧪 MOCK MODE: Simulerer AI-kategorisering...');
    
    // Simuler API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const resultMap = new Map<string, AICategoryResult>();
    
    for (const product of products) {
        const title = product.title.toLowerCase();
        let matched = false;
        
        for (const rule of mockRules) {
            if (rule.keywords.some(kw => title.includes(kw))) {
                resultMap.set(product.productKey, {
                    mainCategory: rule.mainCategory,
                    subCategory: rule.subCategory,
                    ingredientKey: rule.ingredientKey,
                    confidence: rule.confidence
                });
                matched = true;
                break;
            }
        }
        
        // Hvis ingen match, returner lav confidence
        if (!matched) {
            resultMap.set(product.productKey, {
                mainCategory: DEFAULT_MAIN_CATEGORY,
                subCategory: DEFAULT_SUB_CATEGORY,
                ingredientKey: 'produkt',
                confidence: { main: 0.4, sub: 0.4, ingredientKey: 0.4 }
            });
        }
    }
    
    return resultMap;
}
