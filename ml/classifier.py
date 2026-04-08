import os
import re
import json
import tensorflow as tf
from tensorflow.keras.layers import TextVectorization

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# ==============================================================================
# Load Vectorizer from JSON vocab
# ==============================================================================
def load_vectorizer(path):
    with open(path, 'r') as f:
        vocab = json.load(f)
    vec = TextVectorization(
        max_tokens=10000,
        output_sequence_length=100
    )
    vec.set_vocabulary(vocab)
    print(f"  Vocab loaded: {path} ({len(vocab)} tokens)")
    return vec

# ==============================================================================
# Load Models
# ==============================================================================
print("Loading ML models...")
spam_model      = tf.keras.models.load_model(os.path.join(MODEL_DIR, "spam_model.keras"))
jobs_model      = tf.keras.models.load_model(os.path.join(MODEL_DIR, "jobs_model.keras"))
events_model    = tf.keras.models.load_model(os.path.join(MODEL_DIR, "events_model.keras"))
important_model = tf.keras.models.load_model(os.path.join(MODEL_DIR, "important_model.keras"))

print("Loading vectorizers...")
spam_vec      = load_vectorizer(os.path.join(MODEL_DIR, "spam_vocab.json"))
jobs_vec      = load_vectorizer(os.path.join(MODEL_DIR, "jobs_vocab.json"))
events_vec    = load_vectorizer(os.path.join(MODEL_DIR, "events_vocab.json"))
important_vec = load_vectorizer(os.path.join(MODEL_DIR, "important_vocab.json"))

print("All loaded and ready!")

# ==============================================================================
# Thresholds
# ==============================================================================
SPAM_THRESHOLD      = 0.75
JOBS_THRESHOLD      = 0.35
EVENTS_THRESHOLD    = 0.35
IMPORTANT_THRESHOLD = 0.50

# ==============================================================================
# Clean
# ==============================================================================
def clean(text):
    text = str(text).lower()
    text = re.sub(r"\d+", "", text)
    text = re.sub(r"[^a-z\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

# ==============================================================================
# Classify Single Email
# ==============================================================================
def classify_email(subject="", body=""):
    text = clean(subject + " " + body)
    
    # Check if vocab is loaded correctly
    print(f"Vocab size - spam: {len(spam_vec.get_vocabulary())}")
    print(f"Vocab size - jobs: {len(jobs_vec.get_vocabulary())}")
    print(f"Vocab size - events: {len(events_vec.get_vocabulary())}")
    print(f"Vocab size - important: {len(important_vec.get_vocabulary())}")
    
    # Check what tokens model sees
    print(f"Cleaned text: {text[:100]}")
    print(f"Vectorized: {events_vec([text])[0][:20]}")  # first 20 tokens

    s = spam_model.predict(spam_vec([text]), verbose=0)[0][0]
    j = jobs_model.predict(jobs_vec([text]), verbose=0)[0][0]
    e = events_model.predict(events_vec([text]), verbose=0)[0][0]
    i = important_model.predict(important_vec([text]), verbose=0)[0][0]

    print(f"spam={s:.3f}  jobs={j:.3f}  events={e:.3f}  important={i:.3f}")

    if s >= SPAM_THRESHOLD:
        return "spam"
    if j >= JOBS_THRESHOLD:
        return "jobs"
    if e >= EVENTS_THRESHOLD:
        return "events"
    if i >= IMPORTANT_THRESHOLD:
        return "important"
    return "others"

# ==============================================================================
# Classify Bulk Emails
# ==============================================================================
def classify_emails_bulk(email_list):
    results = []
    for email in email_list:
        category = classify_email(
            subject=email.get("subject", ""),
            body=email.get("body", "")
        )
        results.append({**email, "category": category})
    return results