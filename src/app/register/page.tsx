import { RegistrationForm } from '@/components/registration-form';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl">
        <RegistrationForm />
      </div>
    </main>
  );
}
