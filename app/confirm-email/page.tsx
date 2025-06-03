import React from "react";

export default function ConfirmEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F4F7FE] to-white">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Confirm Your Email</h2>
        <p className="text-gray-600 mb-6">
          Thanks for signing up! Please check your inbox and click the confirmation link to activate your account.
        </p>
        <p className="text-gray-500 text-sm mb-4">
          Didn't get the email? Check your spam folder or&nbsp;
          <button className="text-[#4B6EF5] underline">resend confirmation</button>.
        </p>
        <a href="/" className="text-[#8C52FF] font-medium">Back to Home</a>
      </div>
    </div>
  );
} 