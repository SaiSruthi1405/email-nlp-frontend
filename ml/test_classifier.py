from classifier import classify_email

print(classify_email(
    subject="Interview scheduled at Google",
    body="Dear candidate, your interview is confirmed for Monday"
))

print(classify_email(
    subject="Win a free iPhone!!!",
    body="Click here now to claim your prize"
))