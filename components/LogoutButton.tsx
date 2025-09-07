"use client";

import { logout } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isLoggingOut) return; // Prevent multiple clicks
    
    try {
      setIsLoggingOut(true);
      
      // Clear client-side cookies first
      document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // Call server action
      await logout();
      
      // Navigate directly without using router to avoid state issues
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Logout error:", error);
      // If there's an error, still redirect to sign-in for a better user experience
      window.location.href = "/sign-in";
    }
  };
  
  return (
    <button 
      onClick={handleLogout} 
      className="nav-link logout-link"
      disabled={isLoggingOut}
    >
      {isLoggingOut ? "Logging out..." : "Logout"}
    </button>
  );
}
