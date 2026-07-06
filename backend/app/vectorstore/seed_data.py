import os
from langchain_core.documents import Document
from app.vectorstore.chroma import get_vectorstore

TRAVEL_KNOWLEDGE = [
    # Bali
    Document(
        page_content="Bali, Indonesia: Known for its beaches, temples, and rice terraces. Visa on arrival available for many countries. Best time to visit is April to October (dry season). Local currency is Indonesian Rupiah (IDR).",
        metadata={"destination": "Bali", "category": "guide"}
    ),
    Document(
        page_content="Bali Culture: Respect local customs by covering shoulders and knees when visiting temples. Nyepi (Day of Silence) is strictly observed; the airport closes and everyone must stay indoors.",
        metadata={"destination": "Bali", "category": "culture"}
    ),
    Document(
        page_content="Bali Attractions: Tanah Lot Temple (scenic sea temple), Tegallalang Rice Terrace (iconic agricultural landscape in Ubud), Uluwatu Temple (cliffside temple with sunset Kecak fire dance), Seminyak Beach (upscale beach resorts and clubs).",
        metadata={"destination": "Bali", "category": "attraction"}
    ),
    
    # Kyoto, Japan
    Document(
        page_content="Kyoto, Japan: The cultural heart of Japan with over 1,000 temples. Best time to visit is March-May (cherry blossoms) and Sept-Nov (autumn leaves). Visa required before travel for many nationalities.",
        metadata={"destination": "Kyoto", "category": "guide"}
    ),
    Document(
        page_content="Kyoto Etiquette: Do not eat while walking. Always carry some cash as many small temples and shops do not accept cards. Tipping is not customary in Japan.",
        metadata={"destination": "Kyoto", "category": "culture"}
    ),
    Document(
        page_content="Kyoto Attractions: Kinkaku-ji (Golden Pavilion), Fushimi Inari Shrine (famous for thousands of vermilion torii gates), Arashiyama Bamboo Grove (scenic natural forest), Gion District (historic geisha quarter).",
        metadata={"destination": "Kyoto", "category": "attraction"}
    ),
    
    # General Travel Tips
    Document(
        page_content="Budget Travel Tip: Always book flights 3-6 months in advance for international travel. Use public transportation instead of taxis to save money.",
        metadata={"category": "tips"}
    )
]

def seed_database():
    """
    Seeds the ChromaDB with initial travel knowledge.
    """
    vs = get_vectorstore("travel_knowledge")
    if not vs:
        print("Could not initialize vectorstore. Is OPENAI_API_KEY set?")
        return
        
    print("Seeding ChromaDB...")
    
    # Simple check to avoid duplicating data if already seeded
    # We just add it for now. In a real app we'd check if collection is empty.
    try:
        vs.add_documents(TRAVEL_KNOWLEDGE)
        print("Successfully seeded travel knowledge.")
    except Exception as e:
        print(f"Error seeding database: {e}")

if __name__ == "__main__":
    seed_database()
