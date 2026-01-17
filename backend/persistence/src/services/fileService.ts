import fs from 'fs';
import path from 'path';
import config from '../../../rest/src/config/index';

class FileService {
    private offersDir: string;

    constructor() {
        this.offersDir = config.offersDir;
        this.ensureDirectoryExists(this.offersDir);
    }

    ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    loadJSON<T = any>(filePath: string): T | Record<string, never> {
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                const parsed = JSON.parse(data);
                return parsed;
            }
            console.warn(`⚠️ Fil ikke funnet: ${filePath}`);
            return {} as Record<string, never>;
        } catch (error) {
            console.error(`❌ Feil ved lasting av ${filePath}:`, (error as Error).message);
            console.error('❌ Fil innhold kan være korrupt eller ikke gyldig JSON');
            return {} as Record<string, never>;
        }
    }

    saveJSON<T = any>(filePath: string, data: T): boolean {
        try {
            const dir = path.dirname(filePath);
            this.ensureDirectoryExists(dir);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`❌ Feil ved lagring av ${filePath}:`, (error as Error).message);
            return false;
        }
    }
}

export default new FileService();
