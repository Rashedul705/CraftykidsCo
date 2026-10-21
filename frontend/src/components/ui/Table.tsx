import React from 'react';
import { cn } from '@/lib/utils';

export function TableContainer({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'w-full bg-white border border-[#EFE9E0] rounded-[16px] overflow-hidden',
        className
      )}
      {...props}
    >
      <div className="w-full overflow-x-auto">{children}</div>
    </div>
  );
}

export function Table({
  children,
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn('w-full text-left text-sm border-collapse text-[#2B2B2B]', className)}
      {...props}
    >
      {children}
    </table>
  );
}

export function TableHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'bg-[#FAF7F2] border-b border-[#EFE9E0] text-xs font-semibold text-[#6B6B6B]',
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-y divide-[#EFE9E0] bg-white', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className,
  selected = false,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return (
    <tr
      className={cn(
        'transition-colors duration-100 hover:bg-[#FAF7F2]/70',
        selected && 'bg-[#FDE3E1]/20',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn('py-3.5 px-4 font-semibold text-[#6B6B6B] whitespace-nowrap', className)}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('py-3.5 px-4 text-[#2B2B2B] align-middle', className)} {...props}>
      {children}
    </td>
  );
}
