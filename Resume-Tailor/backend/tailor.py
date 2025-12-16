import openai
import os
import json
import shutil
from docx import Document
from typing import List, Dict

# Ensure API key is set
# openai.api_key = os.environ.get("OPENAI_API_KEY")

def extract_text_from_docx(docx_path: str) -> str:
    doc = Document(docx_path)
    full_text = []
    for para in doc.paragraphs:
        if para.text.strip():
            full_text.append(para.text)
    return '\n'.join(full_text)

def apply_edits_to_docx(docx_path: str, edits: List[Dict[str, str]], output_path: str):
    # Copy original to output
    shutil.copy2(docx_path, output_path)
    doc = Document(output_path)
    
    for edit in edits:
        action = edit.get("action")
        target = edit.get("target_text")
        content = edit.get("new_content")
        
        if not target or not content:
            continue
            
        for para in doc.paragraphs:
            if target in para.text:
                # Capture font attributes from the first run of the paragraph
                # This helps preserve "manual" font settings not tied to the style
                current_font_name = None
                current_font_size = None
                if para.runs:
                    current_font_name = para.runs[0].font.name
                    current_font_size = para.runs[0].font.size

                if action == "replace":
                    # Replace the text
                    # Note: assign to para.text consolidates runs into a single run
                    para.text = para.text.replace(target, content)
                    
                    # Re-apply font attributes to the new run(s)
                    for run in para.runs:
                        if current_font_name:
                            run.font.name = current_font_name
                        if current_font_size:
                            run.font.size = current_font_size
                            
                elif action == "append":
                     # For append, we want to try to insert logic, but for simplicity/safety
                     # we often rewrite. But if we must append:
                     # This logic is less robust in python-docx without careful XML manipulation.
                     # We will fallback to the 'replace' logic which is what the prompt usually guides towards anyway.
                     pass
                     
                break 

    doc.save(output_path)

def analyze_gaps(docx_path: str, job_description: str) -> List[Dict[str, str]]:
    resume_text = extract_text_from_docx(docx_path)
    
    client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

    # Detailed Prompt for Structure Preservation & ATS Enhancement
    prompt = f"""
    You are an expert Resume Strategist and ATS Optimizer.
    You have the content of a candidate's resume and a target Job Description (JD).
    
    GOAL: 
    tailor the resume to significantly increase the chances of being shortlisted by ATS systems and recruiters.
    Focus heavily on the EXPERIENCE and PROJECTS sections.
    
    CONSTRAINTS:
    1. STRICTLY PRESERVE the original file structure. Do not merge sections or change headers.
    2. Suggest specific text replacements.
    
    STRATEGIES:
    1. **Gap Analysis**: Compare the resume against the JD to find missing keywords (hard skills, soft skills, tools).
    2. **Experience Enhancement**: Rewrite existing bullet points to:
       - Include missing JD keywords naturally.
       - Use strong action verbs.
       - Quantify results where possible (even if you have to suggest a placeholder like "[X]%").
    3. **Projects Enhancement**: Start projects with strong impact statements using JD terminology.
    4. **Font/Style**: The system will handle font preservation, but you must provide the text content.
    
    OUTPUT FORMAT:
    Return a JSON object with a list of "edits".
    Each edit must have:
    - "target_text": The EXACT text snippet from the original resume to be replaced. MUST be unique.
    - "new_content": The improved version of that text.
    - "action": "replace" 
    - "rationale": E.g. "Integrated keyword 'Python' and quantified impact to boost ATS score."
    
    Provide as many edits as necessary to fully optimize the resume. Don't be shy—rewrite weak bullets completely if needed.
    
    Job Description:
    {job_description}
    
    Original Resume Content:
    {resume_text}
    """
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        response_format={ "type": "json_object" }
    )
    
    try:
        result = json.loads(response.choices[0].message.content)
        edits = result.get("edits", [])
    except json.JSONDecodeError:
        print("Failed to decode JSON from LLM")
        edits = []
        
    return edits

def generate_tailored_resume(docx_path: str, edits: List[Dict[str, str]]) -> str:
    output_path = docx_path.replace(".docx", "_tailored.docx")
    apply_edits_to_docx(docx_path, edits, output_path)
    return output_path

