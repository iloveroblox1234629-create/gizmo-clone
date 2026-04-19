#!/usr/bin/env python3
import sys
import json
import subprocess

def extract_text(file_path):
    try:
        result = subprocess.run(
            ['python3', '-c', f'''
import sys
try:
    import PyPDF2
    with open("{file_path}", "rb") as f:
        reader = PyPDF2.PdfReader(f)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        print(text)
except ImportError:
    try:
        import pdfplumber
        with pdfplumber.open("{file_path}") as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() or ""
            print(text)
    except:
        print("ERROR: No PDF library available", file=sys.stderr)
        sys.exit(1)
'''],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            return None, result.stderr
        return result.stdout, None
    except Exception as e:
        return None, str(e)

if __name__ == '__main__':
    file_path = sys.argv[1]
    text, error = extract_text(file_path)
    if error:
        print(json.dumps({'error': error}))
    else:
        print(json.dumps({'text': text}))