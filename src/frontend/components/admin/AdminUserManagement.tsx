"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserViewDialog } from "./UserViewDialog";
import { UserEditDialog } from "./UserEditDialog";
import { UserDeleteDialog } from "./UserDeleteDialog";
import {
  ArrowLeft,
  ArrowUpDown,
  CheckCircle2,
  Eye,
  Filter,
  Flag,
  MessageCircle,
  MinusCircle,
  Search,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  role: "USER" | "ADMIN";
  wardrobe_status: "PUBLIC" | "PRIVATE";
  iban?: string;
  bank_name?: string;
  account_holder_name?: string;
  iban_verified_at?: string | null;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_active_seller?: boolean;
  item_count?: number;
  total_sales?: number;
  total_spent?: number;
}

type CategoryFilter = "all" | "sellers" | "buyers" | "flagged" | "verified";
type SortOption = "name" | "newest" | "items";

const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "sellers", label: "Sellers" },
  { id: "buyers", label: "Buyers" },
  { id: "flagged", label: "Flagged" },
  { id: "verified", label: "Verified" },
];

const ITEMS_PER_PAGE = 10;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function isFlaggedUser(user: User) {
  const hasSellerInfo = Boolean(
    user.iban || user.bank_name || user.account_holder_name
  );
  return hasSellerInfo && !user.iban_verified_at;
}

function isVerifiedSeller(user: User) {
  return Boolean(user.iban_verified_at);
}

function getUserRoleLabel(user: User) {
  if (user.role === "ADMIN") return "Admin";
  if (isVerifiedSeller(user)) return "Seller";
  return "Buyer";
}

interface UserCardProps {
  user: User;
  actionLoading: string | null;
  onView: (user: User) => void;
  onVerify: (userId: string) => void;
  onSuspend: (user: User) => void;
  onMessage: (user: User) => void;
}

function UserCard({
  user,
  actionLoading,
  onView,
  onVerify,
  onSuspend,
  onMessage,
}: UserCardProps) {
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const verified = isVerifiedSeller(user);
  const flagged = isFlaggedUser(user);
  const suspended = user.wardrobe_status === "PRIVATE";
  const isSeller = verified;
  const canVerify =
    !verified &&
    Boolean(user.iban && user.bank_name && user.account_holder_name);
  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
  const roleLabel = getUserRoleLabel(user);

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-gray-100 px-4 py-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-brand-lavender/30">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={fullName}
              fill
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-brand-purple">
              {initials || "?"}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-gray-900">{fullName}</h3>
            {verified && (
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-emerald-500"
                aria-label="Verified seller"
              />
            )}
            {flagged && (
              <Flag
                className="h-4 w-4 shrink-0 text-amber-500"
                aria-label="Flagged — pending verification"
              />
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            roleLabel === "Seller" && "bg-brand-lavender/40 text-brand-purple",
            roleLabel === "Buyer" && "bg-emerald-50 text-emerald-700",
            roleLabel === "Admin" && "bg-brand-purple/10 text-brand-purple"
          )}
        >
          {roleLabel}
        </span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 px-2 py-3">
        <div className="px-2 text-center">
          <p className="text-lg font-bold text-brand-purple">
            {user.item_count ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Items</p>
        </div>
        <div className="px-2 text-center">
          <p className="text-lg font-bold text-brand-purple">
            {isSeller
              ? formatCurrency(user.total_sales ?? 0)
              : formatCurrency(user.total_spent ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground">
            {isSeller ? "Total Sales" : "Total Spent"}
          </p>
        </div>
        <div className="px-2 text-center">
          {verified ? (
            <>
              <p className="text-sm font-semibold text-emerald-600">Verified</p>
              <p className="text-xs text-muted-foreground">ID Verified</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-amber-600">Unverified</p>
              <p className="text-xs text-muted-foreground">ID Not Verified</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100">
        <button
          type="button"
          onClick={() => onView(user)}
          className="flex flex-col items-center gap-1 py-3 text-sm text-gray-600 transition-colors hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" />
          View
        </button>

        {canVerify ? (
          <button
            type="button"
            onClick={() => onVerify(user.id)}
            disabled={actionLoading === user.id}
            className="flex flex-col items-center gap-1 py-3 text-sm text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
          >
            <UserCheck className="h-4 w-4" />
            Verify
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSuspend(user)}
            disabled={actionLoading === user.id}
            className="flex flex-col items-center gap-1 py-3 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <MinusCircle className="h-4 w-4" />
            {suspended ? "Unsuspend" : "Suspend"}
          </button>
        )}

        {flagged ? (
          <button
            type="button"
            onClick={() => onSuspend(user)}
            disabled={actionLoading === user.id}
            className="flex flex-col items-center gap-1 py-3 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <MinusCircle className="h-4 w-4" />
            Suspend
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onMessage(user)}
            className="flex flex-col items-center gap-1 py-3 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </button>
        )}
      </div>
    </article>
  );
}

function UserCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex gap-3 border-b border-gray-100 px-4 py-3">
        <div className="h-12 w-12 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="h-3 w-48 rounded bg-gray-200" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 border-b border-gray-100 px-4 py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="mx-auto h-10 w-16 rounded bg-gray-200" />
        ))}
      </div>
      <div className="h-12 bg-gray-100" />
    </div>
  );
}

