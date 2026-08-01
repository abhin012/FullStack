import { useState } from "react";
import Link from "next/link";
import axiosInstance from "@/lib/axiosinstance";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setError(null);
    if (!identifier.trim()) return;

    setLoading(true);
    try {
      const res = await axiosInstance.post("/user/forgot-password", { identifier });
      setResult(res.data.newPassword);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 border border-gray-200 rounded">
      <h1 className="text-lg font-semibold mb-1">Forgot Password</h1>
      <p className="text-sm text-gray-500 mb-4">
        Enter your registered email or phone number to reset your password.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Email or phone number"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full border border-gray-300 rounded p-2 text-sm mb-3"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
          Your new password is: <span className="font-mono font-semibold">{result}</span>
          <br />
          Please save it and log in — you can change it later from your profile.
        </div>
      )}

      <Link href="/auth" className="block text-xs text-blue-600 underline mt-4 text-center">
        Back to login
      </Link>
    </div>
  );
}