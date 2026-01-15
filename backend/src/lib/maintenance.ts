import prisma from "./db";

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  showBanner: boolean;
  blockLogins: boolean;
  apiLock: boolean;
}

export interface MaintenanceStatus extends MaintenanceConfig {
  inWindow: boolean;
}

const DEFAULT_MAINTENANCE: MaintenanceConfig = {
  enabled: false,
  message: "We are currently undergoing scheduled maintenance.",
  scheduleStart: null,
  scheduleEnd: null,
  showBanner: true,
  blockLogins: true,
  apiLock: true,
};

let maintenanceCache: {
  value: MaintenanceStatus;
  fetchedAt: number;
} | null = null;

const CACHE_TTL_MS = 15_000;

const normalizeMaintenanceConfig = (value: any): MaintenanceConfig => {
  if (typeof value === "boolean") {
    return { ...DEFAULT_MAINTENANCE, enabled: value };
  }

  if (!value || typeof value !== "object") {
    return { ...DEFAULT_MAINTENANCE };
  }

  return {
    enabled: Boolean(value.enabled),
    message:
      typeof value.message === "string" && value.message.trim()
        ? value.message.trim()
        : DEFAULT_MAINTENANCE.message,
    scheduleStart:
      typeof value.scheduleStart === "string" && value.scheduleStart.trim()
        ? value.scheduleStart
        : null,
    scheduleEnd:
      typeof value.scheduleEnd === "string" && value.scheduleEnd.trim()
        ? value.scheduleEnd
        : null,
    showBanner:
      typeof value.showBanner === "boolean"
        ? value.showBanner
        : DEFAULT_MAINTENANCE.showBanner,
    blockLogins:
      typeof value.blockLogins === "boolean"
        ? value.blockLogins
        : DEFAULT_MAINTENANCE.blockLogins,
    apiLock:
      typeof value.apiLock === "boolean"
        ? value.apiLock
        : DEFAULT_MAINTENANCE.apiLock,
  };
};

const computeInWindow = (start: string | null, end: string | null): boolean => {
  if (!start && !end) return false;

  const now = Date.now();
  const startTime = start ? Date.parse(start) : null;
  const endTime = end ? Date.parse(end) : null;

  if (startTime && Number.isNaN(startTime)) return false;
  if (endTime && Number.isNaN(endTime)) return false;

  if (startTime && now < startTime) return false;
  if (endTime && now > endTime) return false;

  return true;
};

export const getMaintenanceStatus = async (): Promise<MaintenanceStatus> => {
  const now = Date.now();
  if (
    maintenanceCache &&
    now - maintenanceCache.fetchedAt < CACHE_TTL_MS
  ) {
    return maintenanceCache.value;
  }

  try {
    const setting = await prisma.system_settings.findUnique({
      where: { key: "maintenance_mode" },
      select: { value: true },
    });

    const config = normalizeMaintenanceConfig(setting?.value);
    const inWindow = computeInWindow(config.scheduleStart, config.scheduleEnd);
    const status = { ...config, inWindow };

    maintenanceCache = { value: status, fetchedAt: now };
    return status;
  } catch (error) {
    const status = { ...DEFAULT_MAINTENANCE, inWindow: false };
    maintenanceCache = { value: status, fetchedAt: now };
    return status;
  }
};

export const clearMaintenanceCache = () => {
  maintenanceCache = null;
};

