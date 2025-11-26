"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, AlertCircle } from "lucide-react";

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

interface UserEditDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export function UserEditDialog({ user, isOpen, onClose, onSuccess }: UserEditDialogProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    role: "USER" as "USER" | "ADMIN",
    wardrobe_status: "PUBLIC" as "PUBLIC" | "PRIVATE",
    iban: "",
    bank_name: "",
    account_holder_name: ""
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        address: user.address || "",
        role: user.role,
        wardrobe_status: user.wardrobe_status,
        iban: user.iban || "",
        bank_name: user.bank_name || "",
        account_holder_name: user.account_holder_name || ""
      });
    }
  }, [user]);

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    if (formData.iban && !/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(formData.iban)) {
      newErrors.iban = "Invalid IBAN format";
    }

    if (formData.bank_name && formData.bank_name.length < 2) {
      newErrors.bank_name = "Bank name must be at least 2 characters";
    }

    if (formData.account_holder_name && formData.account_holder_name.length < 2) {
      newErrors.account_holder_name = "Account holder name must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(data.data.user);
        onClose();
      } else {
        setSubmitError(data.error || "Failed to update user");
      }
    } catch (err) {
      setSubmitError("An error occurred while updating the user");
      console.error("Update user error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Edit User</CardTitle>
            <CardDescription>
              Update user information and account settings
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{submitError}</span>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name *
                </Label>
                <Input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  className={`px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.first_name ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name *
                </Label>
                <Input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  className={`px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.last_name ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-600">{errors.last_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1234567890"
                  className={`px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.phone ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Address
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows={3}
                  placeholder="Enter full address"
                  className={`px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.address ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {errors.address && (
                  <p className="text-sm text-red-600">{errors.address}</p>
                )}
              </div>
            </div>

            {/* Account Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Account Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">
                    Role
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                    <SelectTrigger className="px-3 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wardrobe_status">
                    Wardrobe Status
                  </Label>
                  <Select value={formData.wardrobe_status} onValueChange={(value) => handleInputChange("wardrobe_status", value)}>
                    <SelectTrigger className="px-3 py-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Seller Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Seller Information</h3>
              <p className="text-sm text-gray-600">
                Seller information is used for payouts and verification.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="iban">
                  IBAN
                </Label>
                <Input
                  id="iban"
                  type="text"
                  value={formData.iban}
                  onChange={(e) => handleInputChange("iban", e.target.value.toUpperCase())}
                  placeholder="DE89370400440532013000"
                  className={`px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.iban ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {errors.iban && (
                  <p className="text-sm text-red-600">{errors.iban}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_name">
                  Bank Name
                </Label>
                <Input
                  id="bank_name"
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => handleInputChange("bank_name", e.target.value)}
                  placeholder="Deutsche Bank"
                  className={`px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.bank_name ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {errors.bank_name && (
                  <p className="text-sm text-red-600">{errors.bank_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_holder_name">
                  Account Holder Name
                </Label>
                <Input
                  id="account_holder_name"
                  type="text"
                  value={formData.account_holder_name}
                  onChange={(e) => handleInputChange("account_holder_name", e.target.value)}
                  placeholder="John Doe"
                  className={`px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.account_holder_name ? "border-red-300" : "border-gray-200"
                  }`}
                />
                {errors.account_holder_name && (
                  <p className="text-sm text-red-600">{errors.account_holder_name}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Updating..." : "Update User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
