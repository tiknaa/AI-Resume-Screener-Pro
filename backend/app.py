from datetime import datetime
import os
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from uuid import uuid4
from reportlab.lib import styles
from bson import ObjectId
import asyncio
from model.bert_model import model
from fastapi import BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    ListFlowable,
    ListItem,
    KeepTogether
)
from reportlab.lib.enums import TA_CENTER
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle
)
from database import collection
from utils.parser import extract_text_from_pdf, extract_github_url, extract_github_url_from_pdf
from utils.preprocess import clean_text
from model.bert_model import compute_similarity
from utils.skill_engine import extract_skills_semantic, get_missing_skills
from fastapi.middleware.cors import CORSMiddleware
from utils.feature_extractor import (
    detect_degree,
    extract_cgpa,
    detect_internship,
    count_projects,
    detect_experience,
    extract_degree_requirement,
    extract_internship_requirement,
    extract_project_requirement,
    extract_experience_requirement,
    extract_cgpa_requirement,
    extract_experience_years,
)
from utils.github_analyzer import (
    analyze_github_profile,
    calculate_github_score,
    analyze_repository_relevance,
    analyze_repository_semantic_relevance,
    calculate_github_overall_score
)

app = FastAPI()

progress_status = {
    "total": 0,
    "processed": 0,
    "status": "idle"
}

