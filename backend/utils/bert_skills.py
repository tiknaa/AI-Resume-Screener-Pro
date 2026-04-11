from sentence_transformers import SentenceTransformer, util

# Load model once
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_missing_skills(resume_skills, jd_skills, threshold=0.6):
    missing = []

    # Encode resume skills once
    resume_embeddings = model.encode(resume_skills, convert_to_tensor=True)

    for jd_skill in jd_skills:
        jd_embedding = model.encode(jd_skill, convert_to_tensor=True)

        # Compute similarity
        similarities = util.cos_sim(jd_embedding, resume_embeddings)

        max_score = similarities.max().item()

        if max_score < threshold:
            missing.append(jd_skill)

    return missing