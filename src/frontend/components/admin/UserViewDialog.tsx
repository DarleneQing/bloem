"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  UserCheck, 
  UserX, 
  Calendar,
  Clock,
  CreditCard,
  Building
} from "lucide-react";

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
}

interface UserViewDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserViewDialog({ user, isOpen, onClose, onEdit, onDelete }: UserViewDialogProps) {
  if (!isOpen || !user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getRoleColor = (role: string) => {
    return role === "ADMIN" 
      ? "bg-purple-100 text-purple-700" 
      : "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status: string) => {
    return status === "PUBLIC" 
      ? "bg-green-100 text-green-700" 
      : "bg-gray-100 text-gray-700";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={`${user.first_name} ${user.last_name}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                ) : (
                  <UserCheck className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user.first_name} {user.last_name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </CardTitle>
            <CardDescription className="mt-2">
              User details and account information
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-gray-600">{user.phone || "Not provided"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-gray-600">{user.address || "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Account Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <UserCheck className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Wardrobe Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.wardrobe_status)}`}>
                    {user.wardrobe_status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Seller Information */}
          {user.iban && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Seller Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">IBAN</p>
                    <p className="text-sm text-gray-600 font-mono">{user.iban}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Bank Name</p>
                    <p className="text-sm text-gray-600">{user.bank_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <UserCheck className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Account Holder</p>
                    <p className="text-sm text-gray-600">{user.account_holder_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Verification Status</p>
                    {user.iban_verified_at ? (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Verified</span>
                        <span className="text-xs text-gray-500">
                          ({formatDate(user.iban_verified_at)})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserX className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Not verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Dates */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Account Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-gray-600">{formatDate(user.created_at)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-gray-600">{formatDate(user.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={() => onEdit(user)} className="flex-1">
              Edit User
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => onDelete(user)}
              className="flex-1"
            >
              Delete User
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
