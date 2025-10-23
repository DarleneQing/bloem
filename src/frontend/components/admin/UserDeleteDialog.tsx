"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Trash2 } from "lucide-react";

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

interface UserDeleteDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string) => void;
}

export function UserDeleteDialog({ user, isOpen, onClose, onConfirm }: UserDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleConfirm = async () => {
    if (!user) return;
    
    if (confirmText !== "DELETE") {
      return;
    }

    try {
      setIsDeleting(true);
      await onConfirm(user.id);
      onClose();
    } catch (error) {
      console.error("Delete user error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete User
            </CardTitle>
            <CardDescription>
              This action cannot be undone
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Warning Message */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Warning</h4>
                <p className="text-sm text-red-700 mt-1">
                  Deleting this user will permanently remove their account and all associated data including:
                </p>
                <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                  <li>User profile and settings</li>
                  <li>All items and listings</li>
                  <li>Transaction history</li>
                  <li>Market participation</li>
                  <li>All other user data</li>
                </ul>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">User to be deleted:</h4>
            <div className="space-y-1">
              <p className="text-sm"><strong>Name:</strong> {user.first_name} {user.last_name}</p>
              <p className="text-sm"><strong>Email:</strong> {user.email}</p>
              <p className="text-sm"><strong>Role:</strong> {user.role}</p>
              <p className="text-sm"><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label htmlFor="confirm" className="text-sm font-medium">
              Type <code className="bg-gray-100 px-1 rounded">DELETE</code> to confirm:
            </label>
            <input
              id="confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="destructive" 
              onClick={handleConfirm}
              disabled={confirmText !== "DELETE" || isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                "Deleting..."
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
