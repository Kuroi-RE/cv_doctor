import {
  getAdminDashboardStats,
  type DashboardLog,
} from "@/lib/actions/admin-dashboard";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  Users,
  FileText,
  Sparkles,
  Zap,
  Ban,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const { stats, error } = await getAdminDashboardStats();

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border-4 border-red-500 bg-red-50 p-6 shadow-[6px_6px_0px_0px_#ef4444]">
          <p className="text-sm font-bold text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  const activeKeys = stats?.activeKeys || [];
  const recentLogs = stats?.recentLogs || [];
  const totalCvs = stats?.totalCvs ?? 0;
  const totalAnalyses = stats?.totalAnalyses ?? 0;
  const totalUsers = stats?.totalUsers ?? 0;

  const activeProviders = activeKeys.filter((k) => k.is_active);

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" strokeWidth={3} />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" strokeWidth={3} />;
      case "analyzing":
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-600" strokeWidth={3} />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" strokeWidth={3} />;
    }
  };

  const statusBadge = (status: string) => {
    const base = "rounded-lg border-2 px-2 py-0.5 text-xs font-black uppercase tracking-wider";
    switch (status) {
      case "completed":
        return `${base} border-green-600 bg-green-100 text-green-800`;
      case "failed":
        return `${base} border-red-600 bg-red-100 text-red-800`;
      case "analyzing":
        return `${base} border-yellow-600 bg-yellow-100 text-yellow-800`;
      default:
        return `${base} border-gray-600 bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl">
          Superadmin Dashboard
        </h1>
        <p className="mt-2 text-base font-medium text-gray-600">
          System overview, active AI providers, and recent system logs.
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000000]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-3 border-black bg-yellow-300 shadow-[2px_2px_0px_0px_#000000]">
            <FileText className="h-6 w-6" strokeWidth={3} />
          </div>
          <div>
            <p className="text-2xl font-black text-black">{totalCvs}</p>
            <p className="text-xs font-black uppercase tracking-wider text-gray-500">
              Total CVs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000000]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-3 border-black bg-cyan-300 shadow-[2px_2px_0px_0px_#000000]">
            <Sparkles className="h-6 w-6" strokeWidth={3} />
          </div>
          <div>
            <p className="text-2xl font-black text-black">{totalAnalyses}</p>
            <p className="text-xs font-black uppercase tracking-wider text-gray-500">
              Analyses Done
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000000]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-3 border-black bg-green-300 shadow-[2px_2px_0px_0px_#000000]">
            <Users className="h-6 w-6" strokeWidth={3} />
          </div>
          <div>
            <p className="text-2xl font-black text-black">{totalUsers}</p>
            <p className="text-xs font-black uppercase tracking-wider text-gray-500">
              Total Users
            </p>
          </div>
        </div>
      </div>

      {/* Active AI Providers */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-black uppercase tracking-wider text-black">
          Active AI Providers
        </h2>
        {activeProviders.length === 0 ? (
          <div className="rounded-xl border-4 border-gray-300 bg-gray-50 p-6 shadow-[4px_4px_0px_0px_#d1d5db]">
            <p className="text-sm font-bold text-gray-500">
              No active AI providers configured. Go to{" "}
              <a href="/admin/api-keys" className="underline">
                API Keys
              </a>{" "}
              to add one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {activeProviders.map((key) => (
              <div
                key={key.provider}
                className="flex items-center gap-4 rounded-xl border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000000]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border-3 border-black bg-purple-300 shadow-[2px_2px_0px_0px_#000000]">
                  <Key className="h-6 w-6" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-lg font-black uppercase text-black">
                    {key.provider}
                  </p>
                  <p className="text-xs font-bold text-gray-600">
                    {key.model}
                  </p>
                  <span className="mt-1 inline-block rounded border-2 border-green-600 bg-green-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-green-800">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All configured providers */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-black uppercase tracking-wider text-black">
          Configured Providers
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {["openai", "gemini", "nvidia"].map((provider) => {
            const key = activeKeys.find((k) => k.provider === provider);
            return (
              <div
                key={provider}
                className={`flex items-center justify-between rounded-xl border-4 p-4 shadow-[4px_4px_0px_0px_#000000] ${
                  key?.is_active
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Zap
                    className={`h-5 w-5 ${
                      key?.is_active ? "text-green-600" : "text-gray-400"
                    }`}
                    strokeWidth={3}
                  />
                  <span className="text-sm font-black uppercase text-black">
                    {provider}
                  </span>
                </div>
                {key?.is_active ? (
                  <CheckCircle2
                    className="h-5 w-5 text-green-600"
                    strokeWidth={3}
                  />
                ) : (
                  <Ban className="h-5 w-5 text-gray-400" strokeWidth={3} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Logs */}
      <div>
        <h2 className="mb-4 text-xl font-black uppercase tracking-wider text-black">
          Recent System Logs
        </h2>
        <div className="overflow-hidden rounded-xl border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000000]">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-bold text-gray-400">
                No logs yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-4 border-black bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-600">
                      Provider
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-600">
                      Message
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-600">
                      Error
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wider text-gray-600">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-100">
                  {recentLogs.map((log: DashboardLog) => (
                    <tr
                      key={log.id}
                      className={`transition-colors ${
                        log.status === "failed" ? "bg-red-50" : "hover:bg-yellow-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {statusIcon(log.status)}
                          <span className={statusBadge(log.status)}>
                            {log.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-gray-700">
                        {log.provider || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-black">
                        {log.message}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-red-600">
                        {log.error_message || "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
