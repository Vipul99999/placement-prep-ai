"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";
import type { PrepPackDetail, QuestionPageItem } from "@/types/prep";

interface ExportPayload {
  pack: PrepPackDetail;
  questionsByCategory: Record<string, QuestionPageItem[]>;
}

function writeWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 6) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export function DownloadPdfButton({ prepPackId }: { prepPackId: string }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function handleDownload() {
    setLoading(true);
    try {
      const response = await fetch(`/api/prep-packs/${prepPackId}/download`);
      const payload = (await response.json()) as ExportPayload & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to prepare PDF");
      }

      const doc = new jsPDF({
        unit: "mm",
        format: "a4"
      });

      const left = 16;
      const right = 194;
      const width = 178;
      const pageBottom = 284;
      let y = 20;

      function addPage() {
        doc.addPage();
        y = 18;
      }

      function ensureSpace(required = 26) {
        if (y + required > pageBottom) {
          addPage();
        }
      }

      function drawMetricCard(x: number, top: number, label: string, value: string) {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, top, 39, 20, 4, 4, "F");
        doc.setTextColor(72, 89, 95);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(label.toUpperCase(), x + 4, top + 6.5);
        doc.setTextColor(16, 32, 39);
        doc.setFontSize(11);
        doc.text(value, x + 4, top + 14);
      }

      function sectionTitle(title: string, eyebrow?: string) {
        ensureSpace(18);
        if (eyebrow) {
          doc.setTextColor(15, 118, 110);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.text(eyebrow.toUpperCase(), left, y);
          y += 5;
        }
        doc.setTextColor(16, 32, 39);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);
        doc.text(title, left, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
      }

      function softCard(top: number, height: number) {
        doc.setFillColor(255, 250, 244);
        doc.roundedRect(12, top, 186, height, 7, 7, "F");
      }

      doc.setFillColor(16, 32, 39);
      doc.roundedRect(12, 12, 186, 54, 9, 9, "F");
      doc.setFillColor(15, 118, 110);
      doc.circle(174, 24, 18, "F");
      doc.setFillColor(255, 122, 89);
      doc.circle(162, 40, 10, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text("PlacementPrep AI", left, 24);
      doc.setFontSize(15);
      doc.text("Company-wise placement preparation in minutes.", left, 32);
      doc.setFontSize(18);
      doc.text(`${payload.pack.companyName} - ${payload.pack.role}`, left, 43);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(235, 244, 247);
      y = writeWrappedText(doc, payload.pack.analysis.summary, left, 51, 118, 4.8);

      drawMetricCard(16, 70, "Questions", String(payload.pack.totalQuestions));
      drawMetricCard(59, 70, "Days", String(payload.pack.preparationDays));
      drawMetricCard(102, 70, "Difficulty", payload.pack.difficulty);
      drawMetricCard(145, 70, "Status", payload.pack.status);
      y = 100;

      sectionTitle("Skill Breakdown", "Study focus");
      softCard(y - 2, 30);
      doc.setTextColor(16, 32, 39);
      y = writeWrappedText(doc, `Primary: ${payload.pack.analysis.primarySkills.join(", ")}`, left + 4, y + 5, width - 8) + 2;
      y = writeWrappedText(doc, `Secondary: ${payload.pack.analysis.secondarySkills.join(", ")}`, left + 4, y, width - 8) + 2;
      y = writeWrappedText(doc, `Core Subjects: ${payload.pack.analysis.coreSubjects.join(", ")}`, left + 4, y, width - 8) + 10;

      sectionTitle("Roadmap", "Day by day");
      for (const day of payload.pack.roadmap) {
        ensureSpace(28);
        softCard(y - 2, 24);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(16, 32, 39);
        doc.text(`Day ${day.day}: ${day.title}`, left + 4, y + 5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        y = writeWrappedText(doc, `Topics: ${day.topics.join(", ")}`, left + 4, y + 11, width - 8, 5) + 1;
        y = writeWrappedText(doc, `Tasks: ${day.tasks.join(", ")}`, left + 4, y, width - 8, 5) + 7;
      }

      for (const category of payload.pack.categoryPlan) {
        sectionTitle(category.name, `${category.type} - ${category.importance}`);
        y = writeWrappedText(doc, category.reason, left, y, width) + 4;

        const questions = payload.questionsByCategory[category.name] ?? [];
        for (const item of questions) {
          ensureSpace(48);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(12, y - 2, 186, 40, 6, 6, "F");
          doc.setDrawColor(15, 118, 110);
          doc.setLineWidth(0.8);
          doc.line(16, y + 2, 16, y + 32);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(16, 32, 39);
          y = writeWrappedText(doc, item.question.question, 20, y + 4, 150, 5.2);
          doc.setFillColor(240, 249, 255);
          doc.roundedRect(162, y - 9, 26, 8, 4, 4, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(36, 88, 108);
          doc.text(item.question.difficulty, 165, y - 3.5);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(16, 32, 39);
          y = writeWrappedText(doc, `Short: ${item.question.answerShort}`, 20, y + 1, 168, 4.8) + 1;
          y = writeWrappedText(
            doc,
            `Example: ${item.question.example || "No example generated yet."}`,
            20,
            y,
            168,
            4.8
          ) + 7;
        }
      }

      ensureSpace(20);
      doc.setDrawColor(220, 228, 231);
      doc.line(left, y, right, y);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(72, 89, 95);
      doc.text("Generated by PlacementPrep AI for structured placement preparation.", left, y + 8);

      doc.save(`${payload.pack.companyName}-${payload.pack.role}-prep-pack.pdf`);
      showToast({
        title: "PDF downloaded",
        description: "Your branded prep pack has been exported successfully.",
        tone: "success"
      });
    } catch (error) {
      showToast({
        title: "Could not build PDF",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleDownload} variant="secondary" disabled={loading}>
      {loading ? "Building PDF..." : "Download PDF"}
    </Button>
  );
}
