import jsPDF from 'jspdf';
import * as nodeEmoji from 'node-emoji';
import emojiRegex from 'emoji-regex';

interface PdfOptions {
  title: string;
  type?: string;
  date?: string;
  description?: string;
  content: {
    purpose?: string;
    instructions?: string;
    sections?: Array<{
      title: string;
      content?: string;
      items?: string[];
    }>;
    markdown?: string;
  };
}

export const generatePDF = (options: PdfOptions) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });
  
  // Set up constants
  const margin = {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20,
    content: 30
  };
  
  const pageWidth = pdf.internal.pageSize.width;
  const contentWidth = pageWidth - margin.content - margin.right;
  
  let yPos = margin.top;
  const regex = emojiRegex();
  
  // Helper function to add wrapped text
  const addWrappedText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = pdf.splitTextToSize(text, contentWidth);
    pdf.text(lines, margin.content, yPos);
    
    const lineHeight = fontSize * 0.5;
    yPos += lines.length * lineHeight;
    
    return yPos;
  };
  
  // Helper function to add checkbox
  const addCheckbox = (checked: boolean = false) => {
    pdf.setDrawColor(60, 60, 60);
    pdf.rect(margin.left, yPos - 4, 4, 4);
    if (checked) {
      pdf.setDrawColor(60, 60, 60);
      pdf.line(margin.left, yPos - 2, margin.left + 4, yPos - 2);
      pdf.line(margin.left + 2, yPos - 4, margin.left + 2, yPos);
    }
  };

  // Helper function to add bullet point
  const addBulletPoint = () => {
    pdf.setFillColor(60, 60, 60);
    pdf.circle(margin.left + 2, yPos - 2, 0.5, 'F');
  };

  // Helper function to add number marker
  const addNumberMarker = (number: string) => {
    pdf.setTextColor(60, 60, 60);
    pdf.setFont('helvetica', 'bold');
    pdf.text(number + '.', margin.left, yPos);
    pdf.setFont('helvetica', 'normal');
  };

  // Helper function to check page break
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pdf.internal.pageSize.height - margin.bottom) {
      pdf.addPage();
      yPos = margin.top;
      return true;
    }
    return false;
  };
  
  // Add header with type and date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  if (options.type) {
    pdf.text(options.type.toUpperCase(), margin.left, 15);
  }
  if (options.date) {
    pdf.text(options.date, pageWidth - margin.right, 15, { align: 'right' });
  }
  
  // Add title
  checkPageBreak(20);
  pdf.setTextColor(0, 0, 0);
  addWrappedText(options.title, 24, true);
  yPos += 10;
  
  // Add description if provided
  if (options.description) {
    checkPageBreak(15);
    pdf.setTextColor(80, 80, 80);
    addWrappedText(options.description, 12);
    yPos += 10;
  }
  
  // Add purpose if provided
  if (options.content.purpose) {
    checkPageBreak(20);
    pdf.setTextColor(0, 0, 0);
    addWrappedText('Purpose', 16, true);
    yPos += 5;
    pdf.setTextColor(60, 60, 60);
    addWrappedText(options.content.purpose);
    yPos += 10;
  }
  
  // Add instructions if provided
  if (options.content.instructions) {
    checkPageBreak(20);
    pdf.setTextColor(0, 0, 0);
    addWrappedText('Instructions', 16, true);
    yPos += 5;
    pdf.setTextColor(60, 60, 60);
    addWrappedText(options.content.instructions);
    yPos += 10;
  }
  
  // Add sections
  if (options.content.sections) {
    options.content.sections.forEach((section, index) => {
      checkPageBreak(25);
      
      // Section title
      pdf.setTextColor(0, 0, 0);
      addWrappedText(section.title, 16, true);
      yPos += 5;
      
      // Section content
      if (section.content) {
        pdf.setTextColor(60, 60, 60);
        addWrappedText(section.content);
        yPos += 5;
      }
      
      // Section items
      if (section.items) {
        section.items.forEach(item => {
          checkPageBreak(10);
          
          // Draw bullet point
          pdf.setFillColor(60, 60, 60);
          pdf.circle(margin.left + 3, yPos - 2, 0.5, 'F');
          
          // Add item text
          pdf.setTextColor(60, 60, 60);
          pdf.text(item, margin.left + 8, yPos);
          yPos += 7;
        });
      }
      
      yPos += 10;
    });
  }
  
  // Add markdown content if provided
  if (options.content.markdown) {
    const lines = options.content.markdown.split('\n');
    let inList = false;
    let listCounter = 1;
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        yPos += 5;
        return;
      }
      
      checkPageBreak(15);
      
      // Process the line based on its type
      if (line === line.toUpperCase() && line.trim().length > 0 && !line.startsWith('☐') && !line.startsWith('•')) {
        pdf.setTextColor(0, 0, 0);
        addWrappedText(line, 20, true);
        yPos += 10;
      }
      // Checkboxes
      else if (line.startsWith('☐ ')) {
        // Draw checkbox
        addCheckbox(false);
        
        // Add text
        pdf.setTextColor(60, 60, 60);
        const text = nodeEmoji.emojify(line.replace('☐ ', '').replace(regex, ''));
        pdf.text(text, margin.left + 8, yPos);
        yPos += 8;
      }
      // Bullet points
      else if (line.startsWith('• ')) {
        // Draw bullet point
        addBulletPoint();
        
        // Add text
        pdf.setTextColor(60, 60, 60);
        const text = nodeEmoji.emojify(line.replace('• ', '').replace(regex, ''));
        pdf.text(text, margin.left + 8, yPos);
        yPos += 8;
      }
      // Numbered steps
      else if (/^\d+\.\s/.test(line)) {
        const [number, ...rest] = line.split('.');
        
        addNumberMarker(number);
        
        // Add text
        const text = nodeEmoji.emojify(rest.join('.').trim().replace(regex, ''));
        pdf.text(text, margin.left + 8, yPos);
        yPos += 8;
      }
      // Regular paragraphs
      else {
        pdf.setTextColor(60, 60, 60);
        const text = nodeEmoji.emojify(line.replace(regex, ''));
        addWrappedText(text);
        yPos += 5;
      }
    });
  }
  
  // Add page numbers
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pdf.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  const filename = `${options.title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  pdf.save(filename);
};