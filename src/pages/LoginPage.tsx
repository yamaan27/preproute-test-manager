import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { getApiError } from "../api/client";
import { FormField } from "../components/FormField";
import { useAuth } from "../state/useAuth";

const loginSchema = z.object({
  userId: z.string().min(1, "Email ID / Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { userId: "vedant-admin", password: "vedant123" },
  });

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values: LoginValues) => {
    setError("");
    try {
      await login(values.userId, values.password);
      navigate("/dashboard", { replace: true });
    } catch (apiError) {
      setError(getApiError(apiError));
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-copy">
          <div className="login-workspace" aria-hidden="true">
            <div className="desk-drawing">
              <div className="chair">
                <div className="chair-back" />
                <div className="chair-seat" />
                <div className="chair-base" />
              </div>
              <div className="desk-top" />
              <div className="desk-leg left" />
              <div className="desk-leg right" />
              <div className="monitor-stand" />
              <div className="monitor-base" />
              <div className="monitor" />
              <div className="plant">
                <div className="leaves" />
                <div className="pot" />
              </div>
            </div>
          </div>
        </div>
        <form className="login-card" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <div className="login-logo" style={{ fontSize: "28px", fontWeight: 800, marginBottom: "4px", color: "#2563eb" }}>
              Preproute
            </div>
            <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: "14px" }}>
              Please enter your login details
            </p>
            <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "20px", color: "#0f172a" }}>
              Login
            </h2>
          </div>
          {error ? <div className="alert error">{error}</div> : null}
          <FormField label="Email ID" error={errors.userId?.message}>
            <div className="input-with-icon">
              <UserRound size={18} />
              <input {...register("userId")} autoComplete="username" placeholder="name@domain.com" />
            </div>
          </FormField>
          <FormField label="Password" error={errors.password?.message}>
            <div className="input-with-icon">
              <Lock size={18} />
              <input {...register("password")} type="password" autoComplete="current-password" placeholder="••••••••" />
            </div>
            <div style={{ textAlign: "right", marginTop: "6px" }}>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Please contact your administrator to reset your password.");
                }}
                style={{ fontSize: "13px", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}
              >
                Forgot password?
              </a>
            </div>
          </FormField>
          <button className="primary-button" type="submit" disabled={isSubmitting} style={{ width: "100%", marginTop: "12px", justifyContent: "center" }}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
