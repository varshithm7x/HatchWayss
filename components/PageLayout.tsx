"use client";

import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface PageLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  showNavbar?: boolean;
  fullWidth?: boolean;
}

const PageLayout = ({ 
  children, 
  showFooter = true, 
  showNavbar = true, 
  fullWidth = false 
}: PageLayoutProps) => {
  return (
    <>
      {/* Fixed background */}
      <div className="fixed inset-0 w-full h-full bg-black z-[-1]"></div>
      
      {showNavbar && (
        <div className="relative mx-auto" style={{ maxWidth: "1200px", width: "85vw" }}>
          <Navbar />
        </div>
      )}
      
      <main className={fullWidth ? 'w-full' : ''}>
        {children}
      </main>
      
      {showFooter && <Footer />}
    </>
  );
};

export default PageLayout;
