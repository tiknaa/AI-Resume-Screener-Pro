import re
from datetime import datetime
# 🎓 Extract CGPA or Percentage
def extract_cgpa(text):
    text = text.lower()

    # CGPA pattern
    match = re.search(r'(cgpa|gpa)[^\d]*(\d\.\d{1,2})', text)
    
    if match:
        cgpa = float(match.group(2))

        # ✅ VALID RANGE CHECK
        if 5 <= cgpa <= 10:
            return cgpa

    return None

def extract_cgpa_requirement(jd):
    jd = jd.lower()

    match = re.search(r'(cgpa|gpa).*?(\d\.\d{1,2})', jd)
    if match:
        return float(match.group(2))

    match = re.search(r'(percentage|marks|score)[^\d]*(\d{2})\s*%', jd)
    if match:
        return float(match.group(2)) / 10

    return None

# 💼 Internship requirement from JD
def extract_internship_requirement(jd):
    jd = jd.lower()

    keywords = [
        "internship",
        "intern experience",
        "internship experience",
        "summer internship",
        "industrial training",
        "internship exposure",
        "prior internship",
        "intern candidate",
        "apprenticeship", "intern preferred", "internship preferred"
    ]

    return any(keyword in jd for keyword in keywords)


# 📊 Project requirement from JD
def extract_project_requirement(jd):
    jd = jd.lower()

    # Match: "2 projects", "3 academic projects"
    match = re.search(r'(\d+)\s+projects?', jd)

    if match:
        return int(match.group(1))

    # Generic project mention
    if "project" in jd:
        return 1

    return 0

# 🧑‍💻 Experience requirement from JD
def extract_experience_requirement(jd):
    jd = jd.lower()

    # Convert words to numbers
    word_to_num = {
        "one": 1,
        "two": 2,
        "three": 3,
        "four": 4,
        "five": 5,
        "six": 6,
        "seven": 7,
        "eight": 8,
        "nine": 9,
        "ten": 10
    }

    # Numeric patterns
    patterns = [
        r'(\d+)\+?\s*years? of experience',
        r'(\d+)\+?\s*years? experience',
        r'(\d+)\s*or more years'
    ]

    for pattern in patterns:
        match = re.search(pattern, jd)

        if match:
            return int(match.group(1))

    # Word patterns (five years, seven years)
    for word, num in word_to_num.items():
        if f"{word} or more years" in jd:
            return num

        if f"{word} years of experience" in jd:
            return num

    return 0

def extract_degree_requirement(jd):
    jd = jd.lower()

    degrees = [
        "bachelor",
        "b.tech",
        "btech",
        "computer science",
        "information technology",
        "software engineering",
        "degree", "bachelor's degree", "bachelors degree"
    ]

    return any(degree in jd for degree in degrees)


# 💼 Internship detection
def detect_internship(text):
    text = text.lower()

    keywords = [
        "intern", "internship", "trainee",
        "summer intern", "industrial training",
        "apprentice"
    ]

    return any(word in text for word in keywords)


# 📊 Count projects
# 📊 Smart project detection
def count_projects(text):
    text = text.lower()

    # Project-related action keywords
    keywords = [
        "project",
        "developed",
        "designed",
        "implemented",
        "engineered",
        "created",
        "built",
        "architecture",
        "simulation",
        "platform",
        "system design"
    ]

    count = 0

    for keyword in keywords:
        count += text.count(keyword)

    # Normalize project count
    estimated_projects = count // 2

    # Prevent unrealistic values
    return min(max(estimated_projects, 0), 10)


# 🧑‍💻 Experience detection
def detect_experience(text):
    text = text.lower()

    keywords = [
    "experience",
    "worked",
    "company",
    "role",
    "intern",
    "internship",
    "software engineer",
    "developer",
    "analyst"
    ]

    return any(word in text for word in keywords)

def extract_experience_years(text):
    current_year = datetime.now().year

    # Find year ranges like 2021-2025
    ranges = re.findall(
        r'(20\d{2})\s*(?:-|–|to)\s*(20\d{2}|present|current)',
        text.lower()
    )

    total_years = 0

    for start, end in ranges:
        start = int(start)

        if end in ["present", "current"]:
            end = current_year
        else:
            end = int(end)

        total_years += max(0, end - start)

    return total_years

def detect_degree(text):
    text = text.lower()

    degrees = [
        "b.tech",
        "btech",
        "bachelor",
        "computer science",
        "information technology",
        "software engineering"
    ]

    return any(degree in text for degree in degrees)

