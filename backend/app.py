from fastapi import FastAPI, UploadFile, File, Form
from database import collection
from utils.parser import extract_text
from utils.preprocess import clean_text
from utils.skills import extract_skills
from model.bert_model import compute_similarity
from utils.bert_skills import get_missing_skills

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS (IMPORTANT for React later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    job_desc: str = Form(...)
):
    text = extract_text(file.file)

    clean_resume = clean_text(text)
    clean_job = clean_text(job_desc)

    score = compute_similarity(clean_resume, clean_job)
    skills = extract_skills(clean_resume)
    job_skills = extract_skills(clean_job)
    missing_skills = get_missing_skills(skills, job_skills)

    data = {
        "filename": file.filename,
        "score": round(score, 2),
        "skills": skills,
        "missing_skills": missing_skills
    }

    result = collection.update_one(
        {"filename": file.filename},
        {"$set": data},
        upsert=True
    )

    # Handle both insert/update
    if result.upserted_id:
        data["_id"] = str(result.upserted_id)
    else:
        existing = collection.find_one({"filename": file.filename})
        data["_id"] = str(existing["_id"])

    return data
@app.get("/candidates")
def get_candidates():
    candidates = list(collection.find())

    for c in candidates:
        c["_id"] = str(c["_id"])  # convert ObjectId to string

    return candidates

