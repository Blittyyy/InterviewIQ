import React from "react";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="text-[#4B6EF5]" size={32} />
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>
        <div className="prose prose-lg">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <h2>1. Introduction</h2>
          <p>
            This Privacy Policy explains how InterviewIQ ("we", "us", or "our") collects, uses, and protects your information when you use our service.
          </p>
          <h2>2. Information We Collect</h2>
          <ul>
            <li><strong>Email address</strong> (for account creation and communication)</li>
            <li><strong>Resume data</strong> (when you upload your resume for analysis)</li>
            <li><strong>Device fingerprint</strong> (to prevent abuse and ensure fair usage)</li>
            <li><strong>Company and job information</strong> (when you request a report)</li>
            <li><strong>Usage data</strong> (such as reports generated, trial status, and activity logs)</li>
          </ul>
          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>To provide and improve our services</li>
            <li>To communicate with you about your account or updates</li>
            <li>To prevent abuse and ensure fair usage</li>
            <li>To generate company research reports using third-party AI services</li>
          </ul>
          <h2>4. Third-Party Services</h2>
          <p>
            We use trusted third-party providers to operate InterviewIQ, including:
          </p>
          <ul>
            <li><strong>OpenAI</strong> (for generating company research reports)</li>
            <li><strong>Supabase</strong> (for authentication, database, and storage)</li>
          </ul>
          <p>
            Your data may be processed by these providers as necessary to deliver our service.
          </p>
          <h2>5. Cookies</h2>
          <p>
            We use cookies for authentication and session management. We do not use cookies for advertising or tracking purposes.
          </p>
          <h2>6. Data Security</h2>
          <p>
            We take reasonable measures to protect your information from unauthorized access, loss, or misuse. However, no method of transmission over the Internet is 100% secure.
          </p>
          <h2>7. Your Rights</h2>
          <p>
            You may request to access, update, or delete your personal information by contacting us at the email below. We will respond to all requests as required by law.
          </p>
          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the date at the top of this page.
          </p>
          <h2>9. Contact</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at contactinterviewiq@gmail.com.
          </p>
        </div>
        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:underline font-semibold">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
} 