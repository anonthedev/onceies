"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import type { StoryWithChapters } from "@/types/story";
import { useSession } from "next-auth/react";
import { marked } from "marked";

interface ExportModalProps {
  story: StoryWithChapters;
  coverImage: string | null;
  children: React.ReactNode;
}

// Helper function to parse markdown and extract text with formatting info
interface FormattedText {
  text: string;
  isBold: boolean;
  isItalic: boolean;
  isHeading: boolean;
  headingLevel: number;
}

const parseMarkdownText = (markdownText: string): FormattedText[] => {
  const tokens = marked.lexer(markdownText);
  const formattedTexts: FormattedText[] = [];

  for (const token of tokens) {
    if (token.type === 'heading') {
      formattedTexts.push({
        text: token.text,
        isBold: false,
        isItalic: false,
        isHeading: true,
        headingLevel: token.depth
      });
    } else if (token.type === 'paragraph') {
      // For paragraphs, just add the text content directly
      // We'll handle inline formatting with a simpler approach
      const text = token.text || token.raw || '';
      if (text) {
        formattedTexts.push({
          text: text,
          isBold: false,
          isItalic: false,
          isHeading: false,
          headingLevel: 0
        });
      }
    } else if (token.type === 'text') {
      // Handle standalone text tokens
      const text = token.text;
      if (text) {
        formattedTexts.push({
          text: text,
          isBold: false,
          isItalic: false,
          isHeading: false,
          headingLevel: 0
        });
      }
    }
  }

  return formattedTexts;
};

