import InterviewCard from "@/components/InterviewCard";
import Aurora from "@/components/Aurora";
import { Button } from "@/components/ui/button";
import { dummyInterviews } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Mic } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import GetStartedButton from "@/components/GetStartedButton";
import RecentCallData from "@/components/RecentCallData";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageLayout from "@/components/PageLayout";

const HomePage = () => {
  return (
    <PageLayout fullWidth={true}>
      <section className="hero-section">
        {/* Aurora Background - with more subtle waves, extended to top */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <Aurora 
            className="w-full h-full"
            colorStops={["#8b5cf6", "#ec4899", "#3b82f6"]}
            amplitude={1.0}
            blend={0.35}
            speed={0.8}
          />
        </div>
        
        {/* Very subtle gradient transition */}
        <div className="absolute top-[55vh] left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent z-5"></div>
        
        {/* Hero content aligned with navbar width */}
        <div className="hero-content mx-auto" style={{ maxWidth: "1200px", width: "85vw" }}>
          <h1 className="hero-title">
            Better Ways to Prepare
          </h1>
          <h1 className="hero-title">
            Smarter Ways to Get Hired
          </h1>
          
          <p className="hero-subtitle">
            Hatchways helps you break into your dream career with AI-led mock interviews and career prep tools.
          </p>
          
          <div className="hero-buttons">
            <GetStartedButton />
            <Button variant="ghost" className="btn-learn-more">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Content sections with proper background - aligned with navbar */}
      <div className="relative z-10 bg-black py-12">
        <div className="mx-auto" style={{ maxWidth: "1200px", width: "85vw" }}>
          {/* Original content below */}
          <section className="card-cta">
            <div className="flex flex-col items-center gap-6 max-w-lg ">
              <h2>Get Interview Ready with AI-Powered Practice & Feedback</h2>
              <p className="text-lg">
                Practice on real Interview questions & get instant feedback. 
                Voice interviews now include DSA coding questions with text chat support!
              </p>
            </div>
            <Image
              src={"/robot.png"}
              width={400}
              height={400}
              alt="robot"
              className="max-sm:hidden"
            />
          </section>

          {/* Recent Interview Data - Shows 4 cards with View More option */}
          <RecentCallData />

          <section className="flex flex-col gap-6 mt-8">
            <h2 className="text-white">Interview Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-border">
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 blue-gradient rounded-lg flex items-center justify-center">
                      <Mic className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Voice Interview</h3>
                      <p className="text-light-100 text-sm">Natural conversation with AI</p>
                    </div>
                  </div>
                  <p className="text-light-100 mb-4">
                    Practice with our AI interviewer using natural voice conversations. Perfect for behavioral and technical discussions.
                  </p>
                  <ul className="text-sm text-light-100 space-y-1">
                    <li>• Real-time voice interaction</li>
                    <li>• Behavioral & technical questions</li>
                    <li>• Instant transcript & feedback</li>
                  </ul>
                </div>
              </div>

              <div className="card-border">
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 002 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">DSA Chat Support</h3>
                      <p className="text-light-100 text-sm">Code & algorithm questions</p>
                    </div>
                  </div>
                  <p className="text-light-100 mb-4">
                    When DSA questions come up during voice interviews, a chat window automatically appears for coding solutions.
                  </p>
                  <ul className="text-sm text-light-100 space-y-1">
                    <li>• Auto-detects coding questions</li>
                    <li>• Text input for code solutions</li>
                    <li>• Real-time analysis & feedback</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default HomePage;
