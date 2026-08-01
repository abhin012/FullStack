import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "react-toastify";
import { useLanguage } from "@/lib/LanguageContext";

const PRIVILEGE_LIST = [
  { key: "commentWithoutRestriction", label: "Comment without restriction", threshold: 50 },
  { key: "editCommunityPosts", label: "Edit community posts", threshold: 100 },
  { key: "voteToCloseQuestions", label: "Vote to close questions", threshold: 250 },
  { key: "reportContent", label: "Report inappropriate content", threshold: 500 },
];

export default function ReputationCard({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
  const [reputation, setReputation] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState(10);
  const [transferReason, setTransferReason] = useState("");
  const [sending, setSending] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await axiosInstance.get(`/reputation/history/${userId}?limit=10`);
      setHistory(res.data.data);
    } catch (error) {
      // silently fail — public data, non-critical
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchHistory();
    if (isOwnProfile) {
      axiosInstance
        .get("/reputation/my-reputation")
        .then((res) => setReputation(res.data.reputation))
        .catch(() => {});
    }
  }, [userId, isOwnProfile]);
  const { t } = useLanguage();

  const handleTransfer = async () => {
    if (!transferReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setSending(true);
    try {
      await axiosInstance.post("/reputation/transfer", {
        toUserId: userId,
        amount: transferAmount,
        reason: transferReason,
      });
      toast.success(`Sent ${transferAmount} reputation`);
      setShowTransfer(false);
      setTransferReason("");
      fetchHistory();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Transfer failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("reputation.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isOwnProfile && reputation !== null && (
          <>
            <p className="text-2xl font-bold mb-3">{reputation} {t("reputation.points")}</p>
            <div className="space-y-1 mb-4 text-sm">
              {PRIVILEGE_LIST.map((p) => (
                <div key={p.key} className="flex items-center justify-between">
                  <span className={reputation >= p.threshold ? "text-gray-800" : "text-gray-400"}>
                    {p.label}
                  </span>
                  <span className={reputation >= p.threshold ? "text-green-600" : "text-gray-400"}>
                    {reputation >= p.threshold ? "✓" : `${p.threshold}`}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {!isOwnProfile && (
          <div className="mb-4">
            {showTransfer ? (
              <div className="space-y-2">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded p-1.5 text-sm"
                  placeholder={t("reputation.amountPlaceholder")}
                />
                <input
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full border border-gray-300 rounded p-1.5 text-sm"
                  placeholder="Reason"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleTransfer} disabled={sending} className="flex-1">
                    {sending ? "Sending..." : t("reputation.send")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowTransfer(false)} className="flex-1 text-white">
                    {t("reputation.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setShowTransfer(true)} className="w-full text-white">
                {t("reputation.sendReputation")}
              </Button>
            )}
          </div>
        )}

        <h4 className="text-sm font-semibold mb-2">{t("reputation.activityHistory")}</h4>
        {history.length === 0 ? (
          <p className="text-xs text-gray-500">{t("reputation.noActivity")}</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {history.map((h) => (
              <li key={h._id} className="flex justify-between">
                <span className="text-gray-600">{h.reason.replace(/_/g, " ")}</span>
                <span className={h.change > 0 ? "text-green-600" : "text-red-600"}>
                  {h.change > 0 ? `+${h.change}` : h.change}
                </span>
              </li>
            ))}
          </ul>
        )}
        
        {isOwnProfile && (<a
              href="/profile/transfers"
              className="block text-center text-xs text-blue-600 hover:underline mt-3">
              {t("reputation.viewFullHistory")}
            </a>
          )}
      </CardContent>
    </Card>
  );
}