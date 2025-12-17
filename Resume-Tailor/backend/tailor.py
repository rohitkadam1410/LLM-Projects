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

class AnalysisResult(BaseModel):
    sections: List[SectionAnalysis]
    initial_score: int
    projected_score: int

def extract_text_from_docx(docx_path: str) -> str:
    doc = Document(docx_path)
    full_text = []
    for para in doc.paragraphs:
        if para.text.strip():
            full_text.append(para.text)
    return '\n'.join(full_text)

def safe_replace_text(paragraph, target: str, replacement: str):
    """
    Attempts to replace 'target' with 'replacement' in the paragraph while preserving formatting.
    Strategy:
    1. Check if 'target' exists in a single run. If so, replace it there.
    2. If not, fallback to paragraph.text replacement but attempt to copy font from the first run of the target.
    """
    if target not in paragraph.text:
        return

    # 1. Try single run replacement
    for run in paragraph.runs:
        if target in run.text:
            run.text = run.text.replace(target, replacement)
            return

    # 2. Fallback: Replace whole paragraph text but try to keep style
    # We will clear the paragraph and add a new run with the replacement text,
    # applying the font/style from the first run (if any).
    # NOTE: This replaces the ENTIRE paragraph content if we do this, which might be too aggressive 
    # if the target is just a SUBSTRING. 
    
    # Better Fallback for Substrings spanning runs:
    # Just do a naive replace on text. This destroys run boundaries for that paragraph.
    # To mitigate "lost font", we capture the first run's font.
    
    style_run = paragraph.runs[0] if paragraph.runs else None
    font_name = style_run.font.name if style_run else None
    font_size = style_run.font.size if style_run else None
    bold = style_run.bold if style_run else None
    italic = style_run.italic if style_run else None
    color = style_run.font.color.rgb if style_run and style_run.font.color else None

    # This operation clears existing runs and creates new ones usually? 
    # Actually python-docx `para.text = ...` preserves the PARAGRAPH style but resets character formatting.
    paragraph.text = paragraph.text.replace(target, replacement)
    
    # Re-apply font to all runs (usually just one now)
    for run in paragraph.runs:
        if font_name: run.font.name = font_name
        if font_size: run.font.size = font_size
        if bold is not None: run.bold = bold
        if italic is not None: run.italic = italic
        if color: run.font.color.rgb = color


def apply_edits_to_docx(docx_path: str, edits: List[Dict[str, str]], output_path: str):
    # Copy original to output
    shutil.copy2(docx_path, output_path)
    doc = Document(output_path)
    
    for edit in edits:
        if isinstance(edit, (dict, object)): 
             # Handle both pydantic and dict
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
                if action == "replace":
                    safe_replace_text(para, target, content)
                elif action == "append":
                     para.add_run(" " + content)
                break 

    doc.save(output_path)

def analyze_gaps(docx_path: str, job_description: str) -> Dict:
    resume_text = extract_text_from_docx(docx_path)
    
    client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

    prompt = f"""
    You are an expert Resume Strategist.
    
    GOAL: 
    Tailor the resume to significantly increase the chances of being shortlisted.
    Analyze the resume SECTION BY SECTION.
    Prioritize "Professional Summary", "Experience", and "Projects".
    
    CONSTRAINTS:
    1. STRICTLY PRESERVE the original file structure. 
    2. Suggest specific text replacements.
    
    SCORING:
    - Assess the initial resume against the JD (0-100).
    - Estimate the projected score after your edits (0-100).
    
    STRATEGIES:
    1. **Gap Analysis**: Find missing keywords for EACH section.
    2. **Experience Enhancement**: Rewrite bullets to include keywords and simple quantification.
    
    OUTPUT FORMAT:
    Return a JSON object:
    {{
        "initial_score": <int>,
        "projected_score": <int>,
        "sections": [
            {{
                "section_name": "<name>",
                "gaps": ["<gap1>", ...],
                "edits": [
                    {{
                        "target_text": "<exact match>",
                        "new_content": "<replacement>",
                        "action": "replace",
                        "rationale": "<reason>"
                    }}
                ]
            }}
        ]
    }}
    
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
        # Return the whole result dict (matches AnalysisResult structure loosely)
        return result
    except json.JSONDecodeError:
        print("Failed to decode JSON from LLM")
        return {"sections": [], "initial_score": 0, "projected_score": 0}

def generate_tailored_resume(docx_path: str, sections: List[Dict]) -> str:
    # Flatten edits from all sections
    all_edits = []
    
    # Handle if sections is actually the AnalysisResult dict or list
    iterable_sections = sections if isinstance(sections, list) else sections.get("sections", [])
    
    for section in iterable_sections:
        # Handle dict vs object
        if isinstance(section, dict):
            if "edits" in section:
                all_edits.extend(section["edits"])
        else:
             all_edits.extend(section.edits)
            
    output_path = docx_path.replace(".docx", "_tailored.docx")
    apply_edits_to_docx(docx_path, all_edits, output_path)
    return output_path

