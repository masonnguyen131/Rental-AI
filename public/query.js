const fs = require('fs');
const path = require('path');
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { OpenAIEmbeddings } = require("@langchain/openai");
require('dotenv').config();

// File path to properties.json
const DATA_FILE = path.join(__dirname, '../data/properties.json');

// Initialize the Vector Store
async function initializeVectorStore() {
  const properties = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  // Prepare text representations and metadata
  const propertyTexts = properties.map(
    (property) =>
      `${property.formattedAddress}. ${property.description}. ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms, $${property.price}.`
  );

  const metadata = properties.map((property) => ({
    id: property.id,
    price: property.price, // Add rent/price
    bedrooms: property.bedrooms, // Add bedrooms
    latitude: property.latitude,
    longitude: property.longitude
  }));

  const embeddingsModel = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });

  return MemoryVectorStore.fromTexts(propertyTexts, metadata, embeddingsModel);
}

// Perform Similarity Search
async function queryProperties(userQuery, k = 5) {
  try {
    const vectorStore = await initializeVectorStore();
    const results = await vectorStore.similaritySearch(userQuery, k); // Top `k` results
    return results;
  } catch (error) {
    console.error('Error querying properties:', error);
    throw error;
  }
}

module.exports = { queryProperties };
