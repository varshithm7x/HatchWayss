import { isAuthenticated } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { Toaster } from "sonner";

async function AuthLayout({ children }: { children: ReactNode }) {
  const isAuth = await isAuthenticated();
  if (isAuth) {
    redirect("/");
  }
  return (
    <div className="auth-layout">
      {children}
      <Toaster position="top-center" />
    </div>
  );
}

export default AuthLayout;
