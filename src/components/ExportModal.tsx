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

interface ExportModalProps {
  story: StoryWithChapters;
  coverImage: string | null;
  children: React.ReactNode;
}

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
      const lineHeight = 6;
      const paragraphSpacing = 8;

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

      // Add story content
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");

      for (const chapter of story.chapters) {
        // Add chapter title
        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        const chapterTitle = chapter.title;
        const chapterTitleLines = splitTextToSize(pdf, chapterTitle, contentWidth);
        
        for (const line of chapterTitleLines) {
          if (yPosition > pageHeight - margin - lineHeight) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight + 2;
        }
        yPosition += paragraphSpacing;

        // Add chapter content
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        
        // Split content into paragraphs and handle each paragraph
        const paragraphs = chapter.content.split(/\n\s*\n/);
        
        for (const paragraph of paragraphs) {
          if (paragraph.trim() === "") continue;
          
          yPosition = addTextWithPageBreak(
            pdf, 
            paragraph.trim(), 
            margin, 
            yPosition, 
            contentWidth, 
            lineHeight, 
            pageHeight, 
            margin
          );
          
          yPosition += paragraphSpacing;
        }

        // Add space between chapters
        yPosition += 15;
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
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
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

  //@ts-expect-error - pdf is not typed yet
  const addTextWithPageBreak = (pdf, text: string, x: number, y: number, maxWidth: number, lineHeight: number, pageHeight: number, margin: number): number => {
    const lines = splitTextToSize(pdf, text, maxWidth);
    let currentY = y;

    for (const line of lines) {
      if (currentY > pageHeight - margin - lineHeight) {
        pdf.addPage();
        currentY = margin;
      }
      pdf.text(line, x, currentY);
      currentY += lineHeight;
    }

    return currentY;
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