// Helper function to parse inline markdown formatting
const parseInlineFormatting = (text: string): FormattedText[] => {
  const formattedTexts: FormattedText[] = [];
  const currentText = text;
  let lastIndex = 0;
  
  // Find all formatting markers
  const formattingRegex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(__([^_]+)__)|(_([^_]+)_)/g;
  let match;
  
  while ((match = formattingRegex.exec(currentText)) !== null) {
    // Add text before the formatting
    const beforeText = currentText.slice(lastIndex, match.index);
    if (beforeText) {
      formattedTexts.push({
        text: beforeText,
        isBold: false,
        isItalic: false,
        isHeading: false,
        headingLevel: 0
      });
    }
    
    // Add the formatted text
    const formattedText = match[2] || match[4] || match[6] || match[8];
    const isBold = match[1] !== undefined || match[5] !== undefined;
    const isItalic = match[3] !== undefined || match[7] !== undefined;
    
    formattedTexts.push({
      text: formattedText,
      isBold: isBold,
      isItalic: isItalic,
      isHeading: false,
      headingLevel: 0
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after formatting
  const afterText = currentText.slice(lastIndex);
  if (afterText) {
    formattedTexts.push({
      text: afterText,
      isBold: false,
      isItalic: false,
      isHeading: false,
      headingLevel: 0
    });
  }
  
  // If no formatting was found, add the entire text as normal
  if (formattedTexts.length === 0) {
    formattedTexts.push({
      text: text,
      isBold: false,
      isItalic: false,
      isHeading: false,
      headingLevel: 0
    });
  }
  
  return formattedTexts;
};

export default function ExportModal({ story, coverImage, children }: ExportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "epub">("pdf");
  const { data: session } = useSession();

  const handleExport = async () => {
    if (selectedFormat === "pdf") {
      await exportToPDF();
    } else if (selectedFormat === "epub") {
      // EPUB export will be implemented later
      toast.info("EPUB export coming soon!");
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      // Import jsPDF and html2canvas dynamically to avoid SSR issues
      const jsPDF = (await import("jspdf")).default;

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 25;
      const contentWidth = pageWidth - 2 * margin;
      const lineHeight = 8;

      let yPosition = margin;

      // Add title page
      const storyTitle = story?.chapters[0]?.title.replace(/^Chapter \d+:\s*/, "") || "Untitled Story";
      
      // Add cover image if available
      if (coverImage) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = coverImage;
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          const imgData = canvas.toDataURL("image/jpeg");
          const imgAspectRatio = img.width / img.height;
          const imgWidth = contentWidth * 0.7;
          const imgHeight = imgWidth / imgAspectRatio;

          pdf.addImage(imgData, "JPEG", margin + (contentWidth - imgWidth) / 2, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 25;
        } catch (error) {
          console.warn("Failed to add cover image:", error);
        }
      }

      // Add title
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      const titleLines = splitTextToSize(pdf, storyTitle, contentWidth);
      for (const line of titleLines) {
        const titleWidth = pdf.getTextWidth(line);
        pdf.text(line, margin + (contentWidth - titleWidth) / 2, yPosition);
        yPosition += lineHeight + 2;
      }
      yPosition += 20;

      // Add author info if available
      if (session?.user?.name) {
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "italic");
        const authorText = `By ${session?.user?.name}`;
        const authorWidth = pdf.getTextWidth(authorText);
        pdf.text(authorText, margin + (contentWidth - authorWidth) / 2, yPosition);
        yPosition += 25;
      }

      // Add new page for content
      pdf.addPage();
      yPosition = margin;

      // Add story content with markdown formatting
      for (const chapter of story.chapters) {
        // Parse and add chapter content with markdown formatting
        const formattedContent = parseMarkdownText(chapter.content);
        
        for (const formattedText of formattedContent) {
          if (formattedText.isHeading) {
            // Handle headings - start new page for any heading (chapter titles)
            pdf.addPage();
            yPosition = margin;
            
            const fontSize = Math.max(16, 24 - formattedText.headingLevel * 2);
            pdf.setFontSize(fontSize);
            pdf.setFont("helvetica", "bold");
            
            const textLines = splitTextToSize(pdf, formattedText.text, contentWidth);
            for (const line of textLines) {
              if (yPosition > pageHeight - margin - lineHeight) {
                pdf.addPage();
                yPosition = margin;
              }
              pdf.text(line, margin, yPosition);
              yPosition += lineHeight + 2;
            }
            yPosition += 12; // Extra spacing for headings
          } else {
            // Handle paragraph content with inline formatting
            const text = formattedText.text;
            const inlineFormatted = parseInlineFormatting(text);
            
            // Process all inline segments as one continuous paragraph
            let currentLine = "";
            let currentFontSize = 14;
            let currentFontStyle = "normal";
            
            for (const inline of inlineFormatted) {
              // Set font style based on inline formatting
              if (inline.isBold) {
                currentFontSize = 14;
                currentFontStyle = "bold";
              } else if (inline.isItalic) {
                currentFontSize = 14;
                currentFontStyle = "italic";
              } else {
                currentFontSize = 14;
                currentFontStyle = "normal";
              }
              
              pdf.setFontSize(currentFontSize);
              pdf.setFont("helvetica", currentFontStyle);
              
              // Split the inline text into words and process each word
              const words = inline.text.split(" ");
              
              for (const word of words) {
                if (!word) continue;
                
                // Test if adding this word would exceed the line width
                const testLine = currentLine + (currentLine ? " " : "") + word;
                const testWidth = pdf.getTextWidth(testLine);
                
                if (testWidth > contentWidth && currentLine !== "") {
                  // Current line is full, write it and start a new one
                  if (yPosition > pageHeight - margin - lineHeight) {
                    pdf.addPage();
                    yPosition = margin;
                  }
                  pdf.text(currentLine, margin, yPosition);
                  yPosition += lineHeight + 1;
                  currentLine = word;
                } else {
                  // Add to current line
                  currentLine = testLine;
                }
              }
            }
            
            // Write the last line if there's content
            if (currentLine) {
              if (yPosition > pageHeight - margin - lineHeight) {
                pdf.addPage();
                yPosition = margin;
              }
              pdf.text(currentLine, margin, yPosition);
              yPosition += lineHeight + 1;
            }
            
            // Add paragraph spacing
            yPosition += 8;
          }
        }
      }

      // Save the PDF
      const fileName = `${storyTitle.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      pdf.save(fileName);
      
      toast.success("Story exported to PDF successfully!");
      setIsOpen(false);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast.error("Failed to export story to PDF");
    } finally {
      setIsExporting(false);
    }
  };

  //@ts-expect-error - pdf is not typed yet
  const splitTextToSize = (pdf, text: string, maxWidth: number): string[] => {
    // Handle empty or very short text
    if (!text || text.length === 0) {
      return [];
    }

    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      // Skip empty words
      if (!word) continue;
      
      const testLine = currentLine + (currentLine ? " " : "") + word;
      const testWidth = pdf.getTextWidth(testLine);

      if (testWidth > maxWidth && currentLine !== "") {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Story
          </DialogTitle>
          <DialogDescription>
            Download your story in a format that&apos;s perfect for sharing, printing, or reading offline.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedFormat === "pdf" 
                ? "ring-2 ring-purple-500 bg-purple-50" 
                : "hover:bg-gray-50"
            }`}
            onClick={() => setSelectedFormat("pdf")}
          >
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold text-sm">PDF</h3>
              <p className="text-xs text-gray-600 mt-1">
                High-quality print format
              </p>
              <div className="mt-2">
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Available
                </span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md opacity-60 ${
              selectedFormat === "epub" 
                ? "ring-2 ring-purple-500 bg-purple-50" 
                : "hover:bg-gray-50"
            }`}
            onClick={() => setSelectedFormat("epub")}
          >
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold text-sm">EPUB</h3>
              <p className="text-xs text-gray-600 mt-1">
                E-reader compatible
              </p>
              <div className="mt-2">
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  Coming Soon
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 