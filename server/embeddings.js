import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

// Function to test database connection and vector insertion
export const testVectorStoreConnection = async () => {
  try {
    // Create embeddings instance (same as your main app)
    const embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-large',
    });
    
    // Try to initialize the vector store
    const vectorStore = await PGVectorStore.initialize(embeddings, {
      postgresConnectionOptions: {
        connectionString: process.env.DB_URL,
      },
      tableName: 'transcripts',
      columns: {
        idColumnName: 'id',
        vectorColumnName: 'vector',
        contentColumnName: 'content',
        metadataColumnName: 'metadata',
      },
      distanceStrategy: 'cosine',
    });
    
    console.log("✅ Successfully connected to PostgreSQL database");
    
    // Create a test document
    const testDoc = new Document({
      pageContent: "This is a test transcript for database validation.",
      metadata: { video_id: "test_video_123" },
    });
    
    // Add test document to vector store
    await vectorStore.addDocuments([testDoc]);
    console.log("✅ Successfully added test document to vector store");
    
    // Try to retrieve the document to confirm it was added
    const results = await vectorStore.similaritySearch(
      "test transcript", 
      1, 
      { video_id: "test_video_123" }
    );
    
    console.log("✅ Successfully retrieved document from vector store:");
    console.log(results);
    
    // Clean up - remove test data
    // This assumes your PGVectorStore has a delete method or you have direct DB access
    // If not available, you can skip this or implement separately
    
    return {
      success: true,
      message: "Database connection and vector operations successful",
      results
    };
    
  } catch (error) {
    console.error("❌ Error testing vector store connection:", error);
    return {
      success: false,
      message: "Failed to test vector store connection",
      error: error.message
    };
  }
};

// Function to check if the table exists and create it if needed
export const ensureTableExists = async () => {
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DB_URL,
    });
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'transcripts'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.log("Creating transcripts table...");
      
      // This is a simplified version - adjust according to your actual schema
      await pool.query(`
        CREATE EXTENSION IF NOT EXISTS vector;
        
        CREATE TABLE transcripts (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          metadata JSONB,
          vector vector(1536)
        );
      `);
      
      console.log("✅ Created transcripts table");
    } else {
      console.log("✅ Transcripts table already exists");
    }
    
    await pool.end();
    return true;
  } catch (error) {
    console.error("❌ Error ensuring table exists:", error);
    return false;
  }
};

// Usage example
const runTest = async () => {
  console.log("Testing PostgreSQL vector database setup...");
  
  // First ensure the table exists
  await ensureTableExists();
  
  // Then test vector operations
  const result = await testVectorStoreConnection();
  
  if (result.success) {
    console.log("🎉 All tests passed! Your vector database is working correctly.");
  } else {
    console.log("❌ Tests failed. Please check your database configuration.");
  }
};

// You can export this function to run from another file
export { runTest };