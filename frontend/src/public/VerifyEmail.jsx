import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "@/api/axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/context/auth/useAuth";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setErrorMessage("Invalid verification link.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.post("/auth/verify-email", { token, email });
        
        if (response.data.success) {
          setStatus("success");
          
          if (response.data.token) {
            localStorage.setItem("token", response.data.token);
            await fetchUser();
            
            setTimeout(() => {
              navigate("/citizen"); // Basic redirect, ideally check role
            }, 3000);
          }
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error?.data?.message || error?.message || "Verification failed. The link might be expired."
        );
      }
    };

    verifyEmail();
  }, [token, email, navigate, fetchUser]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === "verifying" && "Please wait while we verify your email address..."}
            {status === "success" && "Your email has been successfully verified!"}
            {status === "error" && "We couldn't verify your email address."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          {status === "verifying" && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          
          {status === "success" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">Redirecting you to the dashboard...</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="font-medium text-red-600">{errorMessage}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={() => navigate("/auth")} className="w-full">
            Go to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
