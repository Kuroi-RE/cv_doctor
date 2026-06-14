"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Ban,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listUsersAction,
  banUserAction,
  unbanUserAction,
  type UserRow,
} from "@/lib/actions/admin-users";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const result = await listUsersAction();
    if (result.error) {
      setError(result.error);
    } else {
      setUsers(result.data || []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleBan = async (user: UserRow) => {
    if (!confirm(`Ban ${user.email || user.full_name}? They will be immediately blocked from logging in.`))
      return;
    setActionLoading(user.id);
    setActionError(null);
    setActionSuccess(null);
    const result = await banUserAction(user.id, "");
    if (result.error) {
      setActionError(result.error);
    } else {
      setActionSuccess(result.success || "User banned.");
      loadUsers();
    }
    setActionLoading(null);
  };

  const handleUnban = async (user: UserRow) => {
    setActionLoading(user.id);
    setActionError(null);
    setActionSuccess(null);
    const result = await unbanUserAction(user.id);
    if (result.error) {
      setActionError(result.error);
    } else {
      setActionSuccess(result.success || "User unbanned.");
      loadUsers();
    }
    setActionLoading(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl">
          Manage Users
        </h1>
        <p className="mt-2 text-base font-medium text-gray-600">
          View all users and manage their access. Banned users cannot log in.
        </p>
      </div>

      {actionError && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border-4 border-red-500 bg-red-50 px-5 py-4 shadow-[4px_4px_0px_0px_#ef4444]">
          <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-600" />
          <p className="text-sm font-bold text-red-800">{actionError}</p>
        </div>
      )}

      {actionSuccess && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border-4 border-green-500 bg-green-50 px-5 py-4 shadow-[4px_4px_0px_0px_#22c55e]">
          <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-600" />
          <p className="text-sm font-bold text-green-800">{actionSuccess}</p>
        </div>
      )}

      {error && !actionError && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border-4 border-red-500 bg-red-50 px-5 py-4 shadow-[4px_4px_0px_0px_#ef4444]">
          <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-600" />
          <p className="text-sm font-bold text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2
            className="h-8 w-8 animate-spin text-yellow-500"
            strokeWidth={3}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000000]">
          {users.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="mx-auto mb-3 h-12 w-12 text-gray-300" strokeWidth={2} />
              <p className="text-sm font-bold text-gray-400">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-4 border-black bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-600">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-600">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-600">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-600">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wider text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-100">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className={`transition-colors ${
                        user.is_banned ? "bg-red-50" : "hover:bg-yellow-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black shadow-[1px_1px_0px_0px_#000000] ${
                              user.role === "superadmin"
                                ? "bg-purple-300"
                                : "bg-yellow-300"
                            }`}
                          >
                            {user.role === "superadmin" ? (
                              <ShieldCheck className="h-4 w-4" strokeWidth={3} />
                            ) : (
                              <Users className="h-4 w-4" strokeWidth={3} />
                            )}
                          </div>
                          <span className="text-sm font-bold text-black">
                            {user.full_name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-lg border-2 border-black px-2 py-0.5 text-xs font-black uppercase tracking-wider ${
                            user.role === "superadmin"
                              ? "bg-purple-200 text-purple-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.is_banned ? (
                          <span className="inline-flex items-center gap-1 rounded-lg border-2 border-red-600 bg-red-100 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-red-700">
                            <Ban className="h-3 w-3" />
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg border-2 border-green-600 bg-green-100 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {user.is_banned ? (
                          <Button
                            onClick={() => handleUnban(user)}
                            disabled={actionLoading === user.id}
                            className="h-9 rounded-lg border-4 border-black bg-green-200 px-3 text-xs font-black uppercase tracking-wider text-green-800 shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-green-300 hover:shadow-[1px_1px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-50"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ShieldCheck className="mr-1 h-3 w-3" />
                            )}
                            Unban
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleBan(user)}
                            disabled={
                              actionLoading === user.id ||
                              user.role === "superadmin"
                            }
                            className="h-9 rounded-lg border-4 border-black bg-red-100 px-3 text-xs font-black uppercase tracking-wider text-red-700 shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-red-200 hover:shadow-[1px_1px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] disabled:opacity-50"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ShieldX className="mr-1 h-3 w-3" />
                            )}
                            Ban
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
