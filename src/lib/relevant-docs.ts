import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";

export async function getRelevantDocs(userQuery: string, entry: string) {
  const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text:latest",
    baseUrl: process.env.OLLAMA_URL ?? "http://localhost:11434",
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: process.env.QDRANT_URL ?? "http://localhost:6333",
      collectionName: entry,
    },
  );

  const retriever = vectorStore.asRetriever({ k: 4 });

  const docs = await retriever.invoke(userQuery);

  return docs.map((doc) => doc.pageContent).join("\n\n---\n\n");
}
