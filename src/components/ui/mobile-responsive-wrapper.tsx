import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * MobileResponsiveWrapper - A utility component to prevent horizontal overflow on mobile
 * Wraps content and ensures it stays within viewport bounds
 */

interface MobileResponsiveWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  enableHorizontalScroll?: boolean;
}

export function MobileResponsiveWrapper({
  children,
  className,
  enableHorizontalScroll = false,
  ...props
}: MobileResponsiveWrapperProps) {
  return (
    <div
      className={cn(
        "w-full max-w-full",
        enableHorizontalScroll ? "overflow-x-auto" : "overflow-x-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * MobileScrollContainer - For tables and wide content that should scroll on mobile
 */
export function MobileScrollContainer({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0",
        "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
        className
      )}
      style={{
        WebkitOverflowScrolling: "touch",
        msOverflowStyle: "-ms-autohiding-scrollbar"
      }}
      {...props}
    >
      {children}
    </div>
  );
}

