"use client";

import { useEffect, useRef, useState } from "react";

type LogEntry = {
  type: "log" | "warn" | "error";
  message: string;
  timestamp: string;
};

export default function ConsoleViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const endOfLogsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Store original console methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    // Helper function to format console arguments
    const formatArgs = (args: unknown[]) => {
      return args
        .map((arg) => {
          if (typeof arg === "object" && arg !== null) {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return "[Unserializable Object]";
            }
          }

          return String(arg);
        })
        .join(" ");
    };

    // Override console.log
    console.log = (...args: unknown[]) => {
      setLogs((prev) => [
        ...prev,
        {
          type: "log",
          message: formatArgs(args),
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      // Keep original browser console logging
      originalLog(...args);
    };

    // Override console.warn
    console.warn = (...args: unknown[]) => {
      setLogs((prev) => [
        ...prev,
        {
          type: "warn",
          message: formatArgs(args),
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      originalWarn(...args);
    };

    // Override console.error
    console.error = (...args: unknown[]) => {
      setLogs((prev) => [
        ...prev,
        {
          type: "error",
          message: formatArgs(args),
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      originalError(...args);
    };

    // Restore original console methods when component unmounts
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  // Automatically scroll to the latest log
  useEffect(() => {
    if (isOpen) {
      endOfLogsRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [logs, isOpen]);

  // Uncomment this if you want to hide the console in production
  // if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-sm">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="float-right rounded bg-gray-900 px-4 py-2 text-white shadow-lg transition hover:bg-gray-800"
      >
        {isOpen ? "Close Console" : `🖥️ Logs (${logs.length})`}
      </button>

      {/* Terminal Window */}
      {isOpen && (
        <div className="mt-2 flex h-80 w-80 flex-col gap-2 overflow-y-auto rounded-lg border border-gray-700 bg-black/90 p-4 text-gray-300 shadow-2xl backdrop-blur-sm md:w-96">
          {/* Header */}
          <div className="mb-2 flex items-center justify-between border-b border-gray-700 pb-2">
            <span className="font-bold text-white">App Logs</span>

            <button
              onClick={() => setLogs([])}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear
            </button>
          </div>

          {/* Logs */}
          {logs.length === 0 ? (
            <p className="italic text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`break-words rounded p-1.5 ${
                  log.type === "error"
                    ? "bg-red-900/30 text-red-400"
                    : log.type === "warn"
                    ? "bg-yellow-900/30 text-yellow-400"
                    : "text-green-400"
                }`}
              >
                <span className="mr-2 text-xs text-gray-500">
                  [{log.timestamp}]
                </span>

                <span>{log.message}</span>
              </div>
            ))
          )}

          {/* Auto-scroll target */}
          <div ref={endOfLogsRef} />
        </div>
      )}
    </div>
  );
}