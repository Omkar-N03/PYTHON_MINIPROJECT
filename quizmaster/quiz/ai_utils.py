import google.generativeai as genai
import os
import json
import re
from django.conf import settings

# 1. Load API Key securely from Environment Variables
# Make sure to set GEMINI_API_KEY in your .env file
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

def generate_quiz_questions(topic, num_questions, difficulty, instructions=""):
    generation_config = {
        "temperature": 0.8, # Slightly lowered for more precision
        "top_p": 0.95,
        "max_output_tokens": 8192,
    }

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash", 
        generation_config=generation_config
    )
    
    # 2. Improvised Prompt incorporating user "Details/Instructions"
    prompt = f"""
    Act as an expert teacher and exam creator. 
    Create {num_questions} multiple-choice questions for a quiz.
    
    Target Topic: "{topic}"
    Difficulty Level: {difficulty}
    Specific Instructions/Context: "{instructions}"

    STRICT RULES:
    1. If the "Specific Instructions" field is provided, prioritize that context (e.g., if it says 'focus on dates', ask about dates).
    2. Provide 4 distinct options per question.
    3. Ensure the 'correct' field is the integer index (0-3) of the right answer.
    4. Provide a helpful explanation for why the answer is correct.
    
    RETURN ONLY RAW JSON (No markdown formatting, no code blocks):
    [
        {{
            "text": "Question string",
            "options": ["A", "B", "C", "D"],
            "correct": 0, 
            "type": "multiple_choice",
            "marks": 1,
            "explanation": "Reasoning here"
        }}
    ]
    """

    try:
        response = model.generate_content(prompt)
        raw_text = response.text.strip()

        # Cleaner extraction of JSON
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        return json.loads(raw_text)

    except Exception as e:
        print(f"AI Generation Error: {e}")
        return [] # Return empty list on error for easier handling in views