import React from "react";

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center gap-[1in]">
      {/* Hero Text */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient relative z-10">
          Verify Your Work History
          <br />
          Build Trust with Employers
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Connect with coworkers, get verified references, and showcase your
          professional credibility. Trusted by job seekers and employers
          worldwide.
        </p>
      </div>
    </section>
  );
}
