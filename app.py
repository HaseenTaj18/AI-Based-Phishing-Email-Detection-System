from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np

app = Flask(__name__)

with open("phishing_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("tfidf_vectorizer.pkl", "rb") as f:
    vectorizer = pickle.load(f)

feature_names = np.array(vectorizer.get_feature_names_out())

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    text = data.get("subject", "") + " " + data.get("body", "")

    X = vectorizer.transform([text])
    prediction = model.predict(X)[0]
    confidence = round(float(np.max(model.predict_proba(X))) * 100, 2)

    tfidf_scores = X.toarray()[0]
    top_idx = tfidf_scores.argsort()[-12:][::-1]

    keywords = [
        {"word": feature_names[i], "score": round(float(tfidf_scores[i]), 4)}
        for i in top_idx if tfidf_scores[i] > 0
    ]

    if prediction == "phishing":
        actions = [
            {"title": "Quarantine Email", "icon": "Q", "desc": "Email isolated from inbox"},
            {"title": "Block Links", "icon": "B", "desc": "All URLs disabled"},
            {"title": "Alert User", "icon": "A", "desc": "User security alert sent"},
            {"title": "SOC Ticket", "icon": "S", "desc": "Incident logged in SOC"}
        ]
    else:
        actions = [
            {"title": "Deliver Email", "icon": "D", "desc": "Email delivered safely"},
            {"title": "Mark Trusted", "icon": "T", "desc": "Sender whitelisted"},
            {"title": "Monitor", "icon": "M", "desc": "Passive monitoring enabled"}
        ]

    return jsonify({
        "prediction": prediction,
        "confidence": confidence,
        "keywords": keywords,
        "actions": actions
    })

if __name__ == "__main__":
    app.run(debug=True)
