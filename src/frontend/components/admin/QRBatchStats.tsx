"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformQRStats, getQRBatches } from "@/features/qr-batches/queries";
import type { PlatformQRStats, QRBatchWithStats } from "@/types/qr-codes";
import { QrCode, CheckCircle, XCircle, Link as LinkIcon, Package } from "lucide-react";

export function QRBatchStats() {
  const [platformStats, setPlatformStats] = useState<PlatformQRStats | null>(null);
  const [batches, setBatches] = useState<QRBatchWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [stats, batchesData] = await Promise.all([
          getPlatformQRStats(),
          getQRBatches({ limit: 10 }),
        ]);
        
        setPlatformStats(stats);
        setBatches(batchesData.batches);
      } catch (err) {
        setError("Failed to fetch QR code statistics");
        console.error("Error fetching QR stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!platformStats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Platform-wide Statistics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Platform Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {platformStats.total_batches} batch{platformStats.total_batches !== 1 ? "es" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unused</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.unused.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {platformStats.unused_percentage.toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Linked</CardTitle>
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{platformStats.linked.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {platformStats.linked_percentage.toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sold</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {platformStats.sold.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {platformStats.sold_percentage.toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invalid</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {platformStats.invalid.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {platformStats.invalid_percentage.toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Batches Statistics */}
      {batches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Batches</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.slice(0, 6).map((batch) => (
              <Card key={batch.id}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    {batch.name || `Batch: ${batch.prefix}`}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Prefix: {batch.prefix} • {batch.code_count} codes
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

