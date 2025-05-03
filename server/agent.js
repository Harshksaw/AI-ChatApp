import { ChatAnthropic } from "@langchain/anthropic";
import { createAgent } from "@langchain/agents";
import data from "./data.js";

import { z } from zod
import { vectorStore, addYTVideoToVectorStore } from './embeddings.js'


const video1 = data[0]
await addYTVideoToVectorStore(video1)




//retriev the most relevant chunks



const retrieverTool = tool(async () => {
    console.log("Retrieving docs for query: -----------")
    console.log(query)
    const retrievedDocs = await vectorStore.similaritySearch(query, 3,
        { video_id }
    )

    const serializedDocs = retrievedDocs.map((doc) => doc.pageContent).join('\n\n')
    return serializedDocs


}, 
{
    name: 'retriever',
    description: 'retrieves the most relevant chunks from the video transcript of a youtube video',
    schema: z.object({
        query: z.string(),
    }),
    
})


const chunks = await splitter.splitText(docs)
const llm = new ChatAnthropic({
    modelName: 'claude-3-7-sonnet-latest',
})


const agent = createAgent({
    llm, tools: [retrieverTool
    ],
    checkpointer
});

const result = await agent.invoke({
    messages: [
        {
            role: 'user',
            content: 'what is the finish time of Norris'
        }
    ],

}, {
    configurable: { thread_id: 1 },
})

