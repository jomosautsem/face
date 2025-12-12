import { AccessControlPanel } from '@/components/access-control-panel';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Panel de Control</h1>
          <Link href="/register" passHref>
            <Button>
              <UserPlus className="mr-2 h-5 w-5" />
              Agregar Usuario
            </Button>
          </Link>
        </div>
        <AccessControlPanel />
      </div>
    </main>
  );
}
