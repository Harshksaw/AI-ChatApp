import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { Document } from 'langchain/document'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import {PGVectorStore} from '@langchain/community/vectorstores/pgvector'


const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-large'


})



// Initialize a PGVectorStore instance for storing and querying embeddings in PostgreSQL
export const vectorStore = await PGVectorStore.initialize(
    embeddings,                  // The embeddings client (e.g., OpenAIEmbeddings) used to generate vectors
    {

      postgresConnectionOptions: {
        connectionString: process.env.DB_URI, 
      },
  
      // Name of the table to read/write vectors and associated data
      tableName: 'youtube_transcripts',
  
      // Mapping of your table’s columns to the store’s expected fields
      columns: {
        idColumnName: 'id',               // Primary key column (unique identifier for each row)
        vectorColumnName: 'vector',       // Column holding the embedding vector (type vector(n))
        contentColumnName: 'content',     // Column with the raw transcript text
        metadataColumnName: 'metadata',   // Column for any JSON metadata (e.g., timestamps, source URL)
      },
  
      // Which distance metric to use when performing similarity searches
      // 'cosine' computes 1 − cosine similarity (good for high-dimensional embedding comparisons)
      distanceStrategy: 'cosine',
    }
  );
  

export const addYTVideoToVectorStore = async (videoData)=>{

    const {transcript = '', videoId = '', title = ''} = videoData


    const docs = [new Document({
        pageContent: transcript,
        metadata: { videoId}
    })]
    
    
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    
    
    const chunks = await splitter.splitDocuments(docs);

    await vectorStore.addDocuments(chunks, {
        metadata: {
            videoId,
            title,
        },
    });
    console.log(`Added ${chunks.length} chunks from video ${videoId} to vector store.`);
    
}