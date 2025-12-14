import openai
import os
from docx import Document
from typing import List

# Ensure API key is set
# openai.api_key = os.environ.get("OPENAI_API_KEY")

def extract_text_from_docx(docx_path: str) -> str:
    doc = Document(docx_path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return '\n'.join(full_text)

def save_text_to_docx(text: str, output_path: str):
    doc = Document()
    for line in text.split('\n'):
        doc.add_paragraph(line)
    doc.save(output_path)

def tailor_resume(docx_path: str, job_description: str) -> str:
    resume_text = extract_text_from_docx(docx_path)
    
    client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

    prompt = f"""
    You are a professional resume writer.
    
    Job Description:
    {job_description}
    
    Current Resume:
    {resume_text}
    
    Task:
    Rewrite the resume to better match the job description. 
    - Use the same font and formatting as the original resume.
    - Use the same section headers as the original resume.
    - Use the same section order as the original resume.
    - Use the same projects as the original resume.
    - Use keywords from the JD.
    - Highlight relevant experience.
    - Maintain truthfulness (do not invent facts).
    - Return the result as plain text with clear section headers.
    """
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )
    
    tailored_text = response.choices[0].message.content
    
    output_path = docx_path.replace(".docx", "_tailored.docx")
    save_text_to_docx(tailored_text, output_path)
    
    return output_path

