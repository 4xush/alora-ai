// Import mammoth for DOCX parsing
import mammoth from 'mammoth';

/**
 * Function to load an external script
 */
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Parse PDF file and extract text
 */
export async function parsePDF(file) {
  try {
    console.log("Parsing PDF with simplified method");

    // Create a placeholder for extracted text
    let extractedText = "";

    try {
      // Load PDF.js from CDN if not already loaded
      if (!window.pdfjsLib) {
        console.log("Loading PDF.js from CDN...");
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js');

        if (!window.pdfjsLib) {
          throw new Error("Failed to load PDF.js");
        }

        console.log("PDF.js loaded successfully");
      }

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Parse PDF using the loaded PDF.js library
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log(`PDF loaded: ${pdf.numPages} pages found`);

      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        extractedText += pageText + '\n\n';
      }

      console.log(`Extracted ${extractedText.length} characters from PDF`);
      return extractedText;
    } catch (error) {
      console.error("PDF.js extraction failed:", error);

      // If PDF.js fails, use a simplified text format as fallback
      extractedText = `Resume uploaded: ${file.name}
Type: ${file.type}
Size: ${Math.round(file.size / 1024)} KB

Note: Text extraction failed. Please enter your information manually below.`;

      return extractedText;
    }
  } catch (error) {
    console.error("Error in PDF parsing:", error);
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

/**
 * Parse DOCX file and extract text
 */
export async function parseDOCX(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return value;
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    throw new Error(`DOCX parsing failed: ${error.message}`);
  }
}
