"use client";

import { useEffect, useRef } from "react";

interface InstagramEmbedProps {
  embedHtml: string;
  className?: string;
}

// Global script loading flag
let scriptLoaded = false;
let scriptLoading = false;

function loadInstagramScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (scriptLoaded) {
      resolve();
      return;
    }

    if (window.instgrm) {
      scriptLoaded = true;
      resolve();
      return;
    }

    if (scriptLoading) {
      // Wait for the script that's currently loading
      const checkInterval = setInterval(() => {
        if (scriptLoaded || window.instgrm) {
          clearInterval(checkInterval);
          scriptLoaded = true;
          resolve();
        }
      }, 100);
      return;
    }

    scriptLoading = true;
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
    };
    script.onerror = () => {
      scriptLoading = false;
      reject(new Error("Failed to load Instagram embed script"));
    };

    document.body.appendChild(script);
  });
}

export function InstagramEmbed({ embedHtml, className }: InstagramEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInstagramScript()
      .then(() => {
        if (window.instgrm && containerRef.current) {
          window.instgrm.Embeds.process();
        }
      })
      .catch((error) => {
        console.error("Error loading Instagram embed:", error);
      });
  }, [embedHtml]);

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: embedHtml }}
    />
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

