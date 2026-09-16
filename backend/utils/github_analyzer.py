import re
import httpx
from sentence_transformers import util
from model.bert_model import model


# =========================================================
# EXTRACT GITHUB USERNAME
# =========================================================

def get_github_username(github_url):

    if not github_url:
        return None

    pattern = r"github\.com/([A-Za-z0-9_-]+)"

    match = re.search(
        pattern,
        github_url,
        re.IGNORECASE
    )

    if match:
        return match.group(1)

    return None


# =========================================================
# ANALYZE GITHUB PROFILE
# =========================================================

async def analyze_github_profile(github_url):

    # Default result
    result = {
        "github_username": None,
        "github_found": False,
        "public_repos": 0,
        "followers": 0,
        "following": 0,
        "repositories": [],
        "languages": {}
    }

    # Extract username
    username = get_github_username(github_url)

    if not username:
        return result

    result["github_username"] = username

    try:

        async with httpx.AsyncClient() as client:

            # =================================================
            # GET GITHUB PROFILE
            # =================================================

            profile_response = await client.get(
                f"https://api.github.com/users/{username}"
            )

            if profile_response.status_code != 200:

                print(
                    "❌ GitHub profile not found:",
                    username
                )

                return result

            profile_data = profile_response.json()

            result["github_found"] = True

            result["public_repos"] = profile_data.get(
                "public_repos",
                0
            )

            result["followers"] = profile_data.get(
                "followers",
                0
            )

            result["following"] = profile_data.get(
                "following",
                0
            )


            # =================================================
            # GET REPOSITORIES
            # =================================================

            repos_response = await client.get(
                f"https://api.github.com/users/{username}/repos",
                params={
                    "per_page": 100,
                    "sort": "updated"
                }
            )

            if repos_response.status_code != 200:
                return result

            repos = repos_response.json()


            # =================================================
            # ANALYZE REPOSITORIES
            # =================================================

            language_count = {}

            for repo in repos:

                repo_name = repo.get("name")

                language = repo.get("language")

                stars = repo.get(
                    "stargazers_count",
                    0
                )

                forks = repo.get(
                    "forks_count",
                    0
                )

                description = repo.get(
                    "description",
                    ""
                )

                updated_at = repo.get(
                    "updated_at",
                    None
                )


                # Save repository information
                result["repositories"].append({

                    "name": repo_name,

                    "description": description,

                    "language": language,

                    "stars": stars,

                    "forks": forks,

                    "updated_at": updated_at

                })


                # Count programming languages
                if language:

                    language_count[language] = (
                        language_count.get(
                            language,
                            0
                        ) + 1
                    )


            result["languages"] = language_count


            print(
                "🐙 GitHub analysis completed:",
                username
            )


            return result


    except Exception as e:

        print(
            "❌ GitHub analysis error:",
            e
        )

        return result

# =========================================================
# GITHUB SCORING
# =========================================================

def calculate_github_score(github_analysis, job_skills):

    # Default result
    result = {
        "github_score": 0,
        "github_skill_matches": [],
        "github_skill_match_score": 0,
        "repository_score": 0,
        "profile_score": 0
    }

    # -----------------------------------------------------
    # No GitHub profile
    # -----------------------------------------------------

    if not github_analysis:
        return result

    if not github_analysis.get("github_found"):
        return result

    # -----------------------------------------------------
    # PROFILE SCORE
    # Maximum = 1
    # -----------------------------------------------------

    profile_score = 1

    result["profile_score"] = profile_score

    # -----------------------------------------------------
    # REPOSITORY SCORE
    # Maximum = 2
    # -----------------------------------------------------

    public_repos = github_analysis.get(
        "public_repos",
        0
    )

    if public_repos >= 10:
        repository_score = 2

    elif public_repos >= 5:
        repository_score = 1.5

    elif public_repos >= 1:
        repository_score = 1

    else:
        repository_score = 0

    result["repository_score"] = repository_score

    # -----------------------------------------------------
    # LANGUAGE / JOB SKILL MATCHING
    # -----------------------------------------------------

    github_languages = github_analysis.get(
        "languages",
        {}
    )

    github_language_names = {
        language.lower().strip()
        for language in github_languages.keys()
        if language
    }

    normalized_job_skills = {
        skill.lower().strip()
        for skill in job_skills
        if skill
    }

    # -----------------------------------------------------
    # TECHNOLOGY ALIASES
    # -----------------------------------------------------

    aliases = {
        "js": "javascript",
        "node": "node.js",
        "nodejs": "node.js",
        "reactjs": "react",
        "py": "python",
        "cpp": "c++",
        "c plus plus": "c++",
        "ts": "typescript",
        "golang": "go"
    }

    # Normalize GitHub languages
    normalized_github_languages = set()

    for language in github_language_names:

        normalized_language = aliases.get(
            language,
            language
        )

        normalized_github_languages.add(
            normalized_language
        )

    # Normalize job technologies
    normalized_job_technology = set()

    for skill in normalized_job_skills:

        normalized_skill = aliases.get(
            skill,
            skill
        )

        normalized_job_technology.add(
            normalized_skill
        )

    # -----------------------------------------------------
    # FIND EXACT TECHNOLOGY MATCHES
    # -----------------------------------------------------

    github_skill_matches = sorted(
        normalized_github_languages
        &
        normalized_job_technology
    )

    result["github_skill_matches"] = (
        github_skill_matches
    )

    # -----------------------------------------------------
    # SKILL MATCH SCORE
    # Maximum = 3
    # -----------------------------------------------------

    if normalized_job_technology:

        match_ratio = (
            len(github_skill_matches)
            /
            len(normalized_job_technology)
        )

        github_skill_match_score = round(
            match_ratio * 3,
            2
        )

    else:

        github_skill_match_score = 0

    result["github_skill_match_score"] = (
        github_skill_match_score
    )

    # -----------------------------------------------------
    # BASIC GITHUB SCORE
    # Maximum = 6
    # -----------------------------------------------------

    github_score = round(
        profile_score
        +
        repository_score
        +
        github_skill_match_score,
        2
    )

    github_score = min(
        github_score,
        6
    )

    result["github_score"] = github_score

    return result

