from pdf2docx import Converter
from docx2pdf import convert
import pythoncom

def pdf_to_docx(pdf_path: str) -> str:
    docx_path = pdf_path.replace(".pdf", ".docx")
    cv = Converter(pdf_path)
    cv.convert(docx_path, start=0, end=None)
    cv.close()
    return docx_path

def docx_to_pdf(docx_path: str) -> str:
    # Initialize COM library for Windows
    pythoncom.CoInitialize()
    pdf_path = docx_path.replace(".docx", ".pdf")
    convert(docx_path, pdf_path)
    return pdf_path

