"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getQRBatches } from "@/features/qr-batches/queries";
import { deleteQRBatch } from "@/features/qr-batches/actions";
import { generateQRCodePDF, downloadPDF, generatePDFFilename, type QRCodePDFData, type BatchInfo } from "@/lib/qr/pdf-export";
import { QRBatchStats } from "./QRBatchStats";
import { QRBatchCreationForm } from "./QRBatchCreationForm";
import type { QRBatchWithStats } from "@/types/qr-codes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus,
  Search,
  Download,
  Eye,
  Package,
  QrCode,
  Trash2
} from "lucide-react";

export function QRBatchManagement() {
  const [batches, setBatches] = useState<QRBatchWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [marketFilter, setMarketFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState("batches");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<QRBatchWithStats | null>(null);
  const [exportingBatch, setExportingBatch] = useState<string | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<QRBatchWithStats | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getQRBatches({
        page: pagination.page,
        limit: pagination.limit,
        marketId: marketFilter || undefined,
        prefix: searchTerm || undefined,
      });
      
      setBatches(data.batches);
      setPagination(data.pagination);
    } catch (err) {
      setError("Failed to fetch QR batches");
      console.error("Error fetching batches:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, marketFilter, searchTerm]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleBatchCreated = async () => {
    setShowCreateForm(false);
    await fetchBatches();
    setActiveTab("batches");
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;

    try {
      setDeletingBatch(batchToDelete.id);
      setDeleteError(null);

      const result = await deleteQRBatch(batchToDelete.id);

      if (result.error) {
        setDeleteError(result.error);
      } else {
        setBatchToDelete(null);
        await fetchBatches();
        // Clear selected batch if it was deleted
        if (selectedBatch?.id === batchToDelete.id) {
          setSelectedBatch(null);
        }
      }
    } catch (err) {
      setDeleteError("Failed to delete batch");
      console.error("Error deleting batch:", err);
    } finally {
      setDeletingBatch(null);
    }
  };

  const handleExportPDF = async (batchId: string) => {
    try {
      setExportingBatch(batchId);
      // Use the API endpoint to get QR code data
      const res = await fetch(`/api/admin/qr-batches/${batchId}/export`, {
        cache: "no-store",
      });
      const json = await res.json();
      
      if (!json?.success) {
        setError(json.error || "Failed to export QR batch");
        return;
      }

      const { batch, qrCodes } = json.data;
      
      // Import QR generation utilities dynamically (client-side only)
      const { generateBatchQRCodeImages } = await import("@/lib/qr/generation");
      
      // Generate QR code images on client side
      const qrCodeImages = await generateBatchQRCodeImages(
        qrCodes,
        { width: 300, margin: 2 }
      );
      
      // Generate PDF on client side
      const pdfBlob = await generateQRCodePDF(
        qrCodeImages as QRCodePDFData[],
        batch as BatchInfo
      );
      
      // Download PDF
      const filename = generatePDFFilename(batch as BatchInfo);
      downloadPDF(pdfBlob, filename);
    } catch (err) {
      setError("Failed to export PDF");
      console.error("Error exporting PDF:", err);
    } finally {
      setExportingBatch(null);
    }
  };

  const filteredBatches = batches.filter((batch) => {
    if (searchTerm && !batch.prefix.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !(batch.name && batch.name.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">QR Code Batches</h2>
              <p className="text-muted-foreground">
                Generate and manage QR code batches for markets
              </p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Batch
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                 <div className="flex-1">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                     <input
                       type="text"
                       placeholder="Search by prefix or name..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                     />
                   </div>
                 </div>
                <div className="w-48">
                  <input
                    type="text"
                    placeholder="Filter by market ID..."
                    value={marketFilter}
                    onChange={(e) => setMarketFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Batches List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredBatches.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No QR batches found</p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-4"
                  variant="outline"
                >
                  Create Your First Batch
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBatches.map((batch) => (
                <Card key={batch.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{batch.name || batch.prefix}</span>
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>
                      Prefix: {batch.prefix}
                      {batch.market && (
                        <span className="block text-xs mt-1">
                          Market: {batch.market.name}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Codes:</span>
                        <span className="font-medium">{batch.code_count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Unused:</span>
                        <span>{batch.statistics.unused} ({batch.statistics.unused_percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Linked:</span>
                        <span>{batch.statistics.linked} ({batch.statistics.linked_percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sold:</span>
                        <span className="text-green-600">
                          {batch.statistics.sold} ({batch.statistics.sold_percentage.toFixed(1)}%)
                        </span>
                      </div>
                      {batch.statistics.invalid > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Invalid:</span>
                          <span className="text-red-600">
                            {batch.statistics.invalid} ({batch.statistics.invalid_percentage.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleExportPDF(batch.id)}
                          disabled={exportingBatch === batch.id}
                        >
                          {exportingBatch === batch.id ? (
                            "Exporting..."
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Export PDF
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedBatch(batch)}
                          title="View batch details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setBatchToDelete(batch)}
                          title="Delete batch"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="statistics">
          <QRBatchStats />
        </TabsContent>
      </Tabs>

      {/* Create Batch Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create QR Code Batch</DialogTitle>
            <DialogDescription>
              Generate a new batch of QR codes for a market or general use
            </DialogDescription>
          </DialogHeader>
          <QRBatchCreationForm
            onSuccess={handleBatchCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Batch Detail Dialog */}
      <Dialog open={!!selectedBatch} onOpenChange={(open) => !open && setSelectedBatch(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Batch Details: {selectedBatch?.name || selectedBatch?.prefix}
            </DialogTitle>
            <DialogDescription>
              View detailed information about this QR code batch
            </DialogDescription>
          </DialogHeader>
          {selectedBatch && (
            <div className="space-y-6">
              {/* Batch Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Prefix</p>
                  <p className="text-lg font-mono">{selectedBatch.prefix}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Codes</p>
                  <p className="text-lg font-semibold">{selectedBatch.code_count}</p>
                </div>
                {selectedBatch.market && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Market</p>
                    <p className="text-lg">{selectedBatch.market.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-lg">
                    {new Date(selectedBatch.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Unused</p>
                      <p className="text-2xl font-bold">
                        {selectedBatch.statistics.unused}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedBatch.statistics.unused_percentage.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Linked</p>
                      <p className="text-2xl font-bold">
                        {selectedBatch.statistics.linked}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedBatch.statistics.linked_percentage.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Sold</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedBatch.statistics.sold}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedBatch.statistics.sold_percentage.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  {selectedBatch.statistics.invalid > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Invalid</p>
                        <p className="text-2xl font-bold text-red-600">
                          {selectedBatch.statistics.invalid}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedBatch.statistics.invalid_percentage.toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleExportPDF(selectedBatch.id)}
                  disabled={exportingBatch === selectedBatch.id}
                >
                  {exportingBatch === selectedBatch.id ? (
                    "Exporting..."
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBatchToDelete(selectedBatch);
                    setSelectedBatch(null);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Batch
                </Button>
                <Button variant="outline" onClick={() => setSelectedBatch(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!batchToDelete} onOpenChange={(open) => !open && setBatchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle>Delete QR Batch</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete the batch &quot;{batchToDelete?.name || batchToDelete?.prefix}&quot;?
              <br />
              <br />
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The batch record</li>
                <li>All {batchToDelete?.code_count || 0} QR codes in this batch</li>
                {batchToDelete && (batchToDelete.statistics.linked > 0 || batchToDelete.statistics.sold > 0) && (
                  <li className="text-red-600 font-medium">
                    Warning: {batchToDelete.statistics.linked} linked and {batchToDelete.statistics.sold} sold codes will be deleted
                  </li>
                )}
              </ul>
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={!!deletingBatch}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={handleDeleteBatch}
                disabled={!!deletingBatch}
              >
                {deletingBatch ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Batch
                  </>
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

