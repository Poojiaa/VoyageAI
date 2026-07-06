import os
import chromadb
from langchain_chroma import Chroma
from app.services.openai_service import get_embedding_model

CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "chroma_data")

def get_chroma_client():
    """Returns a persistent ChromaDB client."""
    return chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)

def get_vectorstore(collection_name: str) -> Chroma:
    """
    Returns a LangChain Chroma vectorstore for a specific collection.
    """
    embedding_model = get_embedding_model()
    
    # If embeddings not available (e.g. HuggingFace/sentence-transformers not installed)
    if not embedding_model:
        return None
        
    client = get_chroma_client()
    
    return Chroma(
        client=client,
        collection_name=collection_name,
        embedding_function=embedding_model,
    )

def query_collection(collection_name: str, query: str, k: int = 3):
    """
    Query a specific collection and return the top k documents.
    """
    vs = get_vectorstore(collection_name)
    if not vs:
        return []
    
    try:
        results = vs.similarity_search(query, k=k)
        return [doc.page_content for doc in results]
    except Exception as e:
        print(f"Error querying ChromaDB collection {collection_name}: {e}")
        return []
