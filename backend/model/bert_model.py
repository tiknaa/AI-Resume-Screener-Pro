from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')

def compute_similarity(resume_text, job_embedding):
    emb1 = model.encode(resume_text, convert_to_tensor=True)
    score = util.cos_sim(emb1, job_embedding)
    return float(score[0][0]) * 100
