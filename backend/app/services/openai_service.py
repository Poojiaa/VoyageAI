import os
from dotenv import load_dotenv

load_dotenv()

# Use Groq as primary LLM (free, fast), fall back to None
DEFAULT_MODEL = "llama-3.3-70b-versatile"

def get_llm(model_name: str = DEFAULT_MODEL, temperature: float = 0.3):
    """
    Returns an instance of ChatGroq configured with the GROQ_API_KEY.
    If the API key is not present, it returns None and the agents will use fallback logic.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key_here":
        return None

    try:
        from langchain_groq import ChatGroq
        return ChatGroq(
            model=model_name,
            temperature=temperature,
            api_key=api_key
        )
    except ImportError:
        print("langchain-groq not installed. Run: pip install langchain-groq")
        return None


def get_embedding_model():
    """
    Returns a HuggingFaceEmbeddings model (free, runs locally).
    Uses the lightweight all-MiniLM-L6-v2 model for semantic search.
    """
    try:
        from langchain_huggingface import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"}
        )
    except ImportError:
        print("langchain-huggingface not installed. Run: pip install langchain-huggingface sentence-transformers")
        return None
