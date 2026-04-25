import { LogForm } from "@/components/log/log-form";

export default function LogPage() {
  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-10">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-center mb-6">Log transaction</h1>
        <LogForm />
      </div>
    </div>
  );
}
