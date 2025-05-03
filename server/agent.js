import { ChatAnthropic } from "@langchain/anthropic";
import { createAgent } from "@langchain/agents";
import data from "./data.js";
import { RecursiveCharacterTextSplitter } from "@langchain/text-splitter";
import { OpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/vectorstores/memory";
import {tools} from "@langchain/tools";
import {z } from zod


const video1 = data[0]

const docs = [new Document({
    pageContent: video1.transcript,
    metadata: { videoId: video1.videoId, title: video1.title }
})]


const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});


const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-large'


})

const vectorStore = new MemoryVectorStore(embeddings)

await vectorStore.addDocuments(docs)


//retriev the most relevant chunks

const retrievedDocs = await vectorStore.similaritySearch('what is this spring in', 5)

const retrieverTool = tool(async()=>{
    console.log("Retrieving docs for query: -----------")
    console.log(query)

},{
    name: 'retriever',
    description: 'retrieves the most relevant chunks from the video transcript of a youtube video',
    schema: z.object({
        query:
    }),
})


const chunks = await splitter.splitText(docs)
const llm = new ChatAnthropic({
    modelName: 'claude-3-7-sonnet-latest',
})


const agent = createAgent({
    llm, tools: [
    ]
});

const result = await agent.invoke({
    messages: [
        {
            role: 'user',
            content: 'what is the finish time of Norris'
        }
    ],

})