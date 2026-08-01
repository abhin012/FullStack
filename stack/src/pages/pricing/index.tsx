import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useLanguage } from "@/lib/LanguageContext";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Pricing() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const PLANS = [
    { key: "free", name: t("plan.free"), price: 0, features: [t("feature.q1PerDay"), t("feature.basicSearch")] },
    { key: "bronze", name: t("plan.bronze"), price: 99, features: [t("feature.q5PerDay"), t("feature.bronzeBadge"), t("feature.advancedSearch")] },
    { key: "silver", name: t("plan.silver"), price: 299, features: [t("feature.q15PerDay"), t("feature.silverBadge"), t("feature.prioritySupport"), t("feature.enhancedVisibility"), t("feature.unlimitedBookmarks")] },
    { key: "gold", name: t("plan.gold"), price: 999, features: [t("feature.unlimitedQuestions"), t("feature.goldBadge"), t("feature.highestSearchPriority"), t("feature.featuredVisibility"), t("feature.prioritySupport"), t("feature.exclusiveCommunity")] },
  ];

  useEffect(() => {
    setCurrentUser(JSON.parse(localStorage.getItem("user") || "null"));
  }, []);

  const handleUpgrade = async (planKey: string) => {
    if (planKey === "free") return;
    setLoadingPlan(planKey);

    try {
      const orderRes = await axiosInstance.post("/payment/create-order", { planKey });
      const { orderId, amount, currency, keyId, paymentRecordId } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "Community Feed",
        description: `${planKey.toUpperCase()} plan subscription`,
        order_id: orderId,
        prefill: {
          name: currentUser?.name,
          email: currentUser?.email,
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await axiosInstance.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentRecordId,
              billingName: currentUser?.name,
              billingEmail: currentUser?.email,
            });
            toast.success(`${planKey.toUpperCase()} plan activated!`);

            const updatedUser = { ...currentUser, plan: verifyRes.data.plan };
            localStorage.setItem("user", JSON.stringify({ ...JSON.parse(localStorage.getItem("user") || "{}"), ...updatedUser }));
            setCurrentUser(updatedUser);
          } catch (error) {
            toast.error("Payment verification failed");
          }
        },
        theme: { color: "#2563eb" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error("Failed to start checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Mainlayout>
      <h1 className="text-xl font-semibold mb-6">{t("pricing.title")}</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = currentUser?.plan === plan.key || (!currentUser?.plan && plan.key === "free");
          return (
            <div key={plan.key} className="border border-gray-200 rounded p-4 flex flex-col">
              <h2 className="font-semibold text-lg">{plan.name}</h2>
              <p className="text-2xl font-bold my-2">
                ₹{plan.price}
                {plan.price > 0 && <span className="text-sm font-normal text-gray-500">{t("pricing.perMonth")}</span>}
              </p>
              <ul className="text-sm text-gray-600 space-y-1 flex-1 mb-4">
                {plan.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(plan.key)}
                disabled={isCurrent || loadingPlan === plan.key || plan.key === "free"}
                className={`text-sm py-2 rounded font-medium ${
                  isCurrent
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                }`}
              >
                {isCurrent ? t("pricing.currentPlan") : loadingPlan === plan.key ? t("pricing.loading") : t("pricing.upgrade")}
              </button>
            </div>
          );
        })}
      </div>
    </Mainlayout>
  );
}