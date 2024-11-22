const fs = require('fs');
const path = require('path');
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { OpenAIEmbeddings } = require("@langchain/openai");
require('dotenv').config();

// File path to the properties JSON
const DATA_FILE = path.join(__dirname, '../data/properties.json');

// Load rental property data
function loadProperties() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`Data file not found at ${DATA_FILE}`);
  }
  const rawData = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(rawData);
}

async function embedProperties() {
  try {
    const properties = loadProperties();

    // Prepare text representations of each property
    const propertyTexts = properties.map(
      (property) =>
        `${property.formattedAddress}. ${property.description}. ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms, $${property.price}.`
    );

    const metadata = properties.map((property) => ({
      id: property.id,
      price: property.price, // Add rent/price
      bedrooms: property.bedrooms, // Add bedrooms
      latitude: property.latitude,
      longitude: property.longitude,
    }));

    // Initialize OpenAI embeddings model
    const embeddingsModel = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Create an in-memory vector store
    const vectorStore = await MemoryVectorStore.fromTexts(propertyTexts, metadata, embeddingsModel);

    console.log('Embeddings generated and stored in memory.');

    // Perform a similarity search example
    const result = await vectorStore.similaritySearch("2-bedroom condo in Los Angeles under $3000", 1);
    console.log('Similarity Search Result:', result);
  } catch (error) {
    console.error('Error embedding properties:', error);
  }
}

embedProperties();
