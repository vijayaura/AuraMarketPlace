import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rowCount?: number;
  colCount?: number;
}

export const TableSkeleton = ({ rowCount = 5, colCount = 4 }: TableSkeletonProps) => {
  const columnWidths = ["w-48", "w-40", "w-24", "w-56", "w-28"];
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIdx) => (
        <TableRow key={`skeleton-row-${rowIdx}`}>
          {Array.from({ length: colCount }).map((_, colIdx) => (
            <TableCell key={`skeleton-cell-${rowIdx}-${colIdx}`}>
              <div className="space-y-2">
                <Skeleton className={`h-4 ${columnWidths[colIdx % columnWidths.length]}`} />
                {colIdx < 2 && (
                  <Skeleton className={`h-3 ${columnWidths[(colIdx + 1) % columnWidths.length]}`} />
                )}
              </div>
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};

export default TableSkeleton;


