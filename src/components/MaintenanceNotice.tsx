import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { MaintenanceStatus } from "../lib/api/system";

interface MaintenanceNoticeProps {
  status: MaintenanceStatus | null;
  isAdmin: boolean;
}

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const buildScheduleText = (status: MaintenanceStatus) => {
  const { scheduleStart, scheduleEnd } = status;
  if (scheduleStart && scheduleEnd) {
    return `From ${formatDateTime(scheduleStart)} to ${formatDateTime(
      scheduleEnd
    )}`;
  }
  if (scheduleStart) {
    return `Starts at ${formatDateTime(scheduleStart)}`;
  }
  if (scheduleEnd) {
    return `Until ${formatDateTime(scheduleEnd)}`;
  }
  return "We will be back shortly.";
};

export function MaintenanceNotice({
  status,
  isAdmin,
}: MaintenanceNoticeProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (status?.enabled && !isAdmin) {
      setIsOpen(true);
    }
  }, [status?.enabled, isAdmin]);

  const scheduleText = useMemo(() => {
    if (!status) return "";
    return buildScheduleText(status);
  }, [status]);

  if (!status?.enabled || isAdmin) {
    return null;
  }

  const showBanner = status.showBanner !== false;

  return (
    <>
      {showBanner && (
        <div className="bg-amber-600 text-white px-4 py-2 text-sm flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>
            Maintenance mode is active. Some features are temporarily
            unavailable.
          </span>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Scheduled Maintenance
              </h2>
            </div>
            <div className="px-6 py-5 space-y-4 text-gray-700">
              <p>{status.message}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{scheduleText}</span>
              </div>
              {status.inWindow && (
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <Clock className="h-4 w-4" />
                  <span>Maintenance is currently in progress.</span>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
              <Button onClick={() => setIsOpen(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