# ✅ CORS (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # change for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def process_file(file, job_embedding, job_desc, job_skills, cgpa_required, internship_required, project_required, experience_required, degree_required):
    print("📄 Processing file:", file.filename)

    if not file.filename.lower().endswith(".pdf"):
        return None

    loop = asyncio.get_running_loop()

    try:
        # ✅ FIX: convert to bytes
        file.file.seek(0)
        pdf_bytes = file.file.read()

        os.makedirs("uploads", exist_ok=True)

        file_path = f"uploads/{file.filename}"

        with open(file_path, "wb") as f:
            f.write(pdf_bytes)

        text = await loop.run_in_executor(
            None, extract_text_from_pdf, pdf_bytes
        )

    except Exception as e:
        print("❌ ERROR in file:", file.filename)
        import traceback
        traceback.print_exc()
        return None

    print("📝 Extracted text length:", len(text) if text else 0)

    if not text:
        return None

    # =========================================================
    # 🧹 CLEAN RESUME TEXT
    # =========================================================

    clean_resume = clean_text(text)[:2000]

    print(
        "🧹 Clean text length:",
        len(clean_resume)
    )

    # =========================================================
    # 🧠 EXTRACT RESUME SKILLS
    # =========================================================

    resume_skills = extract_skills_semantic(text)

    print(
        "🧠 Skills found:",
        resume_skills
    )

    # =========================================================
    # 🔗 GITHUB URL EXTRACTION
    # =========================================================

    # First try extracting GitHub URL from visible PDF text
    github_url = extract_github_url(text)


    # If URL is hidden behind an icon/logo,
    # extract embedded hyperlink from the PDF
    if not github_url:

        github_url = extract_github_url_from_pdf(
            pdf_bytes
        )


    print("🔗 GitHub URL:", github_url)

    # =========================================================
    # 🐙 GITHUB PROFILE ANALYSIS
    # =========================================================

    github_analysis = await analyze_github_profile(
        github_url
    )

    print(
        "🐙 GitHub Analysis:",
        github_analysis
    )

    # =========================================================
    # 🐙 GITHUB SCORE
    # =========================================================

    github_score_data = calculate_github_score(
        github_analysis,
        job_skills
    )

    print(
        "🐙 GitHub Score:",
        github_score_data
    )

    # =========================================================
    # 🐙 GITHUB REPOSITORY RELEVANCE
    # =========================================================

    github_repository_relevance = analyze_repository_relevance(
        github_analysis,
        job_skills
    )

    print(
        "🐙 GitHub Repository Relevance:",
        github_repository_relevance
    )

    # =========================================================
    # 🧠 SEMANTIC GITHUB REPOSITORY MATCHING
    # =========================================================

    github_semantic_relevance = (
        analyze_repository_semantic_relevance(
            github_analysis,
            job_embedding,
            job_skills
        )
    )

    print(
        "🧠 GitHub Semantic Relevance:",
        github_semantic_relevance
    )

    github_overall_score = calculate_github_overall_score(
        github_score_data["profile_score"],
        github_score_data["repository_score"],
        github_score_data["github_skill_match_score"],
        github_semantic_relevance["semantic_relevance_score"]
    )
    print(
        "🐙 GitHub Overall Score:",
        github_overall_score
    )
    

    # Extract features
    cgpa = extract_cgpa(clean_resume)
    if cgpa is not None and cgpa > 10:
        cgpa = cgpa / 10

    # 🎓 CGPA STATUS (NEW)
    cgpa_status = "not specified"

    if cgpa_required is not None:
        if cgpa is None:
            cgpa_status = "not found"
        elif cgpa >= cgpa_required:
            cgpa_status = "above requirement"
        else:
            cgpa_status = "below requirement"

    has_internship = detect_internship(clean_resume)
    projects = min(count_projects(clean_resume), 5)
    experience_years = extract_experience_years(text)
    experience = experience_years > 0
    has_degree = detect_degree(text)

    # 🎓 CGPA SCORING
    cgpa_score = 0

    if cgpa_required is not None:
        if cgpa is None:
            cgpa_score = -3  # partial penalty (missing info)
        elif cgpa >= cgpa_required:
            cgpa_score = +5
        else:
            cgpa_score = -5
    
    # 💼 Internship score
    internship_score = 0

    if internship_required:
        internship_score = +5 if has_internship else -5
    else:
        internship_score = +3 if has_internship else 0


    # 📊 Project score
    project_score = 0

    if project_required > 0:
        if projects >= project_required:
            project_score = +5
        elif projects > 0:
            project_score = +3
        else:
            project_score = -5

    # 💼 Internship status
    if internship_required:
        internship_status = (
            "requirement met"
            if has_internship
            else "requirement not met"
        )
    else:
        internship_status = "not required"


    # 📊 Project status
    if project_required > 0:
        project_status = (
            "requirement met"
            if projects >= project_required
            else "requirement not met"
        )
    else:
        project_status = "not required"

    # 🧑‍💻 Experience status
    if experience_required:
        experience_status = (
            "requirement met"
            if experience_years >= experience_required
            else "requirement not met"
        )
    else:
        experience_status = "not required"

    # 🧑‍💻 Experience score
    experience_score = 0

    if experience_required:
        if experience_years >= experience_required:
            experience_score = +5
        elif experience_years > 0:
            experience_score = +3
        else:
            experience_score = 0

    # 🎓 Degree status
    if degree_required:
        degree_status = (
            "requirement met"
            if has_degree
            else "requirement not met"
        )
    else:
        degree_status = "not required"

    # 🎓 Degree score
    degree_score = 0

    if degree_required:
        degree_score = +5 if has_degree else -5

    # ✅ COMPUTE SCORE (YOU MISSED THIS)
    score = compute_similarity(clean_resume, job_embedding)

    missing_skills = get_missing_skills(resume_skills, job_skills)
    matched_skills = list(set(resume_skills) & set(job_skills))

    # ✅ FEEDBACK
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


    # ✅ FINAL SCORE
    skill_match_ratio = (
        len(set(resume_skills) & set(job_skills)) / len(job_skills)
        if job_skills and len(job_skills) > 0 else 0
    )

    # ---------------------------------------------------------
    # REQUIREMENT SCORE
    # Maximum possible = 25
    # CGPA + Internship + Project + Experience + Degree
    # ---------------------------------------------------------

    requirement_score = (
        cgpa_score +
        internship_score +
        project_score +
        experience_score +
        degree_score
    )

    # Convert requirement score from 25 points to 20%
    requirement_percentage = (
        requirement_score / 25
    ) * 20

    # ---------------------------------------------------------
    # GITHUB SCORE
    # GitHub overall score is already out of 10
    # Convert it into 10% of final score
    # ---------------------------------------------------------

    github_percentage = (
        github_overall_score / 10
    ) * 10

    # ---------------------------------------------------------
    # FINAL SCORE
    #
    # Semantic similarity = 40%
    # Skill matching       = 30%
    # Requirements        = 20%
    # GitHub              = 10%
    # ---------------------------------------------------------

    final_score = round(
        (0.40 * score) +
        (0.30 * skill_match_ratio * 100) +
        requirement_percentage +
        github_percentage,
        2
    )

    final_score = max(
        0,
        min(100, final_score)
    )

    print(
        "📊 Final Score Breakdown:",
        "Semantic =", round(0.40 * score, 2),
        "Skills =", round(0.30 * skill_match_ratio * 100, 2),
        "Requirements =", round(requirement_percentage, 2),
        "GitHub =", round(github_percentage, 2),
        "Final =", final_score
    )

    print("✅ Finished:", file.filename, "Score:", final_score)
    
    if matched_skills:
        strengths = ", ".join(matched_skills[:5])
    
    else:
        strengths = "relevant technical skills"

    weaknesses = (
        ", ".join(missing_skills[:3])
        if missing_skills
        else "no major skill gaps"
    )
    

    ai_summary = (
        f"Candidate possesses {strengths}. "
        f"CGPA is {cgpa if cgpa else 'not specified'}. "
        f"{'Internship experience is available. ' if has_internship else ''}"
        f"{projects} projects were identified in the resume. "
        f"{'Degree requirements are satisfied. ' if has_degree else 'Degree information could not be verified. '}"
        f"Key improvement areas include {weaknesses}. "
        f"{'Recommended for further evaluation.' if final_score >= 60 else 'Requires additional review before shortlisting.'}"
    )
    
    return {
        "filename": file.filename,
        "resume_path": file_path,
        "github_url": github_url,
        "github_analysis": github_analysis,
        "github_score": github_score_data["github_score"],
        "github_skill_matches": github_score_data["github_skill_matches"],
        "github_skill_match_score": github_score_data["github_skill_match_score"],
        "github_repository_score": github_score_data["repository_score"],
        "github_profile_score": github_score_data["profile_score"],
        "github_relevant_repositories": github_repository_relevance["relevant_repositories"],
        "github_relevant_repository_count": github_repository_relevance["relevant_repository_count"],
        "github_repository_relevance_score": github_repository_relevance["repository_relevance_score"],
        "github_semantic_repositories": github_semantic_relevance["repositories"],
        "github_average_similarity": github_semantic_relevance["average_similarity"],
        "github_semantic_relevance_score": github_semantic_relevance["semantic_relevance_score"],
        "score": final_score,
        "skills": resume_skills,
        "missing_skills": missing_skills,
        "job_desc": job_desc,
        "timestamp": datetime.now().isoformat(),
        "feedback": feedback,
        "ai_summary": ai_summary,
        "shortlisted": False,
        "cgpa": cgpa,
        "cgpa_status": cgpa_status,
        "internship": has_internship,
        "projects": projects,
        "experience": experience,
        "experience_years": experience_years,
        "cgpa_required": cgpa_required,
        "internship_status": internship_status,
        "project_status": project_status,
        "internship_required": internship_required,
        "project_required": project_required,
        "experience_required": experience_required,
        "experience_status": experience_status,
        "degree": has_degree,
        "degree_required": degree_required,
        "degree_status": degree_status,
        "semantic_score": round(score, 2),
        "skill_match_score": round(skill_match_ratio * 100, 2),
        "github_overall_score": github_overall_score,
        "cgpa_score": cgpa_score,
        "internship_score": internship_score,
        "project_score": project_score,
        "experience_score": experience_score,
        "degree_score": degree_score,
        "matched_skills": matched_skills
    }


