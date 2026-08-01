import { useEffect, useState } from "react";
import { useLanguage, LANGUAGE_NAMES } from "@/lib/LanguageContext";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "react-toastify";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pendingLang, setPendingLang] = useState<string | null>(null);
  const [maskedTarget, setMaskedTarget] = useState("");
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [code, setCode] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSelect = async (lang: string) => {
    setOpen(false);
    if (lang === language) return;

    const isLoggedIn = !!localStorage.getItem("user");
    if (!isLoggedIn) {
      toast.info("Please log in to change your language");
      return;
    }

    setPendingLang(lang);
    setRequesting(true);
    try {
      const res = await axiosInstance.post("/language/request-otp", { language: lang });
      setChannel(res.data.channel);
      setMaskedTarget(res.data.target);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send verification code");
      setPendingLang(null);
    } finally {
      setRequesting(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim() || !pendingLang) return;
    setVerifying(true);
    try {
      const res = await axiosInstance.post("/language/verify-otp", {
        language: pendingLang,
        code,
      });
      setLanguage(res.data.language);

      // Keep the localStorage "user" object's language field in sync too
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (storedUser) {
        localStorage.setItem("user", JSON.stringify({ ...storedUser, language: res.data.language }));
      }

      toast.success(`Language switched to ${LANGUAGE_NAMES[res.data.language]}`);
      setPendingLang(null);
      setCode("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!pendingLang) return;
    setRequesting(true);
    try {
      const res = await axiosInstance.post("/language/request-otp", { language: pendingLang });
      setChannel(res.data.channel);
      setMaskedTarget(res.data.target);
      toast.success("Code resent");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to resend code");
    } finally {
      setRequesting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:bg-gray-100 px-2 py-1.5 rounded"
      >
        <Globe className="w-4 h-4" />
        {LANGUAGE_NAMES[language]}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg z-50">
          {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              disabled={requesting}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                code === language ? "font-semibold text-blue-600" : "text-gray-700"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {pendingLang && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="font-semibold mb-2">
              {t("language.switchTo")} {LANGUAGE_NAMES[pendingLang]}
            </h3>
            {maskedTarget && (
              <p className="text-sm text-gray-600 mb-4">
                {t("language.codeSentTo")} {maskedTarget}{" "}
                {channel === "sms" && (
                  <span className="text-xs text-gray-400">(check server terminal — mock SMS)</span>
                )}
              </p>
            )}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full border border-gray-300 rounded p-2 text-center text-lg tracking-widest mb-4"
            />
            <div className="flex gap-2 mb-2">
              <button
                onClick={handleVerify}
                disabled={verifying || !code.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium disabled:opacity-50"
              >
                {verifying ? "Verifying..." : t("language.verify")}
              </button>
              <button
                onClick={() => {
                  setPendingLang(null);
                  setCode("");
                }}
                className="flex-1 bg-gray-100 py-2 rounded text-sm font-medium"
              >
                {t("language.cancel")}
              </button>
            </div>
            <button
              onClick={handleResend}
              disabled={requesting}
              className="w-full text-xs text-blue-600 hover:underline"
            >
              {requesting ? "Sending..." : t("language.resend")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}