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
    "frontend", "backend", "react", "node", "full stack"
]

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

    found_skills = []

    # 🔥 Direct keyword match FIRST (fast & accurate)
    for skill in SKILL_DB:
        if skill in text:
            found_skills.append(skill)

    # 🔥 Then BERT (for semantic understanding)
    text_embedding = model.encode(text, convert_to_tensor=True)

    for skill in SKILL_DB:
        skill_embedding = model.encode(skill, convert_to_tensor=True)
        score = util.cos_sim(text_embedding, skill_embedding)

        if score > 0.3:
            found_skills.append(skill)

    return list(set(found_skills))

# 🔥 Find missing skills intelligently
def get_missing_skills(resume_skills, job_skills):
    resume_skills = normalize_skills(resume_skills)
    job_skills = normalize_skills(job_skills)

    missing = []

    for job_skill in job_skills:
        matched = False

        for res_skill in resume_skills:
            emb1 = model.encode(job_skill, convert_to_tensor=True)
            emb2 = model.encode(res_skill, convert_to_tensor=True)

            score = util.cos_sim(emb1, emb2)

            if score > 0.6:  # semantic match threshold
                matched = True
                break

        if not matched:
            missing.append(job_skill)

    return missing
