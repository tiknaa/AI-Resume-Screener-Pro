import re

SKILLS = [
    "python", "java", "c++",
    "machine learning", "deep learning",
    "sql", "mysql", "mongodb",
    "react", "node",
    "frontend", "backend",
    "full stack",
    "dbms"
]

def extract_skills(text):
    text = text.lower()
    found = []

    for skill in SKILLS:
        # match whole words (important)
        if re.search(r'\b' + re.escape(skill) + r'\b', text):
            found.append(skill)

    return list(set(found))
