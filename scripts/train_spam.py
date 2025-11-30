# Placeholder: Train a spam/ham SVM and save to backend/models/spam_model.joblib
# You can plug in your dataset here (subject+body -> label).

import joblib
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC

X = [
    "You WIN money urgent reward 100% free",
    "Please schedule a meeting for Friday",
    "Cheap viagra now",
    "Attach the report and submit by Monday",
]
y = [1, 0, 1, 0]  # 1=spam, 0=ham

clf = Pipeline([
    ("tfidf", TfidfVectorizer(max_features=20000, ngram_range=(1,2), stop_words="english")),
    ("svm", LinearSVC())
])
clf.fit(X, y)
joblib.dump(clf, "../backend/models/spam_model.joblib")
print("Saved spam model to backend/models/spam_model.joblib")
