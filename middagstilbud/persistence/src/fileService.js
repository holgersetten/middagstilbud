const fs = require('fs');
const path = require('path');
const config = require('../../rest/src/config');

class FileService {
    constructor() {
        this.offersDir = config.offersDir;
        this.ensureDirectoryExists(this.offersDir);
    }

    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    loadJSON(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                const parsed = JSON.parse(data);
                return parsed;
            }
            console.warn(`⚠️ Fil ikke funnet: ${filePath}`);
            return {};
        } catch (error) {
            console.error(`❌ Feil ved lasting av ${filePath}:`, error.message);
            console.error('❌ Fil innhold kan være korrupt eller ikke gyldig JSON');
            return {};
        }
    }

    saveJSON(filePath, data) {
        try {
            const dir = path.dirname(filePath);
            this.ensureDirectoryExists(dir);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`❌ Feil ved lagring av ${filePath}:`, error.message);
            return false;
        }
    }
}

module.exports = new FileService();
