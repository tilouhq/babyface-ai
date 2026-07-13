from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Crédits gratuits offerts à chaque nouvel utilisateur — facilement modifiable via backend/.env
FREE_CREDITS = int(os.environ.get('FREE_CREDITS', '3'))

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("babyface")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    name: str
    age: int
    referral_source: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_base64: Optional[str] = None


class User(BaseModel):
    id: str
    name: str
    age: int
    referral_source: str
    avatar_base64: Optional[str] = None
    credits: int
    created_at: str


class GenerationCreate(BaseModel):
    user_id: str
    gender: Literal["boy", "girl"]
    father_photo_base64: str
    father_age: int
    father_height_cm: int
    mother_photo_base64: str
    mother_age: int
    mother_height_cm: int


class Generation(BaseModel):
    id: str
    user_id: str
    gender: Literal["boy", "girl"]
    father_photo_base64: str
    father_age: int
    father_height_cm: int
    mother_photo_base64: str
    mother_age: int
    mother_height_cm: int
    baby_photo_base64: str
    predicted_height_cm: int
    created_at: str


class GenerationSummary(BaseModel):
    id: str
    gender: Literal["boy", "girl"]
    baby_photo_base64: str
    created_at: str


# ---------------------------------------------------------------------------
# IMAGE GENERATION — fonction isolée et FACILEMENT REMPLAÇABLE.
# Pour changer d'API de génération d'image, remplacez UNIQUEMENT cette fonction.
# Entrées : photo base64 du père, photo base64 de la mère, genre ('boy' | 'girl')
# Sortie  : base64 (png/jpeg) de la photo générée du bébé.
# Implémentation actuelle : Gemini Nano Banana via emergentintegrations.
# ---------------------------------------------------------------------------
async def generate_baby_face(father_photo_b64: str, mother_photo_b64: str, gender: str) -> str:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

    api_key = os.environ['EMERGENT_LLM_KEY']
    gender_word = "boy" if gender == "boy" else "girl"

    prompt = (
        "You are given two photos: the first is the father, the second is the mother. "
        f"Generate a single photorealistic portrait of their future child: a {gender_word} toddler around 2-3 years old. "
        "The child's face must realistically and naturally combine the facial features of both adults: "
        "blend their eye shape and color, nose, mouth, face shape, skin tone and hair color/texture. "
        "Soft studio lighting, plain light neutral background, child looking at the camera with a gentle smile. "
        "Head-and-shoulders framing. Output only the image."
    )

    chat = LlmChat(
        api_key=api_key,
        session_id=f"babyface-{uuid.uuid4()}",
        system_message="You are an expert photorealistic image generator.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    msg = UserMessage(
        text=prompt,
        file_contents=[ImageContent(father_photo_b64), ImageContent(mother_photo_b64)],
    )

    text, images = await chat.send_message_multimodal_response(msg)
    if not images:
        raise RuntimeError(f"No image returned by generation API. Text: {str(text)[:200]}")
    return images[0]["data"]


def strip_data_uri(b64: str) -> str:
    if b64.startswith("data:"):
        return b64.split(",", 1)[1]
    return b64


def midparental_height(father_cm: int, mother_cm: int, gender: str) -> int:
    # Formule de taille mi-parentale (pas d'IA) :
    # garçon : (père + mère + 13) / 2 ; fille : (père + mère - 13) / 2 — arrondi en cm.
    if gender == "boy":
        return round((father_cm + mother_cm + 13) / 2)
    return round((father_cm + mother_cm - 13) / 2)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@api_router.get("/")
async def root():
    return {"message": "BabyFace AI API", "status": "ok"}


@api_router.post("/users", response_model=User)
async def create_user(payload: UserCreate):
    user = User(
        id=str(uuid.uuid4()),
        name=payload.name.strip(),
        age=payload.age,
        referral_source=payload.referral_source.strip(),
        avatar_base64=None,
        credits=FREE_CREDITS,
        created_at=now_iso(),
    )
    await db.users.insert_one(user.model_dump())
    return user


@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="user_not_found")
    return User(**doc)


@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, payload: UserUpdate):
    updates = {}
    if payload.name is not None and payload.name.strip():
        updates["name"] = payload.name.strip()
    if payload.avatar_base64 is not None:
        updates["avatar_base64"] = strip_data_uri(payload.avatar_base64)
    if updates:
        await db.users.update_one({"id": user_id}, {"$set": updates})
    doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="user_not_found")
    return User(**doc)


@api_router.post("/generations", response_model=Generation)
async def create_generation(payload: GenerationCreate):
    user = await db.users.find_one({"id": payload.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="user_not_found")
    if user["credits"] < 1:
        raise HTTPException(status_code=402, detail="insufficient_credits")

    father_b64 = strip_data_uri(payload.father_photo_base64)
    mother_b64 = strip_data_uri(payload.mother_photo_base64)

    try:
        baby_b64 = await generate_baby_face(father_b64, mother_b64, payload.gender)
    except Exception as e:
        logger.error(f"Baby generation failed: {str(e)[:300]}")
        raise HTTPException(status_code=502, detail="generation_failed")

    # NOTE (spec #18) : les photos uploadées ne sont JAMAIS écrites sur disque —
    # elles sont traitées entièrement en mémoire et libérées dès la fin de la requête.
    # Elles ne sont conservées que dans la base (spec #19) au sein de la génération.

    predicted = midparental_height(payload.father_height_cm, payload.mother_height_cm, payload.gender)

    generation = Generation(
        id=str(uuid.uuid4()),
        user_id=payload.user_id,
        gender=payload.gender,
        father_photo_base64=father_b64,
        father_age=payload.father_age,
        father_height_cm=payload.father_height_cm,
        mother_photo_base64=mother_b64,
        mother_age=payload.mother_age,
        mother_height_cm=payload.mother_height_cm,
        baby_photo_base64=baby_b64,
        predicted_height_cm=predicted,
        created_at=now_iso(),
    )

    await db.users.update_one({"id": payload.user_id}, {"$inc": {"credits": -1}})
    await db.generations.insert_one(generation.model_dump())
    return generation


@api_router.get("/generations", response_model=List[GenerationSummary])
async def list_generations(user_id: str):
    # Tri chronologique décroissant : la plus récente en premier (grille type Instagram).
    docs = await db.generations.find(
        {"user_id": user_id},
        {"_id": 0, "id": 1, "gender": 1, "baby_photo_base64": 1, "created_at": 1},
    ).sort("created_at", -1).to_list(500)
    return [GenerationSummary(**d) for d in docs]


@api_router.get("/generations/{generation_id}", response_model=Generation)
async def get_generation(generation_id: str):
    doc = await db.generations.find_one({"id": generation_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="generation_not_found")
    return Generation(**doc)


@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    # Suppression totale du compte : l'utilisateur ET toutes ses générations
    # sont supprimés définitivement de la base.
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1})
    if not user:
        raise HTTPException(status_code=404, detail="user_not_found")
    await db.generations.delete_many({"user_id": user_id})
    await db.users.delete_one({"id": user_id})
    return {"deleted": True, "user_id": user_id}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
