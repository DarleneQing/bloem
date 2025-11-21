"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemListing } from "./ItemListing";
import { ItemDetailView } from "./ItemDetailView";
import { ItemStatusManager } from "./ItemStatusManager";
import { ItemAnalytics } from "./ItemAnalytics";
import { 
  Package, 
  CheckCircle,
  Store
} from "lucide-react";
import { type ItemStatus, type ItemCategory, type ItemCondition } from "@/types/items";
import { logger } from "@/lib/logger";

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

interface ItemStats {
  totalItems: number;
  wardrobeItems: number;
  rackItems: number;
  soldItems: number;
  totalValue: number;
  averagePrice: number;
  recentItems: number;
  categoryBreakdown: Record<string, number>;
  conditionBreakdown: Record<string, number>;
}

export function AdminItemManagement() {
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<ItemStats>({
    totalItems: 0,
    wardrobeItems: 0,
    rackItems: 0,
    soldItems: 0,
    totalValue: 0,
    averagePrice: 0,
    recentItems: 0,
    categoryBreakdown: {},
    conditionBreakdown: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("items");

  // Fetch items data
  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      logger.debug("Fetching items from /api/admin/items");
      const response = await fetch('/api/admin/items');
      logger.debug("Response status:", response.status);
      logger.debug("Response ok:", response.ok);
      
      const data = await response.json();
      logger.debug("Response data:", data);

      if (data.success) {
        logger.debug("Success! Setting items and stats");
        setItems(data.data.items || []);
        setStats(data.data.stats || {
          totalItems: 0,
          wardrobeItems: 0,
          rackItems: 0,
          soldItems: 0,
          totalValue: 0,
          averagePrice: 0,
          recentItems: 0,
          categoryBreakdown: {},
          conditionBreakdown: {}
        });
      } else {
        logger.debug("API returned success: false, error:", data.error);
        setError(data.error || "Failed to fetch items");
      }
    } catch (err) {
      logger.error("Items fetch error:", err);
      setError("An error occurred while fetching items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Handle item actions
  const handleViewItem = (item: Item) => {
    setSelectedItem(item);
    setShowItemDialog(true);
  };

  const handleDeleteItem = (item: Item) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const handleStatusChange = (itemId: string, newStatus: ItemStatus) => {
    // Update local state
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              status: newStatus, 
              updated_at: new Date().toISOString(),
              ...(newStatus === 'RACK' && { listed_at: new Date().toISOString() }),
              ...(newStatus === 'SOLD' && { sold_at: new Date().toISOString() })
            }
          : item
      )
    );
    
    // Update stats
    setStats(prevStats => {
      const updatedStats = { ...prevStats };
      
      // Find the item to get its current status
      const item = items.find(i => i.id === itemId);
      if (item) {
        // Decrease old status count
        if (item.status === "WARDROBE") updatedStats.wardrobeItems--;
        else if (item.status === "RACK") updatedStats.rackItems--;
        else if (item.status === "SOLD") updatedStats.soldItems--;
        
        // Increase new status count
        if (newStatus === "WARDROBE") updatedStats.wardrobeItems++;
        else if (newStatus === "RACK") updatedStats.rackItems++;
        else if (newStatus === "SOLD") updatedStats.soldItems++;
      }
      
      return updatedStats;
    });
    
    setSuccessMessage(`Item status updated to ${newStatus}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteConfirm = async (itemId: string) => {
    try {
      const response = await fetch(`/api/admin/items?itemId=${itemId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        // Remove item from local state
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));
        
        // Update stats
        setStats(prevStats => {
          const item = items.find(i => i.id === itemId);
          if (item) {
            const updatedStats = { ...prevStats };
            updatedStats.totalItems--;
            
            if (item.status === "WARDROBE") updatedStats.wardrobeItems--;
            else if (item.status === "RACK") updatedStats.rackItems--;
            else if (item.status === "SOLD") updatedStats.soldItems--;
            
            return updatedStats;
          }
          return prevStats;
        });
        
        setSuccessMessage("Item deleted successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || "Failed to delete item");
      }
    } catch (err) {
      setError("An error occurred while deleting the item");
    }
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
            <p className="text-lg font-medium">Error loading items</p>
            <p className="text-sm mt-2">{error}</p>
            <Button onClick={fetchItems} className="mt-4">
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
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-primary">{stats.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wardrobe Items</p>
                <p className="text-2xl font-bold text-gray-600">{stats.wardrobeItems}</p>
              </div>
              <Package className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rack Items</p>
                <p className="text-2xl font-bold text-blue-600">{stats.rackItems}</p>
              </div>
              <Store className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sold Items</p>
                <p className="text-2xl font-bold text-green-600">{stats.soldItems}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <ItemListing
            onViewItem={handleViewItem}
            onDeleteItem={handleDeleteItem}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="status">
          <ItemStatusManager />
        </TabsContent>

        <TabsContent value="analytics">
          <ItemAnalytics />
        </TabsContent>
      </Tabs>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50">
          {successMessage}
        </div>
      )}

      {/* Dialogs */}
      <ItemDetailView
        item={selectedItem}
        isOpen={showItemDialog}
        onClose={() => {
          setShowItemDialog(false);
          setSelectedItem(null);
        }}
        onDelete={handleDeleteItem}
        onStatusChange={handleStatusChange}
      />

      {/* Delete Confirmation Dialog */}
      {selectedItem && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showDeleteDialog ? 'block' : 'hidden'}`}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Item</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{selectedItem.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  handleDeleteConfirm(selectedItem.id);
                  setShowDeleteDialog(false);
                  setSelectedItem(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
