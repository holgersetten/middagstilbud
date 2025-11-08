const config = require('../config');
const fileService = require('./fileService');
const path = require('path');

class EnhancedCategoryService {
    constructor() {
        this.categories = this.loadEnhancedCategories();
        this.setupCategoryIndex();
    }

    loadEnhancedCategories() {
        const categoryFilePath = path.join(__dirname, '../../enhanced_categories.json');
        const data = fileService.loadJSON(categoryFilePath);
        return data.categories || {};
    }

    setupCategoryIndex() {
        // Bygg opp en indeks for rask oppslag
        this.keywordToCategoryMap = {};
        
        for (const [categoryId, categoryData] of Object.entries(this.categories)) {
            for (const keyword of categoryData.keywords) {
                if (!this.keywordToCategoryMap[keyword.toLowerCase()]) {
                    this.keywordToCategoryMap[keyword.toLowerCase()] = [];
                }
                this.keywordToCategoryMap[keyword.toLowerCase()].push(categoryId);
            }
        }
    }

    /**
     * Kategoriser et tilbud basert på tittel og beskrivelse
     */
    categorizeOffer(offer) {
        const title = (offer.title || offer.heading || '').toLowerCase();
        const description = (offer.description || '').toLowerCase();
        const fullText = `${title} ${description}`.toLowerCase();

        const matchedCategories = [];

        for (const [categoryId, categoryData] of Object.entries(this.categories)) {
            let score = 0;
            let matched = false;

            // Sjekk først om det finnes eksklusjoner
            const hasExclusions = categoryData.exclusions.some(exclusion => 
                fullText.includes(exclusion.toLowerCase())
            );

            if (hasExclusions) {
                continue; // Skip denne kategorien hvis eksklusjoner matcher
            }

            // Sjekk for nøkkelord-matches
            for (const keyword of categoryData.keywords) {
                const keywordLower = keyword.toLowerCase();
                
                // Eksakt match gir høy score
                if (title === keywordLower) {
                    score += 10;
                    matched = true;
                } 
                // Hele ordet match (med ord-grenser)
                else if (this.containsWholeWord(title, keywordLower)) {
                    score += 8;
                    matched = true;
                }
                // Substring match (lavere score)
                else if (title.includes(keywordLower)) {
                    score += 3;
                    matched = true;
                }

                // Sjekk også beskrivelse med lavere score
                if (description.includes(keywordLower)) {
                    score += 1;
                    matched = true;
                }
            }

            if (matched) {
                matchedCategories.push({
                    categoryId,
                    categoryName: categoryData.name,
                    score
                });
            }
        }

        // Sorter etter score og returner beste match
        matchedCategories.sort((a, b) => b.score - a.score);
        return matchedCategories.length > 0 ? matchedCategories[0] : null;
    }

    /**
     * Sjekk om tekst inneholder hele ord (ikke bare substring)
     */
    containsWholeWord(text, word) {
        const regex = new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'i');
        return regex.test(text);
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
    }

    /**
     * Finn alle tilbud i en gitt kategori
     */
    getOffersByCategory(offers, categoryId) {
        if (!this.categories[categoryId]) {
            return [];
        }

        return offers.filter(offer => {
            const category = this.categorizeOffer(offer);
            return category && category.categoryId === categoryId;
        });
    }

    /**
     * Få alle tilgjengelige kategorier
     */
    getAllCategories() {
        return Object.entries(this.categories).map(([id, data]) => ({
            id,
            name: data.name,
            keywordCount: data.keywords.length
        }));
    }

    /**
     * Forbedret ingrediens-matching
     */
    findOffersForIngredient(ingredient, offers) {
        const ingredientLower = ingredient.toLowerCase().trim();
        
        // Først prøv direkte kategori-matching
        const relevantCategories = [];
        
        for (const [categoryId, categoryData] of Object.entries(this.categories)) {
            for (const keyword of categoryData.keywords) {
                if (this.fuzzyMatch(ingredientLower, keyword.toLowerCase())) {
                    relevantCategories.push(categoryId);
                    break;
                }
            }
        }

        if (relevantCategories.length > 0) {
            // Bruk kategori-basert søk
            let categoryOffers = [];
            for (const categoryId of relevantCategories) {
                categoryOffers = categoryOffers.concat(
                    this.getOffersByCategory(offers, categoryId)
                );
            }
            return categoryOffers;
        }

        // Fallback til vanlig tekstsøk hvis ingen kategorier matcher
        return offers.filter(offer => {
            const title = (offer.title || offer.heading || '').toLowerCase();
            return this.containsWholeWord(title, ingredientLower) || 
                   title.includes(ingredientLower);
        });
    }

    fuzzyMatch(a, b) {
        if (a === b) return true;
        if (a.includes(b) || b.includes(a)) return true;
        
        // Levenshtein distance med threshold på 2
        const distance = this.levenshteinDistance(a, b);
        return distance <= 2 && Math.min(a.length, b.length) > 3;
    }

    levenshteinDistance(a, b) {
        const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
        
        for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
        
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        
        return matrix[a.length][b.length];
    }
}

module.exports = new EnhancedCategoryService();
