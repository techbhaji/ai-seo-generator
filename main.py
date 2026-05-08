import json
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import openai
from openai import OpenAI

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
    
    client = OpenAI(api_key=req.api_key)
    
    prompt = f"""You are an expert AI SEO content generator.
Generate SEO content based on the following parameters:
- Target Keyword: {req.keyword}
- Industry/Niche: {req.industry}
- Tone of Voice: {req.tone}
- Language: {req.language}

Provide a JSON response with exactly the following structure:
{{
  "seo_title": "A highly engaging SEO optimized title (max 60 characters)",
  "meta_description": "A compelling meta description including the keyword (max 155 characters)",
  "blog_outline": "The blog outline in HTML format using standard HTML tags. Need exactly 1 <h1>, 5 <h2>s, and 2 <h3>s under each <h2>.",
  "lsi_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10"],
  "content_brief": {{
    "target_audience": "Description of the target audience",
    "search_intent": "The main search intent (Informational, Transactional, Navigational, or Commercial)",
    "word_count": "Suggested word count"
  }}
}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant designed to output pure JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except openai.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid OpenAI API Key.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
