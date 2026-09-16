import re
from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')

# 🔥 Skill knowledge base (expand later)
SKILL_DB = [
    # Programming
    "python", "java", "c++", "javascript",

    # Databases
    "sql", "mysql", "mongodb", "dbms", "database", "nosql",

    # ML / AI
    "machine learning", "deep learning", "nlp",

    # Data
    "data analysis", "data visualization",

    # Libraries
    "numpy", "pandas", "scikit-learn", "tensorflow", "matplotlib", "seaborn",

    # Tools
    "git", "docker", "jupyter", "colab",

    # Web
    "frontend", "backend", "react", "node", "full stack", "html",
    "html5", "css", "css3", "spring", "spring mvc", "orm","wicket", "gwt","testing", "automation", "networking"
]
# 🔥 Precompute skill embeddings (performance optimization)
SKILL_EMBEDDINGS = {
    skill: model.encode(skill, convert_to_tensor=True)
    for skill in SKILL_DB
}

# 🔥 Skill mapping (important)
SKILL_MAP = {
    "sql": ["dbms", "database"],
    "mysql": ["dbms", "database"],
    "mongodb": ["nosql", "database"],
    "react": ["frontend"],
    "node": ["backend"],
}

# 🔥 Normalize skills
def normalize_skills(skills):
    normalized = set(skills)

    for skill in skills:
        if skill in SKILL_MAP:
            normalized.update(SKILL_MAP[skill])

    return list(normalized)


# 🔥 Extract skills using similarity
def extract_skills_semantic(text):
    text = text.lower()

    found_skills = set()

    # 🔥 Direct keyword match FIRST (fast & accurate)
    for skill in SKILL_DB:
        if re.search(rf"\b{re.escape(skill)}\b", text):
            found_skills.add(skill)

    # 🔥 Then BERT (for semantic understanding)
    text_embedding = model.encode(text, convert_to_tensor=True)

    for skill in SKILL_DB:
        skill_embedding = SKILL_EMBEDDINGS[skill]
        score = util.cos_sim(text_embedding, skill_embedding).item()

        if score > 0.45:
            found_skills.add(skill)

    return sorted(list(found_skills))

# 🔥 Find missing skills intelligently
def get_missing_skills(resume_skills, job_skills):
    resume_skills = normalize_skills(resume_skills)
    job_skills = normalize_skills(job_skills)

    missing = []

    for job_skill in job_skills:
        matched = False

        for res_skill in resume_skills:
            if job_skill not in SKILL_EMBEDDINGS:
                SKILL_EMBEDDINGS[job_skill] = model.encode(
                    job_skill,
                    convert_to_tensor=True
                )

            if res_skill not in SKILL_EMBEDDINGS:
                SKILL_EMBEDDINGS[res_skill] = model.encode(
                    res_skill,
                    convert_to_tensor=True
                )

            emb1 = SKILL_EMBEDDINGS[job_skill]
            emb2 = SKILL_EMBEDDINGS[res_skill]

            score = util.cos_sim(emb1, emb2).item()

            if score > 0.6:  # semantic match threshold
                matched = True
                break

        if not matched:
            missing.append(job_skill)

    return missing
