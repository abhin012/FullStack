import Mainlayout from "@/layout/Mainlayout";
import axiosInstance from "@/lib/axiosinstance";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

export default function TransferHistory() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/reputation/transfers")
      .then((res) => setTransfers(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <h1 className="text-xl font-semibold mb-6">Reputation Transfer History</h1>

      {transfers.length === 0 ? (
        <p className="text-sm text-gray-500">No transfers yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse max-w-3xl">
            <thead>
              <tr className="text-left border-b border-gray-200 text-gray-500">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Direction</th>
                <th className="py-2 pr-4">Sender</th>
                <th className="py-2 pr-4">Receiver</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Reason</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => {
                const isSender = t.sender?._id === user?._id;
                return (
                  <tr key={t._id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-xs text-gray-500">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isSender
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-600"
                        }`}
                      >
                        {isSender ? "Sent" : "Received"}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{t.sender?.name}</td>
                    <td className="py-2 pr-4">{t.receiver?.name}</td>
                    <td className="py-2 pr-4 font-medium">
                      {isSender ? "-" : "+"}
                      {t.amount}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{t.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Mainlayout>
  );
}