import * as React from "react";

import { cn } from "./utils";

interface CollapsibleContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

export function Collapsible({
  defaultOpen = false,
  className,
  children,
}: React.PropsWithChildren<{ defaultOpen?: boolean; className?: string }>) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <CollapsibleContext.Provider value={{ open, setOpen }}>
      <div className={cn("w-full", className)}>{children}</div>
    </CollapsibleContext.Provider>
  );
}

export function CollapsibleTrigger({
  asChild,
  className,
  children,
}: React.PropsWithChildren<{ asChild?: boolean; className?: string }>) {
  const ctx = React.useContext(CollapsibleContext);
  if (!ctx) return null;
  const handleClick = () => ctx.setOpen(!ctx.open);

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    const originalOnClick = (child.props as any)?.onClick as ((e: any) => void) | undefined;
    return React.cloneElement(child, {
      onClick: (e: any) => {
        originalOnClick?.(e);
        handleClick();
      },
    });
  }

  return (
    <button onClick={handleClick} className={cn(className)}>
      {children}
    </button>
  );
}

export function CollapsibleContent({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  const ctx = React.useContext(CollapsibleContext);
  if (!ctx) return null;
  return (
    <div className={cn("overflow-hidden transition-all", className)} style={{ display: ctx.open ? "block" : "none" }}>
      {children}
    </div>
  );
}


