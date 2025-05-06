import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';

const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-large',
});

export const vectorStore = await PGVectorStore.initialize(embeddings, {
  postgresConnectionOptions: {
    connectionString: "postgresql://neondb_owner:npg_WZd8Q6LpXxjn@ep-rough-scene-a6io3hb0-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require",
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

export const addYTVideoToVectorStore = async (videoData) => {
  const { transcript, video_id } = videoData;
  console.log("🚀 ~ addYTVideoToVectorStore ~ transcript:", transcript)
  console.log("🚀 ~ addYTVideoToVectorStore ~ video_id:", video_id)

  const docs = [
    new Document({
      pageContent: transcript,
      metadata: { video_id },
    }),
  ];
  console.log("🚀 ~ addYTVideoToVectorStore ~ docs:", docs)

  // Split the video into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  console.log("🚀 ~ addYTVideoToVectorStore ~ splitter:", splitter)

  const chunks = await splitter.splitDocuments(docs);
  console.log("🚀 ~ addYTVideoToVectorStore ~ chunks:", chunks)

  await vectorStore.addDocuments(chunks);
};
