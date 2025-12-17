import openai
import os
import json
import shutil
from docx import Document
from typing import List, Dict

# Ensure API key is set
# openai.api_key = os.environ.get("OPENAI_API_KEY")

from pydantic import BaseModel

class Edit(BaseModel):
    target_text: str
    new_content: str
    action: str
    rationale: str

class SectionAnalysis(BaseModel):
    section_name: str
    gaps: List[str]
    edits: List[Edit]

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
        # handle both dict and Pydantic object (if passed internally)
        if isinstance(edit, dict):
            action = edit.get("action")
            target = edit.get("target_text")
            content = edit.get("new_content")
        else:
            action = edit.action
            target = edit.target_text
            content = edit.new_content
        
        if not target or not content:
            continue
            
        for para in doc.paragraphs:
            if target in para.text:
                replaced_in_run = False
                
                # Default Logic: Try to find target in a single run first
                # This preserves other runs (like bullet symbols)
                if action == "replace":
                    for run in para.runs:
                        if target in run.text:
                            run.text = run.text.replace(target, content)
                            replaced_in_run = True
                            break
                
                # Fallback: If target spans runs or check failed
                if not replaced_in_run and action == "replace":
                    # Capture font from the "main" run (likely not the bullet)
                    keep_font_name = None
                    keep_font_size = None
                    
                    if para.runs:
                        # Heuristic: If 1st run is short (symbol?), take 2nd run's font
                        # This assumes PDF conversion: Run1=Bullet, Run2=Text
                        ref_run = para.runs[0]
                        if len(para.runs) > 1 and len(ref_run.text.strip()) <= 1:
                             ref_run = para.runs[1]
                             
                        keep_font_name = ref_run.font.name
                        keep_font_size = ref_run.font.size

                    para.text = para.text.replace(target, content)
                    
                    for run in para.runs:
                        if keep_font_name:
                            run.font.name = keep_font_name
                        if keep_font_size:
                            run.font.size = keep_font_size
                            
                elif action == "append":
                     # Append logic remains simple for now
                     para.add_run(" " + content)
                     
                break 

    doc.save(output_path)

def analyze_gaps(docx_path: str, job_description: str) -> List[Dict]:
    resume_text = extract_text_from_docx(docx_path)
    
    client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

    # Detailed Prompt for Structure Preservation & ATS Enhancement
    prompt = f"""
    You are an expert Resume Strategist and ATS Optimizer.
    You have the content of a candidate's resume and a target Job Description (JD).
    
    GOAL: 
    Tailor the resume to significantly increase the chances of being shortlisted by ATS systems and recruiters.
    Analyze the resume SECTION BY SECTION.
    
    CONSTRAINTS:
    1. STRICTLY PRESERVE the original file structure. Do not merge sections or change headers.
    2. Suggest specific text replacements.
    
    STRATEGIES:
    1. **Gap Analysis**: Compare the resume against the JD to find missing keywords (hard skills, soft skills, tools) for EACH section.
    2. **Experience Enhancement**: Rewrite existing bullet points to:
       - Include missing JD keywords naturally.
       - Use strong action verbs.
       - Quantify results where possible.
    3. **Projects Enhancement**: Start projects with strong impact statements using JD terminology.
    4. **Font/Style**: The system will handle font preservation, but you must provide the text content.
    
    OUTPUT FORMAT:
    Return a JSON object with a list of "sections".
    Each section object must have:
    - "section_name": e.g. "Summary", "Experience", "Projects", "Education", "Skills"
    - "gaps": A list of STRINGS describing missing keywords or concepts in this section based on the JD.
    - "edits": A list of edit objects, where each edit has:
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
        sections = result.get("sections", [])
    except json.JSONDecodeError:
        print("Failed to decode JSON from LLM")
        sections = []
        
    return sections

def generate_tailored_resume(docx_path: str, sections: List[Dict]) -> str:
    # Flatten edits from all sections
    all_edits = []
    for section in sections:
        if "edits" in section:
            all_edits.extend(section["edits"])
            
    output_path = docx_path.replace(".docx", "_tailored.docx")
    apply_edits_to_docx(docx_path, all_edits, output_path)
    return output_path

