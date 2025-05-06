import express from 'express';
import cors from 'cors';
import { agent } from './agent.js';
import { addYTVideoToVectorStore } from './embeddings.js';

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json({ limit: '200mb' }));
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// curl -X POST http://localhost:3000/generate \
// -H "Content-Type: application/json" \
// -d '{
//   "query": "What will people learn from this video?",
//   "video_id": "Pxn276cWKeI",
//   "thread_id": 1
// }'

app.post('/generate', async (req, res) => {
  const { query, thread_id } = req.body;
  console.log(query, thread_id);

  const results = await agent.invoke(
    {
      messages: [
        {
          role: 'user',
          content: query,
        },
      ],
    },
    { configurable: { thread_id } }
  );

  res.send(results.messages.at(-1)?.content);
});

app.post('/webhook', async (req, res) => {
  console.log("🚀 ~ app.post ~ req:", req.body)
  if (Array.isArray(req.body)) {
    await Promise.all(
      req.body.map(async (video) => addYTVideoToVectorStore(video))
    );
  } 
  // If it's a single object 
  else if (req.body && typeof req.body === 'object') {
    await addYTVideoToVectorStore(req.body);
  }
  // Neither an array nor an object
  else {
    console.error('Unexpected webhook payload format:', req.body);
    return res.status(400).send('Invalid payload format. Expected an array or object.');
  }

  res.send('OK');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
