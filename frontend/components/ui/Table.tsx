import type { TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function Table({ className = "", children, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse ${className}`} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function Th({ className = "", children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`text-left text-[11px] font-semibold text-muted whitespace-nowrap px-2.5 py-2.5 border-b border-border ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({ className = "", children, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`text-[13px] px-2.5 py-3 border-b border-border ${className}`} {...rest}>
      {children}
    </td>
  );
}
