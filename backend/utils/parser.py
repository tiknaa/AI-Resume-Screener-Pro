import re
import fitz


# =========================================================
# EXTRACT TEXT FROM PDF
# =========================================================

def extract_text_from_pdf(file_bytes):

    text = ""

    pdf = fitz.open(
        stream=file_bytes,
        filetype="pdf"
    )

    for page in pdf:
        text += page.get_text()

    return text


# =========================================================
# EXTRACT GITHUB URL FROM VISIBLE PDF TEXT
# =========================================================

def extract_github_url(text):

    pattern = r'(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9_-]+'

    match = re.search(
        pattern,
        text,
        re.IGNORECASE
    )

    if match:

        github_url = match.group(0)

        if not github_url.startswith("http"):
            github_url = "https://" + github_url

        return github_url

    return None


# =========================================================
# EXTRACT GITHUB PROFILE URL FROM PDF EMBEDDED LINKS
# =========================================================

def extract_github_url_from_pdf(pdf_bytes):

    try:

        pdf = fitz.open(
            stream=pdf_bytes,
            filetype="pdf"
        )

        for page in pdf:

            for link in page.get_links():

                url = link.get("uri")

                if not url:
                    continue

                if "github.com/" not in url.lower():
                    continue

                # Remove trailing slash
                url = url.rstrip("/")

                # Match only:
                # https://github.com/username

                pattern = (
                    r'https?://(?:www\.)?github\.com/'
                    r'([A-Za-z0-9_-]+)$'
                )

                match = re.match(
                    pattern,
                    url,
                    re.IGNORECASE
                )

                if match:
                    return url

        return None

    except Exception as e:

        print(
            "❌ Error extracting GitHub URL from PDF:",
            e
        )

        return None

