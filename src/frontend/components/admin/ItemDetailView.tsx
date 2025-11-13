"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Package, 
  User, 
  Calendar, 
  Euro, 
  Tag, 
  Palette, 
  Ruler, 
  Star,
  Store,
  CheckCircle,
  AlertCircle,
  Trash2,
  X
} from "lucide-react";
import { ITEM_CATEGORIES, ITEM_CONDITIONS, type ItemStatus, type ItemCategory, type ItemCondition } from "@/types/items";

// Types for item data
interface Item {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  brand: string | null;
  category: ItemCategory;
  size: string | null;
  condition: ItemCondition;
  color: string | null;
  selling_price: number | null;
  status: ItemStatus;
  image_urls: string[];
  thumbnail_url: string;
  market_id: string | null;
  listed_at: string | null;
  sold_at: string | null;
  buyer_id: string | null;
  created_at: string;
  updated_at: string;
  owner: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  buyer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  market?: {
    id: string;
    name: string;
    location_name: string;
    location_address: string;
  };
}

interface ItemDetailViewProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (item: Item) => void;
  onStatusChange: (itemId: string, newStatus: ItemStatus) => void;
}

export function ItemDetailView({ 
  item, 
  isOpen, 
  onClose, 
  onDelete, 
  onStatusChange 
}: ItemDetailViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!item) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Not set";
    return `CHF ${price.toFixed(2)}`;
  };

  const getStatusIcon = (status: ItemStatus) => {
    switch (status) {
      case "WARDROBE":
        return <Package className="w-5 h-5 text-gray-500" />;
      case "RACK":
        return <Store className="w-5 h-5 text-blue-500" />;
      case "SOLD":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ItemStatus) => {
    switch (status) {
      case "WARDROBE":
        return "bg-gray-100 text-gray-700";
      case "RACK":
        return "bg-blue-100 text-blue-700";
      case "SOLD":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getConditionStars = (condition: string) => {
    const conditionMap: Record<string, number> = {
      "NEW_WITH_TAGS": 5,
      "LIKE_NEW": 4,
      "EXCELLENT": 3,
      "GOOD": 2,
      "FAIR": 1,
    };
    
    const stars = conditionMap[condition] || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < stars ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const handleStatusChange = async (newStatus: ItemStatus) => {
    try {
      setActionLoading(newStatus);
      const response = await fetch('/api/admin/items', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          updates: { 
            status: newStatus,
            ...(newStatus === 'RACK' && { listed_at: new Date().toISOString() }),
            ...(newStatus === 'SOLD' && { sold_at: new Date().toISOString() })
          }
        }),
      });

      const data = await response.json();
      if (data.success) {
        onStatusChange(item.id, newStatus);
        onClose();
      }
    } catch (err) {
      console.error("Error updating item status:", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{item.title}</DialogTitle>
              <DialogDescription className="text-lg">
                {item.brand || "No brand"} • {ITEM_CATEGORIES.find(c => c.value === item.category)?.label || item.category}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(item.status)}
              <Badge className={getStatusColor(item.status)}>
                {item.status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Images Section */}
          <div className="space-y-4">
            <div className="aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden">
              {item.image_urls && item.image_urls.length > 0 ? (
                <Image
                  src={item.image_urls[currentImageIndex]}
                  alt={item.title}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
            
            {item.image_urls && item.image_urls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {item.image_urls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      index === currentImageIndex ? "border-primary" : "border-gray-200"
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`${item.title} ${index + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{item.description || "No description provided"}</p>
              </CardContent>
            </Card>

            {/* Item Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">{ITEM_CATEGORIES.find(c => c.value === item.category)?.label || item.category}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Size</p>
                      <p className="font-medium">{item.size || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Color</p>
                      <p className="font-medium">{item.color || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Euro className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium">{formatPrice(item.selling_price)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Condition</p>
                    <div className="flex items-center gap-1">
                      <span className="font-medium mr-2">
                        {ITEM_CONDITIONS.find(c => c.value === item.condition)?.label || item.condition}
                      </span>
                      {getConditionStars(item.condition)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Owner Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {item.owner.avatar_url ? (
                      <Image 
                        src={item.owner.avatar_url} 
                        alt={`${item.owner.first_name} ${item.owner.last_name}`}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{item.owner.first_name} {item.owner.last_name}</p>
                    <p className="text-sm text-gray-500">{item.owner.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buyer Information (if sold) */}
            {item.status === "SOLD" && item.buyer && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Buyer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{item.buyer.first_name} {item.buyer.last_name}</p>
                      <p className="text-sm text-gray-500">{item.buyer.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Market Information (if listed) */}
            {item.market && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Market Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{item.market.name}</p>
                    <p className="text-sm text-gray-500">{item.market.location_name}</p>
                    <p className="text-sm text-gray-500">{item.market.location_address}</p>
                  </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{formatDate(item.created_at)}</p>
                  </div>
                </div>
                
                {item.listed_at && (
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Listed</p>
                      <p className="font-medium">{formatDate(item.listed_at)}</p>
                    </div>
                  </div>
                )}
                
                {item.sold_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Sold</p>
                      <p className="font-medium">{formatDate(item.sold_at)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onDelete(item)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Item
            </Button>
          </div>
          
          <div className="flex gap-2">
            {item.status !== "WARDROBE" && (
              <Button 
                variant="outline" 
                onClick={() => handleStatusChange("WARDROBE")}
                disabled={actionLoading === "WARDROBE"}
              >
                <Package className="w-4 h-4 mr-2" />
                Move to Wardrobe
              </Button>
            )}
            
            {item.status !== "RACK" && (
              <Button 
                variant="outline" 
                onClick={() => handleStatusChange("RACK")}
                disabled={actionLoading === "RACK"}
              >
                <Store className="w-4 h-4 mr-2" />
                Move to Rack
              </Button>
            )}
            
            {item.status !== "SOLD" && (
              <Button 
                onClick={() => handleStatusChange("SOLD")}
                disabled={actionLoading === "SOLD"}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Sold
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
