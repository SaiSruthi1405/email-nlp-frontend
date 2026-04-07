import os
import re
import pickle
import tensorflow as tf

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

print("Loading ML models...")

spam_model = tf.keras.models.load_model(os.path.join(MODEL_DIR, "spam_model.keras"))
jobs_model = tf.keras.models.load_model(os.path.join(MODEL_DIR, "jobs_model.keras"))
events_model = tf.keras.models.load_model(os.path.join(MODEL_DIR, "events_model.keras"))
important_model = tf.keras.models.load_model(os.path.join(MODEL_DIR, "important_model.keras"))

with open(os.path.join(MODEL_DIR, "spam_vec.pkl"), "rb") as f:
    spam_vec = pickle.load(f)

with open(os.path.join(MODEL_DIR, "jobs_vec.pkl"), "rb") as f:
    jobs_vec = pickle.load(f)

with open(os.path.join(MODEL_DIR, "events_vec.pkl"), "rb") as f:
    events_vec = pickle.load(f)

with open(os.path.join(MODEL_DIR, "important_vec.pkl"), "rb") as f:
    important_vec = pickle.load(f)

print("Spam vocab size:", len(spam_vec.get_vocabulary()))
print("Jobs vocab size:", len(jobs_vec.get_vocabulary()))
print("Events vocab size:", len(events_vec.get_vocabulary()))
print("Important vocab size:", len(important_vec.get_vocabulary()))
print("Models loaded and ready!")


SPAM_THRESHOLD = 0.75
JOBS_THRESHOLD = 0.35
EVENTS_THRESHOLD = 0.35
IMPORTANT_THRESHOLD = 0.50

def clean(text):
    text = str(text).lower()
    # Don't strip digits — OTP, years, dates matter
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# Use the exact thresholds from your successful Colab test
SPAM_THRESHOLD      = 0.75
JOBS_THRESHOLD      = 0.35
EVENTS_THRESHOLD    = 0.55  # Changed from 0.35
IMPORTANT_THRESHOLD = 0.50

def classify_email(subject="", body=""):
    # Truncate to match training distribution (60 words)
    combined = subject + " " + body
    combined = ' '.join(combined.split()[:60])
    text = clean(combined)

    s = spam_model.predict(spam_vec([text]), verbose=0)[0][0]
    j = jobs_model.predict(jobs_vec([text]), verbose=0)[0][0]
    e = events_model.predict(events_vec([text]), verbose=0)[0][0]
    i = important_model.predict(important_vec([text]), verbose=0)[0][0]

    # 👇 ADD THIS
    print(f"[SCORES] spam={s:.3f} | jobs={j:.3f} | events={e:.3f} | important={i:.3f} | subject: {subject[:40]}")

    if s >= SPAM_THRESHOLD:    
        return "spam"
    if j >= JOBS_THRESHOLD:     
        return "jobs"
    if e >= EVENTS_THRESHOLD:   
        return "events"
    if i >= IMPORTANT_THRESHOLD: 
        return "important"
    return "others"

def classify_emails_bulk(email_list):
    results = []

    for email in email_list:
        category = classify_email(
            subject=email.get("subject", ""),
            body=email.get("body", "")
        )
        results.append({**email, "category": category})

    return results