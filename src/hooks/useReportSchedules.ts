/**
 * Custom Hook for Managing Report Schedules
 *
 * Handles fetching and state management for scheduled reports
 */

import { useState, useEffect, useCallback } from "react";
import {
  getReportSchedules,
  type ReportSchedule,
} from "../services/reportSchedules.api";
import { toast } from "sonner";

export function useReportSchedules() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getReportSchedules();

      if (response.success && response.data) {
        setSchedules(response.data);
      } else {
        setError(response.error || "Failed to fetch schedules");
      }
    } catch (err: any) {
      console.error("Failed to fetch report schedules:", err);
      setError(err.message || "Failed to fetch schedules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const refresh = useCallback(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    schedules,
    loading,
    error,
    refresh,
  };
}