def process_resumes_background(files, job_desc):
    import asyncio
    global progress_status

    progress_status["total"] = len(files)
    progress_status["processed"] = 0
    progress_status["status"] = "processing"
    collection.delete_many({})

    async def run():
        semaphore = asyncio.Semaphore(5)

        clean_job = clean_text(job_desc)[:2000]
        job_embedding = model.encode(clean_job)
        job_skills = extract_skills_semantic(job_desc)
        cgpa_required = extract_cgpa_requirement(job_desc)
        internship_required = extract_internship_requirement(job_desc)
        project_required = extract_project_requirement(job_desc)
        experience_required = extract_experience_requirement(job_desc)
        degree_required = extract_degree_requirement(job_desc)
        

        async def limited_process(file):
            async with semaphore:
                return await process_file(file, job_embedding, job_desc, job_skills, cgpa_required, internship_required, project_required, experience_required, degree_required)

        tasks = [limited_process(file) for file in files]
        results = []

        for task in asyncio.as_completed(tasks):
            result = await task

            if result:
                results.append(result)

            # ✅ UPDATE PROGRESS
            progress_status["processed"] += 1
        
        print("📊 Total processed results:", len(results))
        results = [r for r in results if r is not None]
        print("✅ Valid results:", len(results))

        if results:
            
            collection.insert_many(results)
            print("Inserted into DB")

        progress_status["status"] = "completed"

    # ✅ SAFE execution
    asyncio.run(run())

