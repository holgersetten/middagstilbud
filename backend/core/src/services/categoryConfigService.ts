import fs from 'fs';
import path from 'path';
import categoryService from './categoryService';

export interface CategoryHierarchyData {
  [mainCategory: string]: string[];
}

class CategoryConfigService {
  private configPath: string;

  constructor() {
    this.configPath = path.join(__dirname, '../config/categories.ts');
  }

  /**
   * Leser nåværende kategoristruktur fra categories.ts
   */
  getCurrentHierarchy(): CategoryHierarchyData {
    try {
      // Les filen og parser CATEGORY_HIERARCHY objektet
      const content = fs.readFileSync(this.configPath, 'utf-8');
      const match = content.match(/export const CATEGORY_HIERARCHY = ({[\s\S]*?}) as const;/);
      
      if (!match) {
        throw new Error('Kunne ikke finne CATEGORY_HIERARCHY i filen');
      }

      // Parse JSON-strukturen (må erstatte " med " for gyldig JSON)
      const jsonStr = match[1]
        .replace(/"/g, '"')
        .replace(/"/g, '"')
        .replace(/,(\s*[}\]])/g, '$1'); // Fjern trailing commas
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Feil ved lesing av kategorier:', error);
      throw error;
    }
  }

  /**
   * Skriver ny kategoristruktur til categories.ts
   * ADVARSEL: Dette overskriver filen!
   */
  updateHierarchy(newHierarchy: CategoryHierarchyData): boolean {
    try {
      // Valider at alle hovedkategorier har minst én underkategori
      for (const [mainCat, subCats] of Object.entries(newHierarchy)) {
        if (!Array.isArray(subCats) || subCats.length === 0) {
          throw new Error(`Hovedkategori "${mainCat}" må ha minst én underkategori`);
        }
      }

      // Les eksisterende fil
      const content = fs.readFileSync(this.configPath, 'utf-8');

      // Generer ny CATEGORY_HIERARCHY string
      const hierarchyStr = JSON.stringify(newHierarchy, null, 2)
        .replace(/"/g, '"')
        .replace(/"/g, '"');

      // Erstatt kun CATEGORY_HIERARCHY delen
      const newContent = content.replace(
        /export const CATEGORY_HIERARCHY = {[\s\S]*?} as const;/,
        `export const CATEGORY_HIERARCHY = ${hierarchyStr} as const;`
      );

      // Skriv tilbake
      fs.writeFileSync(this.configPath, newContent, 'utf-8');

      console.log('✅ Kategoristruktur oppdatert i categories.ts');
      return true;
    } catch (error) {
      console.error('❌ Feil ved skriving av kategorier:', error);
      throw error;
    }
  }

  /**
   * Legger til en ny underkategori under en hovedkategori
   */
  addSubCategory(mainCategory: string, newSubCategory: string): boolean {
    const hierarchy = this.getCurrentHierarchy();
    
    if (!hierarchy[mainCategory]) {
      throw new Error(`Hovedkategori "${mainCategory}" finnes ikke`);
    }

    if (hierarchy[mainCategory].includes(newSubCategory)) {
      throw new Error(`Underkategori "${newSubCategory}" finnes allerede under "${mainCategory}"`);
    }

    // Legg til på slutten
    hierarchy[mainCategory].push(newSubCategory);

    return this.updateHierarchy(hierarchy);
  }

  /**
   * Legger til en ny hovedkategori
   */
  addMainCategory(newMainCategory: string): boolean {
    const hierarchy = this.getCurrentHierarchy();
    
    if (hierarchy[newMainCategory]) {
      throw new Error(`Hovedkategori "${newMainCategory}" finnes allerede`);
    }

    // Ny hovedkategori starter med tom array - brukeren må legge til underkategorier
    hierarchy[newMainCategory] = [];
    return this.updateHierarchy(hierarchy);
  }

  /**
   * Fjerner en hovedkategori
   */
  removeMainCategory(mainCategory: string): boolean {
    const hierarchy = this.getCurrentHierarchy();
    
    if (!hierarchy[mainCategory]) {
      throw new Error(`Hovedkategori "${mainCategory}" finnes ikke`);
    }

    delete hierarchy[mainCategory];
    const success = this.updateHierarchy(hierarchy);
    
    // Flytt alle produkter med denne kategorien til Ukategorisert
    if (success) {
      console.log(`🔄 Flytter produkter fra "${mainCategory}" til Ukategorisert`);
      categoryService.moveCategoryToUncategorized(mainCategory, null);
    }
    
    return success;
  }

  /**
   * Omdøper en hovedkategori
   */
  renameMainCategory(oldName: string, newName: string): boolean {
    const hierarchy = this.getCurrentHierarchy();
    
    if (!hierarchy[oldName]) {
      throw new Error(`Hovedkategori "${oldName}" finnes ikke`);
    }

    if (hierarchy[newName]) {
      throw new Error(`Hovedkategori "${newName}" finnes allerede`);
    }

    // Kopier underkategorier til nytt navn
    hierarchy[newName] = hierarchy[oldName];
    delete hierarchy[oldName];
    
    const success = this.updateHierarchy(hierarchy);
    
    // Oppdater alle cached produkter med den gamle kategorien
    if (success) {
      console.log(`🔄 Oppdaterer cache: ${oldName} → ${newName}`);
      categoryService.updateCachedMainCategory(oldName, newName);
    }
    
    return success;
  }

  /**
   * Fjerner en underkategori
   */
  removeSubCategory(mainCategory: string, subCategory: string): boolean {
    const hierarchy = this.getCurrentHierarchy();
    
    if (!hierarchy[mainCategory]) {
      throw new Error(`Hovedkategori "${mainCategory}" finnes ikke`);
    }

    const index = hierarchy[mainCategory].indexOf(subCategory);
    if (index === -1) {
      throw new Error(`Underkategori "${subCategory}" finnes ikke under "${mainCategory}"`);
    }

    hierarchy[mainCategory].splice(index, 1);
    const success = this.updateHierarchy(hierarchy);
    
    // Flytt alle produkter med denne underkategorien til Ukategorisert
    if (success) {
      console.log(`🔄 Flytter produkter fra "${mainCategory} > ${subCategory}" til Ukategorisert`);
      categoryService.moveCategoryToUncategorized(mainCategory, subCategory);
    }
    
    return success;
  }

  /**
   * Omdøper en underkategori
   */
  renameSubCategory(mainCategory: string, oldName: string, newName: string): boolean {
    const hierarchy = this.getCurrentHierarchy();
    
    if (!hierarchy[mainCategory]) {
      throw new Error(`Hovedkategori "${mainCategory}" finnes ikke`);
    }

    const index = hierarchy[mainCategory].indexOf(oldName);
    if (index === -1) {
      throw new Error(`Underkategori "${oldName}" finnes ikke under "${mainCategory}"`);
    }

    if (hierarchy[mainCategory].includes(newName)) {
      throw new Error(`Underkategori "${newName}" finnes allerede under "${mainCategory}"`);
    }

    hierarchy[mainCategory][index] = newName;
    const success = this.updateHierarchy(hierarchy);
    
    // Oppdater alle cached produkter med den gamle kategorien
    if (success) {
      console.log(`🔄 Oppdaterer cache: ${mainCategory} > ${oldName} → ${newName}`);
      categoryService.updateCachedSubCategory(mainCategory, oldName, newName);
    }
    
    return success;
  }
}

export default new CategoryConfigService();
