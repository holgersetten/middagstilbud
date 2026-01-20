import path from 'path';

interface Config {
  port: number;
  nodeEnv: string;
  apiRateLimit: number;
  corsOrigin: string;
  logLevel: string;
  
  // Paths
  backendDir: string;
  offersDir: string;
  mealsFile: string;
  categoriesFile: string;
  tagsFile: string;
  synonymsFile: string;
  
  // External APIs
  tjekApiBaseUrl: string;
  
  // NLP
  nlpEnabled: boolean;
  pythonNlpPort: number;
}

const config: Config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiRateLimit: parseInt(process.env.API_RATE_LIMIT || '100', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Paths
  backendDir: path.resolve(__dirname, '../..'),
  offersDir: path.resolve(__dirname, '../../../persistence/src/resources/offers'),
  mealsFile: path.resolve(__dirname, '../../../persistence/src/resources/meals.json'),
  categoriesFile: path.resolve(__dirname, '../../../persistence/src/resources/categories.json'),
  tagsFile: path.resolve(__dirname, '../../../persistence/src/resources/tags.json'),
  synonymsFile: path.resolve(__dirname, '../../../persistence/src/resources/synonyms.json'),
  
  // External APIs
  tjekApiBaseUrl: process.env.TJEK_API_BASE_URL || 'https://squid-api.tjek.com/v2',
  
  // NLP
  nlpEnabled: process.env.NLP_ENABLED === 'true',
  pythonNlpPort: parseInt(process.env.PYTHON_NLP_PORT || '5001', 10),
};

export default config;
