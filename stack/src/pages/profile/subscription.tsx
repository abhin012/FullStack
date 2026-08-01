import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useLanguage } from "@/lib/LanguageContext";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function SubscriptionDashboard() {
  const { t } = useLanguage();

  const PLAN_LABELS: Record<string, string> = {
    free: t("plan.free"),
    bronze: t("plan.bronze"),
    silver: t("plan.silver"),
    gold: t("plan.gold"),
  };

  const [planInfo, setPlanInfo] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get("/user/my-plan"),
      axiosInstance.get("/payment/history"),
    ])
      .then(([planRes, historyRes]) => {
        setPlanInfo(planRes.data);
        setHistory(historyRes.data.data);
      })
      .catch(() => toast.error("Failed to load subscription data"))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadInvoice = async (paymentId: string, invoiceNumber: string) => {
    try {
      const res = await axiosInstance.get(`/payment/invoice/${paymentId}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Failed to download invoice");
    }
  };

  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </Mainlayout>
    );
  }

  const isActive = planInfo?.plan !== "free";
  const isExpired = planInfo?.planExpiry && new Date(planInfo.planExpiry) < new Date();

  return (
    <Mainlayout>
      <h1 className="text-xl font-semibold mb-6">{t("subscription.title")}</h1>

      <div className="border border-gray-200 rounded p-5 mb-8 max-w-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{PLAN_LABELS[planInfo?.plan] || t("plan.free")} Plan</h2>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              isActive && !isExpired
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {isActive && !isExpired ? t("subscription.active") : isExpired ? t("subscription.expired") : t("subscription.freeTier")}
          </span>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>{t("subscription.dailyLimit")}: {planInfo?.dailyQuestionLimit === Infinity || planInfo?.dailyQuestionLimit > 1000 ? t("subscription.unlimited") : planInfo?.dailyQuestionLimit}</p>
          <p>{t("subscription.postedToday")}: {planInfo?.questionsPostedToday || 0}</p>
          {planInfo?.planExpiry && (
            <p>{t("subscription.renewalDate")}: {new Date(planInfo.planExpiry).toLocaleDateString()}</p>
          )}
        </div>

        <div className="mt-4 text-sm">
          <p className="font-medium mb-1">{t("subscription.planFeatures")}:</p>
          <ul className="text-gray-600 space-y-0.5">
            {planInfo?.features?.advancedSearch && <li>✓ {t("feature.advancedSearch")}</li>}
            {planInfo?.features?.prioritySupport && <li>✓ {t("feature.prioritySupport")}</li>}
            {planInfo?.features?.enhancedVisibility && <li>✓ {t("feature.enhancedVisibility")}</li>}
            {planInfo?.features?.featuredVisibility && <li>✓ {t("feature.featuredVisibility")}</li>}
            {planInfo?.features?.unlimitedBookmarks && <li>✓ {t("feature.unlimitedBookmarks")}</li>}
            {planInfo?.features?.exclusiveCommunity && <li>✓ {t("feature.exclusiveCommunity")}</li>}
          </ul>
        </div>

        <a href="/pricing" className="inline-block mt-4 text-sm text-blue-600 hover:underline">
          {isActive ? t("subscription.changePlan") : t("subscription.upgradePlan")}
        </a>
      </div>

      <h2 className="text-lg font-semibold mb-3">{t("subscription.paymentHistory")}</h2>
      {history.length === 0 ? (
        <p className="text-sm text-gray-500">{t("subscription.noPayments")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse max-w-3xl">
            <thead>
              <tr className="text-left border-b border-gray-200 text-gray-500">
                <th className="py-2 pr-4">{t("subscription.date")}</th>
                <th className="py-2 pr-4">{t("subscription.plan")}</th>
                <th className="py-2 pr-4">{t("subscription.amount")}</th>
                <th className="py-2 pr-4">{t("subscription.invoiceNumber")}</th>
                <th className="py-2 pr-4">{t("subscription.billingPeriod")}</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {history.map((p) => (
                <tr key={p._id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">{PLAN_LABELS[p.plan]}</td>
                  <td className="py-2 pr-4">₹{p.amount}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{p.invoiceNumber}</td>
                  <td className="py-2 pr-4 text-xs text-gray-500">
                    {new Date(p.subscriptionStart).toLocaleDateString()} –{" "}
                    {new Date(p.subscriptionEnd).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => handleDownloadInvoice(p._id, p.invoiceNumber)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      {t("subscription.download")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Mainlayout>
  );
}