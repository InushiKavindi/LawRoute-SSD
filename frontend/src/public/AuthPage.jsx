import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { loginUser, registerUser, resendVerificationEmail } from "@/api/services/authService";
import { toast } from "sonner";

import SignInForm from "@/public/auth/SignInForm.jsx";
import SignUpForm from "@/public/auth/SignUpForm.jsx";
import { useAuth } from "@/context/auth/useAuth";
import { getDashboardPathForRole } from "@/context/auth/authRouting";
import logoWhite from "@/assets/LawRouteLogoWhite.png";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthPage() {
  const navigate = useNavigate();
  const { token, role, setToken } = useAuth();
  const [mode, setMode] = useState("signin");
  const isSignUp = mode === "signup";
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    if (!token) return;

    if (redirect) {
      navigate(redirect, { replace: true });
    } else {
      navigate(getDashboardPathForRole(role), { replace: true });
    }
  }, [token, role, navigate, redirect]);

  const [signInValues, setSignInValues] = useState({
    email: "",
    password: "",
  });

  const [signUpValues, setSignUpValues] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [resending, setResending] = useState(false);

  const title = isSignUp ? "Get Started" : "Welcome back";
  const subtitle = isSignUp
    ? "Create your LawRoute account"
    : "Sign in to continue";

  async function submitSignIn(values) {
    setError("");
    setShowResend(false);
    setBusy(true);

    try {
      const response = await loginUser({
        email: values.email,
        password: values.password,
      });

      if (response?.data?.token) {
        setToken(response.data.token);
      }
    } catch (err) {
      if (err?.status === 403) {
        setShowResend(true);
      }
      setError(err?.data?.message || err?.message || "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await resendVerificationEmail({ email: signInValues.email });
      toast.success("Verification email resent. Please check your inbox.");
      setShowResend(false);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  async function submitSignUp(values) {
    setError("");
    setBusy(true);

    try {
      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      };

      const response = await registerUser(payload);

      if (response?.data?.success) {
        setRegistrationMessage(response.data.message || "Registration successful. Please check your email to verify your account.");
      }
    } catch (err) {
      setError(err?.data?.message || err?.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen w-full items-stretch">
        <div className="relative w-full overflow-hidden bg-background">
          <div className="hidden h-full lg:block">
            <div
              className={
                "absolute inset-y-0 left-0 w-1/2 transition-transform duration-500 ease-in-out " +
                (isSignUp ? "translate-x-full" : "translate-x-0")
              }
            >
              <div className="flex h-full items-center justify-center p-10">
                <div className="w-full max-w-sm">
                  <div className="mb-8 space-y-2">
                    <div className="flex flex-col items-start gap-6">
                      <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="ml-2 text-sm">Home</span>
                      </Link>
                      <h1 className="text-2xl font-semibold tracking-tight">
                        {title}
                      </h1>
                    </div>
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  </div>

                  {!isSignUp ? (
                    <div className="flex flex-col space-y-4">
                      <SignInForm
                        idPrefix="signin"
                        values={signInValues}
                        onChange={setSignInValues}
                        onSubmit={submitSignIn}
                        onSwitchToSignUp={() => {
                          setError("");
                          setShowResend(false);
                          setMode("signup");
                        }}
                        busy={busy}
                        error={error}
                      />
                      {showResend && (
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={resending}
                          className="text-sm font-medium text-primary hover:underline self-start"
                        >
                          {resending ? "Resending..." : "Resend Verification Email"}
                        </button>
                      )}
                    </div>
                  ) : registrationMessage ? (
                    <div className="flex flex-col space-y-4 rounded-lg bg-green-50 p-6 text-green-800">
                      <div className="flex items-center gap-2 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Success!
                      </div>
                      <p className="text-sm">{registrationMessage}</p>
                      <button
                        onClick={() => {
                          setRegistrationMessage("");
                          setMode("signin");
                        }}
                        className="mt-4 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                      >
                        Go to Sign In
                      </button>
                    </div>
                  ) : (
                    <SignUpForm
                      idPrefix="signup"
                      values={signUpValues}
                      onChange={setSignUpValues}
                      onSubmit={submitSignUp}
                      onSwitchToSignIn={() => {
                        setError("");
                        setMode("signin");
                      }}
                      busy={busy}
                      error={error}
                    />
                  )}
                </div>
              </div>
            </div>

            <div
              className={
                "absolute inset-y-0 left-1/2 w-1/2 transition-transform duration-500 ease-in-out " +
                (isSignUp ? "-translate-x-full" : "translate-x-0")
              }
            >
              <div className="relative flex h-full items-center justify-center overflow-hidden bg-primary p-10 text-primary-foreground">
                <div className="absolute inset-0 bg-linear-to-br from-primary to-primary/70" />
                <div className="relative w-full max-w-md space-y-10">
                  <div>
                    <img src={logoWhite} alt="LawRoute" className="h-24 mx-auto" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-semibold tracking-tight">
                      Enter the future
                      
                      of legal support,
                      
                      today
                    </h2>
                    <p className="text-sm text-primary-foreground/80">
                      Find the right help, track your progress, and stay
                      informed all in one place.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-primary-foreground/10 p-6 backdrop-blur">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Built for</div>
                      <div className="text-3xl font-semibold">
                        Citizens & Lawyers
                      </div>
                      <div className="text-sm text-primary-foreground/80">
                        Get started in minutes
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:hidden">
            <div className="grid gap-6 p-6 sm:p-10">
              <div className="space-y-2">
                <div className="flex flex-col items-start gap-3">
                  <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-5 w-5" />
                    <span className="ml-2 text-sm">Home</span>
                  </Link>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {title}
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>

              {!isSignUp ? (
                <div className="flex flex-col space-y-4">
                  <SignInForm
                    idPrefix="m-signin"
                    values={signInValues}
                    onChange={setSignInValues}
                    onSubmit={submitSignIn}
                    onSwitchToSignUp={() => {
                      setError("");
                      setShowResend(false);
                      setMode("signup");
                    }}
                    busy={busy}
                    error={error}
                  />
                  {showResend && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="text-sm font-medium text-primary hover:underline self-start"
                    >
                      {resending ? "Resending..." : "Resend Verification Email"}
                    </button>
                  )}
                </div>
              ) : registrationMessage ? (
                <div className="flex flex-col space-y-4 rounded-lg bg-green-50 p-6 text-green-800">
                  <div className="flex items-center gap-2 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Success!
                  </div>
                  <p className="text-sm">{registrationMessage}</p>
                  <button
                    onClick={() => {
                      setRegistrationMessage("");
                      setMode("signin");
                    }}
                    className="mt-4 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    Go to Sign In
                  </button>
                </div>
              ) : (
                <SignUpForm
                  idPrefix="m-signup"
                  values={signUpValues}
                  onChange={setSignUpValues}
                  onSubmit={submitSignUp}
                  onSwitchToSignIn={() => {
                    setError("");
                    setMode("signin");
                  }}
                  busy={busy}
                  error={error}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
