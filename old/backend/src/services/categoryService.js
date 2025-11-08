const config = require('../config');
const fileService = require('./fileService');
const { getStoreLogoUrl } = require('../config/stores');

class CategoryService {
    constructor() {
        this.tagsData = this.loadCategories();
        this.synonyms = this.loadSynonyms();
    }

    loadCategories() {
        const data = fileService.loadJSON(config.categoriesFile);
        if (Array.isArray(data)) {
            return data;
        }
        console.warn('⚠️ Categories-filen har feil format, forventet array');
        return [];
    }

    loadSynonyms() {
        return fileService.loadJSON(config.synonymsFile);
    }

    reloadData() {
        this.tagsData = this.loadCategories();
        this.synonyms = this.loadSynonyms();
        console.log(`✅ Reloadet ${this.tagsData.length} kategorier og ${Object.keys(this.synonyms).length} synonymer`);
    }

    // Fuzzy string match (Levenshtein distance, max 2)
    fuzzyMatch(a, b) {
        if (!a || !b) return false;
        a = a.toLowerCase();
        b = b.toLowerCase();
        if (a === b) return true;
        if (a.includes(b) || b.includes(a)) return true;
        // Levenshtein distance
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
        return matrix[a.length][b.length] <= 2;
    }

    tagProduct(title) {
        if (!title || typeof title !== 'string') {
            return ['annet'];
        }
        const lowerTitle = title.toLowerCase();
        const matchedTags = [];
        // 1. Sjekk aliaser med fuzzy match
        this.tagsData.forEach(catObj => {
            if (!catObj.category || !Array.isArray(catObj.aliases)) return;
            catObj.aliases.forEach(alias => {
                if (typeof alias === 'string' && this.fuzzyMatch(lowerTitle, alias)) {
                    if (!matchedTags.includes(catObj.category)) matchedTags.push(catObj.category);
                }
            });
        });
        // 2. Sjekk synonymer med fuzzy match
        Object.entries(this.synonyms || {}).forEach(([cat, syns]) => {
            if (!Array.isArray(syns)) return;
            syns.forEach(syn => {
                if (typeof syn === 'string' && this.fuzzyMatch(lowerTitle, syn)) {
                    if (!matchedTags.includes(cat)) matchedTags.push(cat);
                }
            });
        });
        // 3. Returner beste match (første) eller 'annet'
        return matchedTags.length > 0 ? [matchedTags[0]] : ['annet'];
    }

    getCategories() {
        return this.tagsData;
    }

    getCategoryByName(name) {
        return this.tagsData.find(cat => 
            cat.category && cat.category.toLowerCase() === name.toLowerCase()
        );
    }

    searchByCategory(offers, categoryName) {
        if (!categoryName || !Array.isArray(offers)) {
            return [];
        }

        const category = this.getCategoryByName(categoryName);
        if (!category) {
            return [];
        }

        const matchingOffers = offers.filter(offer => {
            if (!offer.title) return false;
            
            const tags = this.tagProduct(offer.title);
            return tags.includes(category.category);
        });

        // Legg til logoer i resultatene
        return matchingOffers.map(offer => {
            const storeName = offer.store || offer.dealer?.name || 'Ukjent';
            return {
                ...offer,
                logo: getStoreLogoUrl(storeName)
            };
        });
    }
}

module.exports = new CategoryService();
