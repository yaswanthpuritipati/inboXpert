# Placeholder: Train an intent SVM and save to backend/models/intent_model.joblib

import joblib
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC

X = [
    "Can we schedule a meeting this week?",
    "Following up on my previous email",
    "Please attach and submit the report",
    "Could you share the information requested?",
    "Thanks, noted.",
    "This needs escalation ASAP",
]
y = ["schedule_meeting","follow_up","submit_document","request_info","acknowledge","escalate"]

clf = Pipeline([
    ("tfidf", TfidfVectorizer(max_features=20000, ngram_range=(1,2), stop_words="english")),
    ("svm", LinearSVC())
])
clf.fit(X, y)
joblib.dump(clf, "../backend/models/intent_model.joblib")
print("Saved intent model to backend/models/intent_model.joblib")
