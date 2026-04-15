import fitz  # PyMuPDF
import os

os.makedirs('public/images', exist_ok=True)

def extract_pdf(pdf_path, prefix):
    if not os.path.exists(pdf_path):
        print(f"Skipping {pdf_path}, not found.")
        return
        
    doc = fitz.open(pdf_path)
    count = 1
    for i in range(len(doc)):
        for img in doc.get_page_images(i):
            xref = img[0]
            pix = fitz.Pixmap(doc, xref)
            if pix.n - pix.alpha > 3: # CMYK: convert to RGB first
                pix = fitz.Pixmap(fitz.csRGB, pix)
            path = f'public/images/{prefix}_{count}.png'
            pix.save(path)
            print(f"Saved {path}")
            pix = None
            count += 1

extract_pdf('../medical field parts.pdf', 'medical')
extract_pdf('../automobile parts images.pdf', 'auto')
extract_pdf('../aerospace product image.pdf', 'aerospace')
extract_pdf('../welding and fabrication.pdf', 'welding')
extract_pdf('../dies jiges and fixture images.pdf', 'dies')
extract_pdf('../industrial automation.pdf', 'automation')
extract_pdf('../machine used precision parts.pdf', 'precision')
