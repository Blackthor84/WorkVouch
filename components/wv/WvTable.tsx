import { cn } from "@/lib/utils";

type WvTableProps = {
  children: React.ReactNode;
  className?: string;
};

export function WvTable({ children, className }: WvTableProps) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-wv-border", className)}>
      <table className="w-full min-w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function WvTableHead({ children, className }: WvTableProps) {
  return (
    <thead className={cn("bg-wv-surface/80 text-left text-xs uppercase tracking-wider text-wv-subtle", className)}>
      {children}
    </thead>
  );
}

export function WvTableBody({ children, className }: WvTableProps) {
  return <tbody className={cn("divide-y divide-wv-border bg-wv-surface/40", className)}>{children}</tbody>;
}

export function WvTableRow({ children, className }: WvTableProps) {
  return (
    <tr className={cn("transition-colors hover:bg-wv-surface-hover", className)}>
      {children}
    </tr>
  );
}

type WvTableCellProps = {
  children: React.ReactNode;
  className?: string;
  header?: boolean;
};

export function WvTableCell({ children, className, header }: WvTableCellProps) {
  if (header) {
    return (
      <th scope="col" className={cn("px-4 py-3 font-semibold", className)}>
        {children}
      </th>
    );
  }
  return (
    <td className={cn("px-4 py-3 text-wv-muted", className)}>
      {children}
    </td>
  );
}