# ------------------------------
# 📤 UPLOAD RESUME
# ------------------------------
@app.post("/upload")
async def upload_resume(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    job_desc: str = Form(...)
    ):
    if not job_desc.strip():
        raise HTTPException(status_code=400, detail="Job description is required")

    if len(files) > 30:
        raise HTTPException(status_code=400, detail="Max 30 files allowed")

    # 🚀 Start background processing
    background_tasks.add_task(process_resumes_background, files, job_desc)

    return {"message": "Processing started"}



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

@app.get("/progress")
def get_progress():
    return progress_status

@app.get("/resume/{filename}")
async def get_resume(filename: str):

    return FileResponse(
        f"uploads/{filename}",
        media_type="application/pdf"
    )

def delete_file(path):
    try:
        if os.path.exists(path):
            os.remove(path)
            print(f"Deleted: {path}")
    except Exception as e:
        print("Delete Error:", e)

@app.post("/generate-resume")
async def generate_resume(data: dict):

    # =========================================================
    # BASIC INFORMATION
    # =========================================================

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()
    linkedin = data.get("linkedin", "").strip()
    github = data.get("github", "").strip()

    objective = data.get("objective", "").strip()

    education = data.get("education", [])
    if not isinstance(education, list):
        education = []

    # =========================================================
    # SKILLS
    # =========================================================

    skills = data.get("skills", [])

    if not isinstance(skills, list):
        skills = []

    # =========================================================
    # PROJECTS
    # =========================================================

    projects = data.get("projects", [])

    if not isinstance(projects, list):
        projects = []

    # =========================================================
    # INTERNSHIP
    # =========================================================

    internships = data.get("internships", [])

    if not isinstance(internships, list):
        internships = []

    # =========================================================
    # CERTIFICATIONS
    # =========================================================

    certifications = data.get("certifications", [])

    if not isinstance(certifications, list):
        certifications = []

    # =========================================================
    # ACHIEVEMENTS
    # =========================================================

    achievements = data.get("achievements", [])

    if not isinstance(achievements, list):
        achievements = []

    # =========================================================
    # PDF IN MEMORY
    # =========================================================

    pdf_buffer = BytesIO()

    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm
    )

    styles = getSampleStyleSheet()

    # =========================================================
    # RESUME STYLES
    # =========================================================

    name_style = ParagraphStyle(
        "NameStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=22,
        alignment=TA_CENTER,
        spaceAfter=2
    )

    contact_style = ParagraphStyle(
        "ContactStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=11,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#333333"),
        spaceAfter=3
    )

    section_style = ParagraphStyle(
        "SectionStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=13,
        spaceBefore=6,
        spaceAfter=3,
        textColor=colors.black
    )

    body_style = ParagraphStyle(
        "BodyStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=11,
        spaceAfter=2
    )

    project_title_style = ParagraphStyle(
        "ProjectTitleStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=11,
        spaceBefore=3,
        spaceAfter=2
    )

    small_style = ParagraphStyle(
        "SmallStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.8,
        leading=10.5,
        spaceAfter=2
    )

    def add_section_heading(story, title):

        story.append(
            Paragraph(
                title,
                section_style
            )
        )

        story.append(
            HRFlowable(
                width="100%",
                thickness=0.5,
                color=colors.HexColor("#555555"),
                spaceBefore=0,
                spaceAfter=4
            )
        )

    # =========================================================
    # STORY
    # =========================================================

    story = []

    # =========================================================
    # HEADER
    # =========================================================

    if name:
        story.append(
            Paragraph(
                name.upper(),
                name_style
            )
        )

    # =========================================================
    # CONTACT INFORMATION
    # =========================================================

    contact_line_1 = []

    if email:
        contact_line_1.append(email)

    if phone:
        contact_line_1.append(phone)

    if contact_line_1:

        story.append(
            Paragraph(
                " | ".join(contact_line_1),
                contact_style
            )
        )


    contact_line_2 = []

    if linkedin:
        contact_line_2.append(
            f'<link href="{linkedin}" color="#1a73e8">'
            f'<u>LinkedIn</u>'
            f'</link>'
        )

    if github:
        contact_line_2.append(
            f'<link href="{github}" color="#1a73e8">'
            f'<u>GitHub</u>'
            f'</link>'
        )

    if contact_line_2:

        story.append(
            Paragraph(
                " | ".join(contact_line_2),
                contact_style
            )
        )

    story.append(
        HRFlowable(
            width="100%",
            thickness=0.8,
            color=colors.black,
            spaceBefore=2,
            spaceAfter=8
        )
    )

    # =========================================================
    # CAREER OBJECTIVE
    # =========================================================

    if objective:

        add_section_heading(
            story,
            "CAREER OBJECTIVE"
        )

        story.append(
            Paragraph(
                objective,
                body_style
            )
        )

    # =========================================================
    # EDUCATION
    # =========================================================

    if education:

        valid_education = [
            edu for edu in education
            if isinstance(edu, dict)
        ]

        if valid_education:

            add_section_heading(
                story,
                "EDUCATION"
            )

            for edu in valid_education:
                education_story = []

                degree = edu.get("degree", "").strip()
                branch = edu.get("branch", "").strip()
                college = edu.get("college", "").strip()
                cgpa = edu.get("cgpa", "").strip()
                graduation_year = edu.get(
                    "graduationYear", ""
                ).strip()

                # Degree + Branch
                if degree or branch:

                    education_title = " - ".join(
                        value
                        for value in [degree, branch]
                        if value
                    )

                    education_story.append(
                        Paragraph(
                            f"<b>{education_title}</b>",
                            body_style
                        )
                    )

                # College
                if college:

                    education_story.append(
                        Paragraph(
                            college,
                            body_style
                        )
                    )

                # CGPA + Graduation Year
                education_details = []

                if cgpa:
                    education_details.append(
                        f"CGPA: {cgpa}"
                    )

                if graduation_year:
                    education_details.append(
                        graduation_year
                    )

                if education_details:

                    education_story.append(
                        Paragraph(
                            " | ".join(education_details),
                            body_style
                        )
                    )

                if education_story:

                    story.append(
                        KeepTogether(education_story)
                    )

                    story.append(
                        Spacer(1, 4)
                    )

    # =========================================================
    # SKILLS
    # =========================================================

    if skills:

        add_section_heading(
            story,
            "TECHNICAL SKILLS"
        )

        # Group skills into categories

        programming = []
        web = []
        databases = []
        ai_ml = []
        tools = []
        other = []

        for skill in skills:

            skill_lower = skill.lower()

            if skill_lower in [
                "python",
                "java",
                "c++",
                "javascript"
            ]:
                programming.append(skill)

            elif skill_lower in [
                "react",
                "node.js"
            ]:
                web.append(skill)

            elif skill_lower in [
                "sql",
                "mongodb"
            ]:
                databases.append(skill)

            elif skill_lower in [
                "machine learning",
                "deep learning",
                "nlp",
                "tensorflow"
            ]:
                ai_ml.append(skill)

            elif skill_lower in [
                "git",
                "docker"
            ]:
                tools.append(skill)

            else:
                other.append(skill)

        if programming:
            story.append(
                Paragraph(
                    f"<b>Programming:</b> {', '.join(programming)}",
                    small_style
                )
            )

        if web:
            story.append(
                Paragraph(
                    f"<b>Web Technologies:</b> {', '.join(web)}",
                    small_style
                )
            )

        if databases:
            story.append(
                Paragraph(
                    f"<b>Databases:</b> {', '.join(databases)}",
                    small_style
                )
            )

        if ai_ml:
            story.append(
                Paragraph(
                    f"<b>AI / Machine Learning:</b> {', '.join(ai_ml)}",
                    small_style
                )
            )

        if tools:
            story.append(
                Paragraph(
                    f"<b>Tools:</b> {', '.join(tools)}",
                    small_style
                )
            )

        if other:
            story.append(
                Paragraph(
                    f"<b>Other:</b> {', '.join(other)}",
                    small_style
                )
            )

    # =========================================================
    # PROJECTS
    # =========================================================

    if projects:

        add_section_heading(
            story,
            "PROJECTS"
        )

        for project in projects:

            if not isinstance(project, dict):
                continue

            title = str(
                project.get("title", "")
            ).strip()

            description = str(
                project.get("description", "")
            ).strip()

            technologies = str(
                project.get("technologies", "")
            ).strip()

            # Skip completely empty project
            if not title and not description and not technologies:
                continue

            # Temporary container for ONE project
            project_story = []

            # Project title
            if title:

                project_story.append(
                    Paragraph(
                        title,
                        project_title_style
                    )
                )

            # Description
            if description:

                description_lines = description.split("\n")

                for line in description_lines:

                    line = line.strip()

                    if not line:
                        continue

                    # Remove existing bullet if user typed one
                    line = line.lstrip("•- ")

                    project_story.append(
                        Paragraph(
                            f"• {line}",
                            body_style
                        )
                    )

            # Technologies
            if technologies:

                project_story.append(
                    Paragraph(
                        f"<b>Technologies:</b> {technologies}",
                        small_style
                    )
                )

            # Keep this COMPLETE project together
            if project_story:

                story.append(
                    KeepTogether(project_story)
                )

                story.append(
                    Spacer(1, 3)
                )

    # =========================================================
    # INTERNSHIP EXPERIENCE
    # =========================================================

    if internships:

        add_section_heading(
            story,
            "INTERNSHIP EXPERIENCE"
        )

        for internship in internships:

            if not isinstance(internship, dict):
                continue

            company = str(
                internship.get("company", "")
            ).strip()

            role = str(
                internship.get("role", "")
            ).strip()

            duration = str(
                internship.get("duration", "")
            ).strip()

            description = str(
                internship.get("description", "")
            ).strip()

            internship_projects = str(
                internship.get("projects", "")
            ).strip()

            # Skip empty internship
            if not any([
                company,
                role,
                duration,
                description,
                internship_projects
            ]):
                continue

            # Store one complete internship
            internship_story = []

            # Company
            if company:

                internship_story.append(
                    Paragraph(
                        company,
                        project_title_style
                    )
                )

            # Role + Duration
            if role or duration:

                role_duration = ""

                if role:
                    role_duration += f"<b>{role}</b>"

                if duration:

                    if role_duration:
                        role_duration += f" | {duration}"
                    else:
                        role_duration = duration

                internship_story.append(
                    Paragraph(
                        role_duration,
                        body_style
                    )
                )

            # Description
            if description:

                description_lines = description.split("\n")

                for line in description_lines:

                    line = line.strip()

                    if not line:
                        continue

                    line = line.lstrip("•- ")

                    internship_story.append(
                        Paragraph(
                            f"• {line}",
                            body_style
                        )
                    )

            # Projects completed during internship
            if internship_projects:

                internship_story.append(
                    Paragraph(
                        "<b>Projects:</b>",
                        small_style
                    )
                )

                project_lines = internship_projects.split("\n")

                for project in project_lines:

                    project = project.strip()

                    if not project:
                        continue

                    project = project.lstrip("•- ")

                    internship_story.append(
                        Paragraph(
                            f"• {project}",
                            body_style
                        )
                    )

            # Keep complete internship together
            if internship_story:

                story.append(
                    KeepTogether(internship_story)
                )

                story.append(
                    Spacer(1, 4)
                )

    # =========================================================
    # CERTIFICATIONS
    # =========================================================

    if certifications:

        valid_certifications = [
            str(cert).strip()
            for cert in certifications
            if str(cert).strip()
        ]

        if valid_certifications:

            add_section_heading(
                story,
                "CERTIFICATIONS"
            )

            for certification in valid_certifications:

                story.append(
                    Paragraph(
                        f"• {certification}",
                        body_style
                    )
                )
            story.append(
                Spacer(1, 3)
            )

    # =========================================================
    # ACHIEVEMENTS
    # =========================================================

    if achievements:

        valid_achievements = [
            str(achievement).strip()
            for achievement in achievements
            if str(achievement).strip()
        ]

        if valid_achievements:

            add_section_heading(
                story,
                "ACHIEVEMENTS"
            )

            for achievement in valid_achievements:

                story.append(
                    Paragraph(
                        f"• {achievement}",
                        body_style
                    )
                )
            story.append(
                Spacer(1, 3)
            )

    # =========================================================
    # BUILD PDF
    # =========================================================

    doc.build(story)

    pdf_buffer.seek(0)

    # =========================================================
    # SAFE FILE NAME
    # =========================================================

    safe_name = name if name else "Resume"

    safe_name = (
        safe_name
        .replace("/", "_")
        .replace("\\", "_")
        .replace(":", "_")
        .replace("*", "_")
        .replace("?", "_")
        .replace('"', "_")
        .replace("<", "_")
        .replace(">", "_")
        .replace("|", "_")
    )

    safe_name = "_".join(
        safe_name.split()
    )

    filename = f"{safe_name}.pdf"

    # =========================================================
    # RETURN PDF
    # =========================================================

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                f'attachment; filename="{filename}"'
        }
    )


