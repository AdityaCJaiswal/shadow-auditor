package org.auditor.tools;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

import java.io.File;
import java.io.IOException;

/**
 * Utility to generate a realistic sample expense report PDF for testing.
 * Run via: mvn exec:java -Dexec.mainClass="com.auditor.tools.SamplePdfGenerator"
 *
 * Generates: src/main/resources/sample_expenses.pdf
 */
public class SamplePdfGenerator {

    public static void main(String[] args) throws IOException {
        String outputPath = "src/main/resources/sample_expenses.pdf";
        new File("src/main/resources").mkdirs();
        generateSampleExpensePdf(outputPath);
        System.out.println("✔  Sample PDF generated: " + outputPath);
    }

    public static void generateSampleExpensePdf(String outputPath) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.LETTER);
            doc.addPage(page);

            PDType1Font boldFont  = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font plainFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font monoFont  = new PDType1Font(Standard14Fonts.FontName.COURIER);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float y = 730;
                float margin = 50;

                // ── Title ──────────────────────────────────────────────────────
                cs.beginText();
                cs.setFont(boldFont, 16);
                cs.newLineAtOffset(margin, y);
                cs.showText("ACME CORP — Q2 2025 EXPENSE REPORT");
                cs.endText();

                y -= 10;
                cs.beginText();
                cs.setFont(plainFont, 10);
                cs.newLineAtOffset(margin, y);
                cs.showText("Period: April 1, 2025 – June 30, 2025    Prepared by: Finance Dept    Currency: USD");
                cs.endText();

                y -= 20;
                drawLine(cs, margin, y, 560);

                // ── Table header ───────────────────────────────────────────────
                y -= 15;
                cs.beginText();
                cs.setFont(boldFont, 9);
                cs.newLineAtOffset(margin, y);
                cs.showText(String.format("%-12s %-28s %10s %-18s %-12s %-12s",
                        "DATE", "VENDOR", "AMOUNT", "CATEGORY", "DEPT", "INV REF"));
                cs.endText();

                y -= 5;
                drawLine(cs, margin, y, 560);
                y -= 12;

                // ── Transaction rows ───────────────────────────────────────────
                String[][] rows = {
                        // DATE           VENDOR                    AMOUNT      CATEGORY              DEPT         REF
                        {"04/01/2025", "AWS",                    "$12450.00", "Cloud",              "Engineering", "INV-AWS-001"},
                        {"04/15/2025", "AWS",                    "$18200.00", "Cloud",              "Engineering", "INV-AWS-002"},
                        {"04/05/2025", "Zoom",                   "$3200.00",  "SaaS",               "IT",          "INV-ZM-001"},
                        {"04/05/2025", "Zoom",                   "$3200.00",  "SaaS",               "IT",          "INV-ZM-002"},
                        {"04/07/2025", "XYZ Consulting",         "$25000.00", "Professional",       "Finance",     "INV-XYZ-001"},
                        {"04/10/2025", "GitHub",                 "$1200.00",  "SaaS",               "Engineering", "INV-GH-001"},
                        {"04/12/2025", "Delta Airlines",         "$8750.00",  "Travel",             "Sales",       "INV-DL-001"},
                        {"04/14/2025", "Marriott Hotels",        "$4200.00",  "Travel",             "Sales",       "INV-MR-001"},
                        {"04/16/2025", "Datadog",                "$5600.00",  "Monitoring",         "Engineering", "INV-DD-001"},
                        {"04/18/2025", "QuickPay LLC",           "$15000.00", "Vendor",             "Operations",  "INV-QP-001"},
                        {"04/20/2025", "Salesforce",             "$9800.00",  "CRM",                "Sales",       "INV-SF-001"},
                        {"04/22/2025", "Slack",                  "$2100.00",  "SaaS",               "All",         "INV-SL-001"},
                        {"04/24/2025", "Microsoft Azure",        "$6700.00",  "Cloud",              "IT",          "INV-AZ-001"},
                        {"04/26/2025", "FastPay Services",       "$48000.00", "Vendor",             "Finance",     "INV-FP-001"},
                        {"04/28/2025", "Figma",                  "$1800.00",  "Design",             "Product",     "INV-FG-001"},
                        {"05/01/2025", "AWS",                    "$13100.00", "Cloud",              "Engineering", "INV-AWS-003"},
                        {"05/05/2025", "PagerDuty",              "$4500.00",  "Monitoring",         "Engineering", "INV-PD-001"},
                        {"05/10/2025", "Hertz Car Rental",       "$3800.00",  "Travel",             "Sales",       "INV-HZ-001"},
                        {"05/15/2025", "ShadowVendor Inc",       "$12500.00", "Unknown",            "Unknown",     "INV-SV-001"},
                        {"05/20/2025", "Cloudflare",             "$2200.00",  "Infrastructure",     "Engineering", "INV-CF-001"},
                };

                for (String[] row : rows) {
                    cs.beginText();
                    cs.setFont(monoFont, 8);
                    cs.newLineAtOffset(margin, y);
                    cs.showText(String.format("%-12s %-28s %10s %-18s %-12s %-12s",
                            row[0], truncate(row[1], 27), row[2], truncate(row[3], 17), row[4], row[5]));
                    cs.endText();
                    y -= 13;

                    if (y < 80) {
                        // Add new page if needed
                        break;
                    }
                }

                // ── Footer ─────────────────────────────────────────────────────
                y -= 15;
                drawLine(cs, margin, y, 560);
                y -= 12;
                cs.beginText();
                cs.setFont(boldFont, 9);
                cs.newLineAtOffset(margin, y);
                cs.showText("TOTAL ANALYZED: $188,800.00           FLAGGED FOR REVIEW: 6 transactions");
                cs.endText();

                y -= 20;
                cs.beginText();
                cs.setFont(plainFont, 8);
                cs.newLineAtOffset(margin, y);
                cs.showText("CONFIDENTIAL — FOR INTERNAL USE ONLY — Shadow Auditor v1.0");
                cs.endText();

                // Add a note about PII (for testing the PII shield)
                y -= 30;
                cs.beginText();
                cs.setFont(plainFont, 7);
                cs.newLineAtOffset(margin, y);
                cs.showText("Billing Account: 4532-1234-5678-9012  |  Bank Routing: 021000021  |  Tax ID: 12-3456789");
                cs.endText();
            }

            doc.save(outputPath);
        }
    }

    private static void drawLine(PDPageContentStream cs, float x1, float y, float x2) throws IOException {
        cs.moveTo(x1, y);
        cs.lineTo(x2, y);
        cs.stroke();
    }

    private static String truncate(String s, int max) {
        return s.length() > max ? s.substring(0, max - 1) + "…" : s;
    }
}