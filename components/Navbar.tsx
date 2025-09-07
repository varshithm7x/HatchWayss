"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LogoutButton from './LogoutButton';

const Navbar = () => {
  return (
    <nav className="hero-nav">
      <div className="hero-nav-content">
        <Link href="/" className="hero-logo">
          <Image 
            src="/new-logo.png" 
            alt="Hatchways Logo" 
            width={80} 
            height={80} 
            className="rounded-md object-contain p-0.5"
            style={{ background: 'transparent' }}
            priority
          />
          <span className="logo-text">Hatchways</span>
        </Link>
        
        <div className="hero-nav-links">
          <Link href="/interview" className="nav-link">Practice</Link>
          <Link href="/analytics" className="nav-link">Analytics</Link>
          <Link href="/progress" className="nav-link">Progress</Link>
          <Link href="/improvement-plan" className="nav-link">Learning Plan</Link>
          <Link href="/feedback" className="nav-link">Feedback</Link>
          <Link href="/call-data" className="nav-link">Interviews</Link>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
