from fastapi import FastAPI
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

model = SentenceTransformer("all-MiniLM-L6-v2")

@app.post("/analyze")
async def analyze(data: dict):
    resume = data["resume"]
    jd = data["jd"]

    resume_embedding = model.encode([resume])
    jd_embedding = model.encode([jd])

    score = cosine_similarity(resume_embedding, jd_embedding)[0][0]

    return {
        "match_score": round(float(score) * 100, 2)
    }