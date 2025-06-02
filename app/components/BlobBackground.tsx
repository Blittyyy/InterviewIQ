import React from 'react';

const BlobBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Primary blobs */}
      <div className="absolute top-1/4 -left-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-90 animate-blob" />
      <div className="absolute top-1/3 -right-4 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-2xl opacity-90 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-2xl opacity-90 animate-blob animation-delay-4000" />
      
      {/* Additional blobs */}
      <div className="absolute top-1/2 right-1/4 w-[32rem] h-[32rem] bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-85 animate-blob animation-delay-1000" />
      <div className="absolute bottom-1/4 left-1/3 w-[28rem] h-[28rem] bg-green-400 rounded-full mix-blend-multiply filter blur-2xl opacity-85 animate-blob animation-delay-3000" />
      <div className="absolute top-1/3 left-1/4 w-[24rem] h-[24rem] bg-orange-400 rounded-full mix-blend-multiply filter blur-2xl opacity-90 animate-blob animation-delay-5000" />
      
      {/* Small accent blobs */}
      <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-2xl opacity-85 animate-blob animation-delay-1500" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-2xl opacity-85 animate-blob animation-delay-2500" />
      <div className="absolute top-2/3 left-1/2 w-56 h-56 bg-rose-400 rounded-full mix-blend-multiply filter blur-2xl opacity-90 animate-blob animation-delay-3500" />

      {/* Extra blobs for richer effect */}
      <div className="absolute top-10 left-1/2 w-40 h-40 bg-fuchsia-400 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-6000" />
      <div className="absolute bottom-10 right-1/2 w-52 h-52 bg-cyan-300 rounded-full mix-blend-multiply filter blur-2xl opacity-75 animate-blob animation-delay-7000" />
      <div className="absolute top-1/5 right-1/5 w-32 h-32 bg-lime-300 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob animation-delay-8000" />
      <div className="absolute bottom-1/6 left-1/6 w-44 h-44 bg-red-300 rounded-full mix-blend-multiply filter blur-2xl opacity-65 animate-blob animation-delay-9000" />
      <div className="absolute top-1/2 left-1/8 w-36 h-36 bg-amber-300 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob animation-delay-10000" />
    </div>
  );
};

export default BlobBackground; 