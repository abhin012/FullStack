import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { toast } from "react-toastify";

const index = () => {
  const router = useRouter();
  const { Login, VerifyLoginOTP, loading } = useAuth();
  const { t } = useLanguage();
  const [form, setform] = useState({ email: "", password: "" });
  const [otpStage, setOtpStage] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const handleChange = (e: any) => {
    setform({ ...form, [e.target.id]: e.target.value });
  };

  const handlesubmit = async (e: any) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("ALL Fields are required");
      return;
    }
    try {
      const result = await Login(form);
      if (result?.requiresOTP) {
        setOtpEmail(result.email);
        setOtpStage(true);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleVerify = async (e: any) => {
    e.preventDefault();
    if (!code.trim()) return;
    setVerifying(true);
    try {
      await VerifyLoginOTP({ email: otpEmail, code, rememberDevice });
      router.push("/");
    } catch (error) {
      // toast already shown inside VerifyLoginOTP
    } finally {
      setVerifying(false);
    }
  };

  if (otpStage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <form onSubmit={handleVerify}>
            <Card>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl lg:text-2xl">Verify this device</CardTitle>
                <CardDescription>
                  We sent a verification code to {otpEmail} since we don't recognize this device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm">
                    Verification code
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                  />
                  Remember this device for future logins
                </label>
                <Button
                  type="submit"
                  disabled={verifying || !code.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  {verifying ? "Verifying..." : "Verify & Log in"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpStage(false);
                    setCode("");
                  }}
                  className="w-full text-center text-xs text-blue-600 hover:underline"
                >
                  Back to login
                </button>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 lg:mb-8">
          <Link href="/" className="flex items-center justify-center mb-4">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-orange-500 rounded mr-2 flex items-center justify-center">
              <div className="w-4 h-4 lg:w-6 lg:h-6 bg-white rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-orange-500 rounded-sm"></div>
              </div>
            </div>
            <span className="text-lg lg:text-xl font-bold text-gray-800">
              stack<span className="font-normal">overflow</span>
            </span>
          </Link>
        </div>
        <form onSubmit={handlesubmit}>
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl lg:text-2xl">{t("auth.title")}</CardTitle>
              <CardDescription>{t("auth.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  {t("auth.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  onChange={handleChange}
                  value={form.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">
                  {t("auth.password")}
                </Label>
                <Input id="password" type="password" onChange={handleChange} value={form.password} />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-sm">
                {loading ? "loading" : t("auth.loginButton")}
              </Button>
              <div className="text-center text-sm">
                <Link href="/auth/forgot-password" className="text-xs text-blue-600 underline">
                  {t("auth.forgotPassword")}
                </Link>
              </div>

              <div className="text-center text-sm">
                {t("auth.noAccount")}{" "}
                <Link href="/signup" className="text-blue-600 hover:underline">
                  {t("auth.signup")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default index;