export function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/users?limit=500");
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users || []);
      } else {
        setError(data.error || "Failed to fetch users");
      }
    } catch (err) {
      logger.error("Users fetch error:", err);
      setError("An error occurred while fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, sortBy]);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.first_name.toLowerCase().includes(q) ||
          user.last_name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          (user.phone && user.phone.includes(searchQuery))
      );
    }

    if (categoryFilter === "sellers") {
      filtered = filtered.filter((user) => isVerifiedSeller(user));
    } else if (categoryFilter === "buyers") {
      filtered = filtered.filter((user) => !isVerifiedSeller(user));
    } else if (categoryFilter === "flagged") {
      filtered = filtered.filter((user) => isFlaggedUser(user));
    } else if (categoryFilter === "verified") {
      filtered = filtered.filter((user) => isVerifiedSeller(user));
    }

    const sorted = [...filtered];
    if (sortBy === "name") {
      sorted.sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(
          `${b.first_name} ${b.last_name}`
        )
      );
    } else if (sortBy === "items") {
      sorted.sort((a, b) => (b.item_count ?? 0) - (a.item_count ?? 0));
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return sorted;
  }, [users, searchQuery, categoryFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleEditSuccess = (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
    setSuccessMessage("User updated successfully");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteConfirm = async (userId: string) => {
    try {
      setActionLoading(userId);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        setSuccessMessage("User deleted successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || "Failed to delete user");
      }
    } catch {
      setError("An error occurred while deleting the user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSellerStatus = async (userId: string) => {
    try {
      setActionLoading(userId);
      const response = await fetch(`/api/admin/users/${userId}/seller-status`, {
        method: "PATCH",
      });
      const data = await response.json();
      if (data.success) {
        const user = users.find((u) => u.id === userId);
        if (user) {
          const newVerificationStatus = user.iban_verified_at
            ? null
            : new Date().toISOString();
          setUsers((prev) =>
            prev.map((u) =>
              u.id === userId
                ? {
                    ...u,
                    iban_verified_at: newVerificationStatus,
                    is_active_seller: Boolean(newVerificationStatus),
                    updated_at: new Date().toISOString(),
                  }
                : u
            )
          );
        }
        setSuccessMessage("Seller status updated successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (
        data.error &&
        data.error.includes("complete seller information")
      ) {
        setError(
          "Cannot verify seller: user must complete IBAN, bank name, and account holder name first."
        );
      } else {
        setError(data.error || "Failed to update seller status");
      }
    } catch {
      setError("An error occurred while updating seller status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (user: User) => {
    const newStatus = user.wardrobe_status === "PRIVATE" ? "PUBLIC" : "PRIVATE";
    try {
      setActionLoading(user.id);
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone ?? null,
          address: user.address ?? null,
          role: user.role,
          wardrobe_status: newStatus,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, wardrobe_status: newStatus } : u
          )
        );
        setSuccessMessage(
          newStatus === "PRIVATE"
            ? "User suspended (wardrobe set to private)"
            : "User unsuspended"
        );
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || "Failed to update user status");
      }
    } catch {
      setError("An error occurred while updating user status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMessage = (user: User) => {
    window.location.href = `mailto:${user.email}`;
  };

  const sortLabel =
    sortBy === "name"
      ? "Name"
      : sortBy === "items"
        ? "Most items"
        : "Newest";

  return (
    <div className="mx-auto w-full max-w-lg md:max-w-2xl">
      <header className="mb-4 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/admin" aria-label="Back to admin dashboard">
            <ArrowLeft className="h-5 w-5 text-brand-purple" />
          </Link>
        </Button>
        <h1 className="flex-1 text-center text-lg font-bold text-brand-purple">
          User Management
        </h1>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Focus search"
          onClick={() =>
            document.getElementById("admin-user-search")?.focus()
          }
        >
          <Filter className="h-5 w-5 text-brand-purple" />
        </Button>
      </header>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="admin-user-search"
          type="search"
          placeholder="Search users by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 rounded-xl border-gray-200 bg-white pl-9 shadow-sm"
        />
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORY_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setCategoryFilter(filter.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              categoryFilter === filter.id
                ? "bg-brand-purple text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:border-brand-lavender"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {filteredUsers.length.toLocaleString()} user
          {filteredUsers.length === 1 ? "" : "s"} found
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSortMenu((open) => !open)}
            className="flex items-center gap-1 text-sm font-medium text-brand-purple"
          >
            <ArrowUpDown className="h-4 w-4" />
            Sort: {sortLabel}
          </button>
          {showSortMenu && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                aria-label="Close sort menu"
                onClick={() => setShowSortMenu(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {(
                  [
                    { id: "newest", label: "Newest" },
                    { id: "name", label: "Name (A–Z)" },
                    { id: "items", label: "Most items" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSortBy(option.id);
                      setShowSortMenu(false);
                    }}
                    className={cn(
                      "block w-full px-4 py-2 text-left text-sm hover:bg-gray-50",
                      sortBy === option.id && "font-medium text-brand-purple"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
          <Button
            variant="link"
            className="h-auto p-0 text-red-700"
            onClick={() => {
              setError(null);
              fetchUsers();
            }}
          >
            Try again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      ) : paginatedUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <p className="font-medium text-gray-900">No users match your filters</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search or category.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              actionLoading={actionLoading}
              onView={handleViewUser}
              onVerify={handleToggleSellerStatus}
              onSuspend={handleSuspend}
              onMessage={handleMessage}
            />
          ))}
        </div>
      )}

      {!loading && filteredUsers.length > ITEMS_PER_PAGE && (
        <div className="mt-6 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          {successMessage}
        </div>
      )}

      <UserViewDialog
        user={selectedUser}
        isOpen={showUserDialog}
        onClose={() => {
          setShowUserDialog(false);
          setSelectedUser(null);
        }}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />

      <UserEditDialog
        user={selectedUser}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedUser(null);
        }}
        onSuccess={handleEditSuccess}
      />

      <UserDeleteDialog
        user={selectedUser}
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
