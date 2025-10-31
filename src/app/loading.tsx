
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex h-full w-80 flex-col border-r bg-muted/20">
        <div className="p-4 border-b">
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-6 w-24" />
            </div>
        </div>
        <div className="p-4 border-b">
             <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex flex-col gap-1 py-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chat View Skeleton */}
      <div className="flex flex-1 flex-col bg-muted/40">
        <div className="border-b p-4 bg-background">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-6" />
        <div className="border-t p-4 bg-background">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