# =========================================================
# GITHUB REPOSITORY RELEVANCE
# =========================================================

def analyze_repository_relevance(github_analysis, job_skills):

    result = {
        "relevant_repositories": [],
        "relevant_repository_count": 0,
        "repository_relevance_score": 0
    }

    if not github_analysis:
        return result

    if not github_analysis.get("github_found"):
        return result

    repositories = github_analysis.get(
        "repositories",
        []
    )

    if not repositories:
        return result

    # -----------------------------------------------------
    # Normalize job skills
    # -----------------------------------------------------

    normalized_job_skills = {
        skill.lower().strip()
        for skill in job_skills
        if skill
    }

    # Technology aliases
    aliases = {
        "js": "javascript",
        "node": "node.js",
        "nodejs": "node.js",
        "reactjs": "react",
        "py": "python",
        "cpp": "c++",
        "c plus plus": "c++",
        "ts": "typescript",
        "golang": "go"
    }

    normalized_skills = set()

    for skill in normalized_job_skills:

        normalized_skills.add(
            aliases.get(skill, skill)
        )

    # -----------------------------------------------------
    # Analyze every repository
    # -----------------------------------------------------

    for repo in repositories:

        repo_name = repo.get(
            "name",
            ""
        )

        description = repo.get(
            "description",
            ""
        )

        language = repo.get(
            "language",
            ""
        )

        # Combine repository information
        searchable_text = (
            f"{repo_name} "
            f"{description} "
            f"{language}"
        ).lower()

        matched_skills = []

        for skill in normalized_skills:

            # Exact technology/skill matching
            # Prevents false matches such as:
            # java -> javascript
            # react -> reactnative
            pattern = rf"(?<![A-Za-z0-9]){re.escape(skill)}(?![A-Za-z0-9])"

            if re.search(pattern, searchable_text, re.IGNORECASE):

                matched_skills.append(skill)

        # -------------------------------------------------
        # Repository relevance
        # -------------------------------------------------

        if matched_skills:

            relevance_score = min(
                len(matched_skills),
                5
            )

            result["relevant_repositories"].append({

                "name": repo_name,

                "description": description,

                "language": language,

                "matched_skills": sorted(
                    matched_skills
                ),

                "relevance_score": relevance_score,

                "stars": repo.get(
                    "stars",
                    0
                ),

                "forks": repo.get(
                    "forks",
                    0
                )

            })

    # -----------------------------------------------------
    # Count relevant repositories
    # -----------------------------------------------------

    result["relevant_repository_count"] = len(
        result["relevant_repositories"]
    )

    # -----------------------------------------------------
    # Overall repository relevance score
    # -----------------------------------------------------

    count = result["relevant_repository_count"]

    if count >= 5:

        repository_relevance_score = 5

    elif count >= 3:

        repository_relevance_score = 4

    elif count >= 2:

        repository_relevance_score = 3

    elif count >= 1:

        repository_relevance_score = 2

    else:

        repository_relevance_score = 0

    result["repository_relevance_score"] = (
        repository_relevance_score
    )

    return result

# =========================================================
# SEMANTIC GITHUB REPOSITORY MATCHING
# =========================================================

