"use client";

import { WavyBackground } from "@/components/ui/wavy-background";
import { MailIcon, HomeIcon } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <WavyBackground backgroundFill="#fff" blur={20} waveOpacity={0.15}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <MailIcon className="h-10 w-10 text-blue-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-3 text-center">Contact Support</h1>
        <p className="text-gray-600 mb-6 text-center">
          For any issues or questions, feel free to reach out to us via email.
        </p>
        <a
          href="mailto:contactinterviewiq@gmail.com"
          className="text-blue-600 font-medium hover:underline focus:underline focus:outline-none text-base break-all"
        >
          contactinterviewiq@gmail.com
        </a>
        <Link href="/" className="mt-6 w-full">
          <button
            type="button"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-[#4B6EF5] to-[#8C52FF] shadow-md hover:brightness-110 transition-all text-base"
          >
            <HomeIcon className="h-5 w-5" />
            Home
          </button>
        </Link>
      </div>
    </WavyBackground>
  );
} 