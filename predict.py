import pickle


with open("phishing_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("tfidf_vectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)


subject = input("Enter Email Subject: ")
body = input("Enter Email Body: ")

email_text = subject + " " + body


X = vectorizer.transform([email_text])
prediction = model.predict(X)[0]

if prediction == "phishing":
    response = (
        " PHISHING DETECTED\n"
        "Action Taken:\n"
        "- Email quarantined\n"
        "- User alerted\n"
        "- Links & attachments blocked"
    )
else:
    response = (
        " SAFE EMAIL\n"
        "Action Taken:\n"
        "- Delivered to inbox\n"
        "- No security action required"
    )


print("\n==============================")
print("Prediction:", prediction.upper())
print(response)
print("==============================\n")