def analyze_repository_semantic_relevance(
    github_analysis,
    job_embedding,
    job_skills
):

    result = {
        "repositories": [],
        "average_similarity": 0,
        "semantic_relevance_score": 0
    }

    # -----------------------------------------------------
    # Validate GitHub analysis
    # -----------------------------------------------------

    if not github_analysis:
        return result

    if not github_analysis.get("github_found"):
        return result

    repositories = github_analysis.get(
        "repositories",
        []
    )

    if not repositories:
        return result

    if job_embedding is None:
        return result

    # -----------------------------------------------------
    # Calculate semantic similarity for every repository
    # -----------------------------------------------------

    for repo in repositories:

        repo_name = repo.get(
            "name",
            ""
        ) or ""

        description = repo.get(
            "description",
            ""
        ) or ""

        language = repo.get(
            "language",
            ""
        ) or ""

        stars = repo.get(
            "stars",
            0
        )

        forks = repo.get(
            "forks",
            0
        )

        # -------------------------------------------------
        # Prepare repository information
        # -------------------------------------------------

        repo_name_clean = repo_name.replace("-", " ")
        repo_name_clean = repo_name_clean.replace("_", " ")

        description_clean = description or "No repository description provided"

        language_clean = language or "Unknown programming language"

        # -------------------------------------------------
        # Job skills
        # -------------------------------------------------

        job_skills_text = ", ".join(
            str(skill).strip()
            for skill in job_skills
            if skill
        )

        # -------------------------------------------------
        # Combine repository + job information
        # -------------------------------------------------

        repository_text = (
            f"Project name: {repo_name_clean}. "
            f"Project description: {description_clean}. "
            f"Programming language: {language_clean}. "
            f"This GitHub repository represents a software "
            f"development project."
        )

        # -------------------------------------------------
        # Generate repository embedding
        # -------------------------------------------------

        repository_embedding = model.encode(
            repository_text,
            convert_to_tensor=True
        )

        # -------------------------------------------------
        # Calculate similarity
        # -------------------------------------------------

        similarity = util.cos_sim(
            repository_embedding,
            job_embedding
        )

        similarity_score = float(
            similarity[0][0]
        )

        similarity_percentage = round(
            max(0, similarity_score) * 100,
            2
        )

        # -------------------------------------------------
        # Classify repository
        # -------------------------------------------------

        if similarity_percentage >= 75:

            relevance = "high"

        elif similarity_percentage >= 60:

            relevance = "medium"

        elif similarity_percentage >= 45:

            relevance = "low"

        else:

            relevance = "not relevant"

        # -------------------------------------------------
        # Store result
        # -------------------------------------------------

        result["repositories"].append({

            "name": repo_name,

            "description": description,

            "language": language,

            "semantic_similarity": similarity_percentage,

            "relevance": relevance,

            "stars": stars,

            "forks": forks

        })

    # -----------------------------------------------------
    # Sort repositories by semantic similarity
    # Highest first
    # -----------------------------------------------------

    result["repositories"].sort(
        key=lambda repo: repo.get(
            "semantic_similarity",
            0
        ),
        reverse=True
    )

    # -----------------------------------------------------
    # Take TOP 3 repositories
    # -----------------------------------------------------

    top_repositories = result["repositories"][:3]

    # -----------------------------------------------------
    # Calculate average similarity using TOP repositories
    # -----------------------------------------------------

    if top_repositories:

        top_similarities = [
            repo["semantic_similarity"]
            for repo in top_repositories
        ]

        average_similarity = round(
            sum(top_similarities)
            /
            len(top_similarities),
            2
        )

    else:

        average_similarity = 0

    result["average_similarity"] = (
        average_similarity
    )

    # -----------------------------------------------------
    # Convert semantic similarity to score
    # Maximum = 5
    # -----------------------------------------------------

    if average_similarity >= 50:

        semantic_relevance_score = 5

    elif average_similarity >= 40:

        semantic_relevance_score = 4

    elif average_similarity >= 35:

        semantic_relevance_score = 3

    elif average_similarity >= 30:

        semantic_relevance_score = 2

    elif average_similarity > 0:

        semantic_relevance_score = 1

    else:

        semantic_relevance_score = 0

    result["semantic_relevance_score"] = (
        semantic_relevance_score
    )

    print(
        "🧠 FINAL SEMANTIC DEBUG:",
        "Average =", average_similarity,
        "Score =", semantic_relevance_score
    )

    return result

# =========================================================
# GITHUB OVERALL SCORE
# =========================================================

def calculate_github_overall_score(
    github_profile_score,
    github_repository_score,
    github_skill_match_score,
    github_semantic_relevance_score
):
    """
    Calculate overall GitHub score out of 10.

    Maximum:
        Profile       = 1
        Repository    = 2
        Skill Match   = 3
        Semantic      = 4

        Total         = 10
    """

    total_score = (
        github_profile_score +
        github_repository_score +
        github_skill_match_score +
        github_semantic_relevance_score
    )

    # Maximum possible score = 1 + 2 + 3 + 4 = 10

    github_overall_score = round(
        total_score,
        2
    )

    github_overall_score = min(
        github_overall_score,
        10
    )

    print(
        "🐙 GitHub Overall Score:",
        github_overall_score
    )

    return github_overall_score
