"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserViewDialog } from "./UserViewDialog";
import { UserEditDialog } from "./UserEditDialog";
import { UserDeleteDialog } from "./UserDeleteDialog";
import { 
  Calendar, 
  Table, 
  Clock, 
  Search, 
  Filter, 
  Users, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck,
  UserX,
  Shield,
  Mail
} from "lucide-react";

// Types for user data
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
  last_sign_in_at?: string;
  is_active_seller?: boolean;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  verifiedSellers: number;
  recentSignups: number;
}

export function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    verifiedSellers: 0,
    recentSignups: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      console.log("Fetching users from /api/admin/users");
      const response = await fetch('/api/admin/users');
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        console.log("Success! Setting users and stats");
        setUsers(data.data.users || []);
        setStats(data.data.stats || {
          totalUsers: 0,
          activeUsers: 0,
          adminUsers: 0,
          verifiedSellers: 0,
          recentSignups: 0
        });
      } else {
        console.log("API returned success: false, error:", data.error);
        setError(data.error || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Users fetch error:", err);
      setError("An error occurred while fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle dropdown toggle and click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const dropdownElement = document.querySelector(`[data-dropdown-id="${openDropdown}"]`);
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    
    return undefined;
  }, [openDropdown]);

  const handleDropdownToggle = (userId: string) => {
    setOpenDropdown(openDropdown === userId ? null : userId);
  };

  // Filter and paginate users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone && user.phone.includes(searchQuery))
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "verified_sellers") {
        filtered = filtered.filter(user => user.iban_verified_at);
      } else if (statusFilter === "active_sellers") {
        filtered = filtered.filter(user => user.is_active_seller);
      } else if (statusFilter === "recent") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered.filter(user => 
          new Date(user.created_at) > sevenDaysAgo
        );
      }
    }

    return filtered;
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle user actions
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
    // Update local state instead of refetching
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      )
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
        // Remove user from local state instead of refetching
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setSuccessMessage("User deleted successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || "Failed to delete user");
      }
    } catch (err) {
      setError("An error occurred while deleting the user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "USER" | "ADMIN") => {
    try {
      setActionLoading(userId);
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state instead of refetching
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, role: newRole, updated_at: new Date().toISOString() }
              : user
          )
        );
        setSuccessMessage(`User role updated to ${newRole}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || "Failed to update user role");
      }
    } catch (err) {
      setError("An error occurred while updating user role");
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
        // Update local state instead of refetching
        const user = users.find(u => u.id === userId);
        if (user) {
          const newVerificationStatus = user.iban_verified_at ? null : new Date().toISOString();
          setUsers(prevUsers => 
            prevUsers.map(u => 
              u.id === userId 
                ? { ...u, iban_verified_at: newVerificationStatus, updated_at: new Date().toISOString() }
                : u
            )
          );
        }
        setSuccessMessage("Seller status updated successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        // Handle specific error cases
        if (data.error && data.error.includes("complete seller information")) {
          setError("Cannot verify seller: User must complete seller information (IBAN, bank name, account holder name) first. Please edit the user to add missing information.");
        } else {
          setError(data.error || "Failed to update seller status");
        }
      }
    } catch (err) {
      setError("An error occurred while updating seller status");
    } finally {
      setActionLoading(null);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">User</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Email</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Role</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Seller</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Joined</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.map(user => (
            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={`${user.first_name} ${user.last_name}`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{user.first_name} {user.last_name}</div>
                    <div className="text-sm text-gray-500">{user.phone || "No phone"}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{user.email}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === "ADMIN" 
                      ? "bg-purple-100 text-purple-700" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {user.role}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.wardrobe_status === "PUBLIC" 
                    ? "bg-green-100 text-green-700" 
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {user.wardrobe_status}
                </span>
              </td>
              <td className="py-3 px-4">
                {user.iban_verified_at ? (
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Not verified</span>
                  </div>
                )}
              </td>
              <td className="py-3 px-4 text-gray-600">{formatDate(user.created_at)}</td>
               <td className="py-3 px-4">
                 <div className="relative">
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => handleDropdownToggle(user.id)}
                   >
                     <MoreVertical className="h-4 w-4" />
                   </Button>
                   
                   {openDropdown === user.id && (
                     <div 
                       data-dropdown-id={user.id}
                       className="absolute right-0 top-10 z-[9999] w-48 bg-white border border-gray-200 rounded-lg shadow-xl"
                       onClick={(e) => e.stopPropagation()}
                     >
                       <div className="py-2">
                         {/* View Action */}
                         <button
                           onClick={() => {
                             handleViewUser(user);
                             setOpenDropdown(null);
                           }}
                           className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-all duration-200"
                         >
                           <Eye className="h-4 w-4" />
                           View User
                         </button>

                         {/* Edit Action */}
                         <button
                           onClick={() => {
                             handleEditUser(user);
                             setOpenDropdown(null);
                           }}
                           className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-all duration-200"
                         >
                           <Edit className="h-4 w-4" />
                           Edit User
                         </button>

                         {/* Role Change Actions */}
                         {user.role === "USER" ? (
                           <button
                             onClick={() => {
                               handleRoleChange(user.id, "ADMIN");
                               setOpenDropdown(null);
                             }}
                             disabled={actionLoading === user.id}
                             className="w-full px-4 py-2 text-left text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-3 transition-all duration-200 disabled:opacity-50"
                           >
                             <Shield className="h-4 w-4" />
                             Make Admin
                           </button>
                         ) : (
                           <button
                             onClick={() => {
                               handleRoleChange(user.id, "USER");
                               setOpenDropdown(null);
                             }}
                             disabled={actionLoading === user.id}
                             className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-all duration-200 disabled:opacity-50"
                           >
                             <Users className="h-4 w-4" />
                             Make User
                           </button>
                         )}

                         {/* Seller Status Toggle */}
                         <button
                           onClick={() => {
                             handleToggleSellerStatus(user.id);
                             setOpenDropdown(null);
                           }}
                           disabled={actionLoading === user.id || (!user.iban_verified_at && (!user.iban || !user.bank_name || !user.account_holder_name))}
                           className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-all duration-200 ${
                             actionLoading === user.id || (!user.iban_verified_at && (!user.iban || !user.bank_name || !user.account_holder_name))
                               ? "text-gray-400 cursor-not-allowed"
                               : user.iban_verified_at 
                                 ? "text-blue-600 hover:bg-blue-50" 
                                 : "text-green-600 hover:bg-green-50"
                           }`}
                           title={
                             !user.iban_verified_at && (!user.iban || !user.bank_name || !user.account_holder_name)
                               ? "Cannot verify: Missing seller information (IBAN, bank name, or account holder name)"
                               : undefined
                           }
                         >
                           {user.iban_verified_at ? (
                             <>
                               <UserX className="h-4 w-4" />
                               Unverify Seller
                             </>
                           ) : (
                             <>
                               <UserCheck className="h-4 w-4" />
                               Verify Seller
                             </>
                           )}
                         </button>

                         {/* Delete Action */}
                         <div className="border-t border-gray-100 my-1"></div>
                         <button
                           onClick={() => {
                             handleDeleteUser(user);
                             setOpenDropdown(null);
                           }}
                           className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-all duration-200"
                         >
                           <Trash2 className="h-4 w-4" />
                           Delete User
                         </button>
                       </div>
                     </div>
                   )}
                 </div>
               </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const CalendarView = () => {
    const daysInMonth = 31;
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return (
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">October 2025</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
          {days.map(day => {
            const dayUsers = users.filter(user => {
              const userDate = new Date(user.created_at);
              return userDate.getDate() === day;
            });
            
            return (
              <div key={day} className="border border-gray-200 rounded-lg p-2 min-h-24 hover:bg-gray-50 transition-colors">
                <div className="text-sm font-medium mb-1">{day}</div>
                {dayUsers.map(user => (
                  <div key={user.id} className="text-xs bg-blue-100 text-blue-700 rounded p-1 mb-1">
                    {user.first_name} {user.last_name}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const TimelineView = () => {
    const recentUsers = users
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return (
      <div className="p-4">
        <div className="space-y-4">
          {recentUsers.map((user, idx) => (
            <div key={user.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                {idx < recentUsers.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
              </div>
              <div className="flex-1 pb-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{formatDate(user.created_at)}</span>
                  <span className="text-sm text-gray-500">{new Date(user.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="text-gray-700">
                  <strong>{user.first_name} {user.last_name}</strong> joined the platform
                </div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="text-lg font-medium">Error loading users</p>
            <p className="text-sm mt-2">{error}</p>
            <Button onClick={fetchUsers} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-primary">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admin Users</p>
                <p className="text-2xl font-bold text-purple-600">{stats.adminUsers}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified Sellers</p>
                <p className="text-2xl font-bold text-green-600">{stats.verifiedSellers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Signups</p>
                <p className="text-2xl font-bold text-blue-600">{stats.recentSignups}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-6">
           <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
             {/* Search and Filters */}
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
               {/* Search */}
               <div className="relative flex-1 min-w-0">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input
                   type="text"
                   placeholder="Search users..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                 />
               </div>
               
               {/* Filters Row */}
               <div className="flex items-center gap-2 flex-wrap">
                 <select
                   value={roleFilter}
                   onChange={(e) => setRoleFilter(e.target.value)}
                   className="px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm min-w-0"
                 >
                   <option value="all">All Roles</option>
                   <option value="USER">Users</option>
                   <option value="ADMIN">Admins</option>
                 </select>
                 
                 <select
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value)}
                   className="px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm min-w-0"
                 >
                   <option value="all">All Status</option>
                   <option value="verified_sellers">Verified Sellers</option>
                   <option value="active_sellers">Active Sellers</option>
                   <option value="recent">Recent Signups</option>
                 </select>
                 
                 <Button variant="outline" size="sm" className="hidden sm:flex">
                   <Filter className="w-4 h-4 mr-2" />
                   More Filters
                 </Button>
                 
                 <Button variant="outline" size="sm" className="sm:hidden">
                   <Filter className="w-4 h-4" />
                 </Button>
               </div>
             </div>
             
             {/* View Mode Toggle - Always on the right */}
             <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 ml-auto">
               <Button
                 variant={viewMode === "table" ? "default" : "ghost"}
                 size="sm"
                 onClick={() => setViewMode("table")}
                 title="Table View"
               >
                 <Table className="w-4 h-4" />
               </Button>
               <Button
                 variant={viewMode === "calendar" ? "default" : "ghost"}
                 size="sm"
                 onClick={() => setViewMode("calendar")}
                 title="Calendar View"
               >
                 <Calendar className="w-4 h-4" />
               </Button>
               <Button
                 variant={viewMode === "timeline" ? "default" : "ghost"}
                 size="sm"
                 onClick={() => setViewMode("timeline")}
                 title="Timeline View"
               >
                 <Clock className="w-4 h-4" />
               </Button>
             </div>
           </div>

          {/* Main Content */}
          {viewMode === "table" && <TableView />}
          {viewMode === "calendar" && <CalendarView />}
          {viewMode === "timeline" && <TimelineView />}

          {/* Results count and pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {paginatedUsers.length} of {filteredUsers.length} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50">
          {successMessage}
        </div>
      )}

      {/* Dialogs */}
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
