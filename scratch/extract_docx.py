import zipfile
import re
import sys

def extract_docx_text(file_path):
    try:
        with zipfile.ZipFile(file_path, 'r') as zf:
            xml_content = zf.read('word/document.xml').decode('utf-8')
            # Basic tag stripping and space collapsing
            text = re.sub(r'<[^>]+>', ' ', xml_content)
            text = re.sub(r'\s+', ' ', text).strip()
            return text
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract.py <path_to_docx>")
    else:
        # Avoid UnicodeEncodeError in Windows terminal
        sys.stdout.reconfigure(encoding='utf-8')
        print(extract_docx_text(sys.argv[1]))
