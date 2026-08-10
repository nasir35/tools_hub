import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Scanner | Tools Hub",
  description:
    "Convert photos to PDF with CamScanner-like features. Upload images, apply document filters, reorder pages, and export a polished PDF — all in your browser.",
};

export default function PdfScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
