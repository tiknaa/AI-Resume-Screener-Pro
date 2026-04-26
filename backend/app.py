from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from typing import List
from bson import ObjectId

from database import collection
from utils.parser import extract_text
from utils.preprocess import clean_text
from model.bert_model import compute_similarity
from utils.skill_engine import extract_skills_semantic, get_missing_skills

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ CORS (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # change for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------
# 📤 UPLOAD RESUME
# ------------------------------
@app.post("/upload")
async def upload_resume(
    files: List[UploadFile] = File(...),
    job_desc: str = Form(...)
):
    results = []

    if not job_desc.strip():
        raise HTTPException(status_code=400, detail="Job description is required")

    for file in files:

        # ✅ Validate file type
        if not file.filename.lower().endswith(".pdf"):
            continue  # skip non-pdf files

        try:
            # 📄 Extract text
            text = extract_text(file.file)
        except Exception:
            continue  # skip corrupted files

        clean_resume = clean_text(text)
        clean_job = clean_text(job_desc)

        # 🤖 Similarity (BERT)
        score = compute_similarity(clean_resume, clean_job)

        # 🧠 Skills
        resume_skills = extract_skills_semantic(clean_resume)
        job_skills = extract_skills_semantic(clean_job)

        # ❌ Missing skills
        missing_skills = get_missing_skills(resume_skills, job_skills)

        # 👍 Matched skills
        matched_skills = list(set(resume_skills) & set(job_skills))

        # 💡 Suggestions
        suggestions = []
        if missing_skills:
            suggestions.append(f"Learn: {', '.join(missing_skills[:5])}")

        if score < 40:
            suggestions.append("Improve alignment with job description")
        elif score < 70:
            suggestions.append("Strengthen key required skills")

        feedback = {
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "suggestions": suggestions
        }

        # 📊 Score calculation
        if len(job_skills) == 0:
            skill_match_ratio = 0
        else:
            skill_match_ratio = len(set(resume_skills) & set(job_skills)) / len(job_skills)

        final_score = round((0.7 * score) + (0.3 * skill_match_ratio * 100), 2)

        # 🗂 Data
        data = {
            "filename": file.filename,
            "score": final_score,
            "skills": resume_skills,
            "missing_skills": missing_skills,
            "job_desc": job_desc,
            "timestamp": datetime.now().isoformat(),  # ✅ safe for frontend
            "feedback": feedback,
            "shortlisted": False
        }

        # 🔥 Insert new record
        result = collection.insert_one(data)
        data["_id"] = str(result.inserted_id)

        results.append(data)

    return results


# ------------------------------
# 📥 GET ALL CANDIDATES
# ------------------------------
@app.get("/candidates")
def get_candidates():
    candidates = list(collection.find())

    for c in candidates:
        c["_id"] = str(c["_id"])

    return candidates


# ------------------------------
# 📊 ANALYTICS
# ------------------------------
@app.get("/analytics")
def get_analytics():
    candidates = list(collection.find())

    total = len(candidates)

    if total == 0:
        return {
            "total": 0,
            "avg_score": 0,
            "top_score": 0
        }

    scores = [c["score"] for c in candidates]

    return {
        "total": total,
        "avg_score": round(sum(scores) / total, 2),
        "top_score": max(scores)
    }


# ------------------------------
# 🗑 DELETE ALL
# ------------------------------
@app.delete("/delete_all")
def delete_all():
    result = collection.delete_many({})
    return {"deleted_count": result.deleted_count}


# ------------------------------
# 🗑 DELETE ONE
# ------------------------------
@app.delete("/delete/{id}")
def delete_candidate(id: str):
    result = collection.delete_one({"_id": ObjectId(id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return {"message": "Deleted successfully"}


# ------------------------------
# ⭐ SHORTLIST TOGGLE
# ------------------------------
@app.put("/shortlist/{id}")
def toggle_shortlist(id: str):
    candidate = collection.find_one({"_id": ObjectId(id)})

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    new_status = not candidate.get("shortlisted", False)

    collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"shortlisted": new_status}}
    )

    return {"shortlisted": new_status}


# ------------------------------
# 🔍 FILTER BY SCORE (API)
# ------------------------------
@app.get("/filter")
def filter_candidates(min_score: float = 0):
    candidates = list(collection.find({"score": {"$gte": min_score}}))

    for c in candidates:
        c["_id"] = str(c["_id"])

    return candidates


# ------------------------------
# 📈 TOP SKILLS ANALYTICS
# ------------------------------
@app.get("/top-skills")
def top_skills():
    candidates = list(collection.find())

    skill_count = {}

    for c in candidates:
        for skill in c.get("skills", []):
            skill_count[skill] = skill_count.get(skill, 0) + 1

    return skill_count
