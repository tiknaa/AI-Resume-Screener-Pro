"""
import pdfplumber

def extract_text(file):
    text = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text
"""
def extract_text_from_pdf(file_bytes):
    import fitz
    text = ""

    pdf = fitz.open(stream=file_bytes, filetype="pdf")
    for page in pdf:
        text += page.get_text()

    return text


