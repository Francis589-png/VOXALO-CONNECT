
import { Icons } from '@/components/icons';

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background chat-background">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <Icons.logo className="h-24 w-24 text-primary" />
          <div className="absolute inset-0 rounded-full animate-ping border-2 border-primary/50" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-3xl font-bold tracking-tight animate-pulse">
            VoxaLo Connect
          </h1>
          <p className="text-sm text-muted-foreground">from JTT</p>
        </div>
      </div>
    </div>
  );
}
