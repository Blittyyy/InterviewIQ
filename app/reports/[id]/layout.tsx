import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Company Report | InterviewIQ",
  description: "Detailed company research report to help you prepare for your interview",
}

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 