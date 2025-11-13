"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QRCode, QRCodeWithItem } from "@/types/qr-codes";
import { Link as LinkIcon, CheckCircle, XCircle, Package } from "lucide-react";
import { format } from "date-fns";

interface QRCodeLifecycleProps {
  qrCode: QRCode | QRCodeWithItem;
}

export function QRCodeLifecycle({ qrCode }: QRCodeLifecycleProps) {
  const events = [
    {
      type: "created",
      label: "Created",
      timestamp: qrCode.created_at,
      icon: Package,
      description: `QR code created with prefix ${qrCode.prefix}`,
    },
    ...(qrCode.linked_at
      ? [
          {
            type: "linked",
            label: "Linked to Item",
            timestamp: qrCode.linked_at,
            icon: LinkIcon,
            description: "QR code linked to an item",
            item: "item" in qrCode ? qrCode.item : null,
          },
        ]
      : []),
    ...(qrCode.status === "SOLD"
      ? [
          {
            type: "sold",
            label: "Item Sold",
            timestamp: qrCode.updated_at,
            icon: CheckCircle,
            description: "Item has been sold",
          },
        ]
      : []),
    ...(qrCode.invalidated_at
      ? [
          {
            type: "invalidated",
            label: "Invalidated",
            timestamp: qrCode.invalidated_at,
            icon: XCircle,
            description: qrCode.invalidation_reason || "QR code invalidated",
          },
        ]
      : []),
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      UNUSED: "bg-gray-100 text-gray-800",
      LINKED: "bg-blue-100 text-blue-800",
      SOLD: "bg-green-100 text-green-800",
      INVALID: "bg-red-100 text-red-800",
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.UNUSED}`}>
        {status}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>QR Code Lifecycle</span>
          {getStatusBadge(qrCode.status)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* QR Code Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Code:</span>
              <span className="font-mono text-sm">{qrCode.code}</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Prefix:</span>
              <span>{qrCode.prefix}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-4">
              {events.map((event, index) => {
                const Icon = event.icon;
                return (
                  <div key={index} className="relative flex gap-4">
                    <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                      event.type === "created" ? "bg-blue-500" :
                      event.type === "linked" ? "bg-green-500" :
                      event.type === "sold" ? "bg-purple-500" :
                      "bg-red-500"
                    }`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.timestamp), "PPp")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                      {"item" in event && event.item && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <p className="font-medium">{event.item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.item.owner.first_name} {event.item.owner.last_name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

