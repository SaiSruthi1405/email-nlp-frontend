import spacy
import PyPDF2
import re
from spacy.matcher import PhraseMatcher
from skillNer.general_params import SKILL_DB
from skillNer.skill_extractor_class import SkillExtractor

print("Loading SkillNER model...")
nlp = spacy.load("en_core_web_lg")
skill_extractor = SkillExtractor(nlp, SKILL_DB, PhraseMatcher)
print("Model ready!")

def extract_text_from_pdf(file):
    text = ""
    reader = PyPDF2.PdfReader(file)
    for page in reader.pages:
        content = page.extract_text()
        if content:
            text += content
    return text

def clean_text(text):
    text = re.sub(r'[•◦▪▸●]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_skills(text):
    text = clean_text(text)
    try:
        annotations = skill_extractor.annotate(text)
        skills = []
        for match in annotations["results"]["full_matches"]:
            skill = match["doc_node_value"].lower().strip()
            if skill not in skills:
                skills.append(skill)
        for match in annotations["results"]["ngram_scored"]:
            skill = match["doc_node_value"].lower().strip()
            if skill not in skills:
                skills.append(skill)
        return skills
    except Exception as e:
        print(f"Skill extraction error: {e}")
        return []