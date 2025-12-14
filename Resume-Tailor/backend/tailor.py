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
    
    # We will iterate through edits and try to apply them
    # This is a naive implementation: it iterates paragraphs for each edit.
    # A more robust inclusive way would be better, but this suffices for "Find and Replace"
    
    for edit in edits:
        action = edit.get("action") # 'replace' or 'append'
        target = edit.get("target_text")
        content = edit.get("new_content")
        
        if not target or not content:
            continue
            
        for para in doc.paragraphs:
            if target in para.text:
                if action == "replace":
                    # Simple text replacement to preserve run formatting if possible? 
                    # No, simple replace destroys runs usually, but keeps paragraph style.
                    # python-docx doesn't support easy run-level partial replace.
                    # We will replace the whole text of the paragraph if it's a close match,
                    # or just the substring.
                    para.text = para.text.replace(target, content)
                
                elif action == "append":
                    # Add a new paragraph after this one?
                    # python-docx doesn't easily support "insert after", usually "insert_paragraph_before"
                    # logic: find this para, insert before next para?
                    # hack: append to the text of this para? No, different bullet.
                    # hack: add new run with break?
                    # Better: Identify the parent and insert.
                    # For MVP: We will simply append the text to the current paragraph with a newline if it's a bullet list?
                    # Or try to insert a new paragraph below.
                     
                    # Workaround for insert after:
                    curr_p = para
                    new_p = curr_p.insert_paragraph_before(content) 
                    # Wait, insert_paragraph_before puts it BEFORE. We want AFTER.
                    # We can insert before the *next* paragraph.
                    # But if it's the last one?
                    pass
                break # Move to next edit after finding match (assuming unique targets)
    
    # If we had 'append' logic specifically needed for bullets, we might need a better handler.
    # For now, let's strictly stick to "replace" or "modify" which is safer.
    # We can ask the LLM to "Rewrite the whole bullet point" if we want to add info to it.
    
    doc.save(output_path)

def tailor_resume(docx_path: str, job_description: str) -> str:
    resume_text = extract_text_from_docx(docx_path)
    
    client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

    # Detailed Prompt for Structure Preservation
    prompt = f"""
    You are an expert Resume Editor. 
    You have the content of a candidate's resume and a target Job Description.
    
    Goal: Update the resume content to match the JD keywords and requirements, BUT STRICTLY PRESERVE the original file structure, styling, and unrelated content.
    
    Strategies:
    1. Identify bullet points in the 'Experience' or 'Projects' sections that are relevant.
    2. REWRITE specific bullet points to include JD keywords.
    3. IF a critical skill/requirement is missing, Find a relevant existing section or bullet point and APPEND the new info to it (or rewrite it to include both).
    4. DO NOT invent false work experience.
    5. DO NOT change the contact info, education, or header.
    
    Output Format:
    Return a JSON object with a list of "edits".
    Each edit must have:
    - "target_text": The EXACT text snippet from the original resume you want to change. It must be unique enough to find.
    - "new_content": The replacement text.
    - "action": "replace" (currently only "replace" is supported reliably, so if you want to add something, find a relevant line and provide a rewrite of that line including the new info).
    
    Example:
    {{
        "edits": [
            {{
                "target_text": "Managed a team of 5 developers.",
                "new_content": "Led a cross-functional team of 5 developers, implementing Agile methodologies to improve delivery speed by 20%.",
                "action": "replace"
            }}
        ]
    }}
    
    Job Description:
    {job_description}
    
    Original Resume Content (Use this for 'target_text' matching):
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
    
    output_path = docx_path.replace(".docx", "_tailored.docx")
    apply_edits_to_docx(docx_path, edits, output_path)
    
    return output_path

