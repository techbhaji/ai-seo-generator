import json
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import google.generativeai as genai

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return FileResponse("static/index.html")

class GenerateRequest(BaseModel):
    keyword: str
    industry: str
    tone: str
    language: str
    api_key: str

@app.post("/api/generate")
def generate_seo_content(req: GenerateRequest):
    if not req.api_key:
        raise HTTPException(status_code=400, detail="API Key is required.")
    genai.configure(api_key=req.api_key)
    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    prompt = f"""You are an expert SEO content strategist. Generate SEO content for keyword: "{req.keyword}" Industry: {req.industry}, Tone: {req.tone}, Language: {req.language}. Return ONLY valid JSON with keys: seo_title, meta_description, blog_outline, lsi_keywords, content_brief"""
    response = model.generate_content(prompt)
    raw = response.text.strip()
    import re
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        return json.loads(match.group())
    return {"error": raw}
