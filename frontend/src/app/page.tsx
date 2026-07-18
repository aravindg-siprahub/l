import { fetchApi } from "@/shared/api/client";

export default async function Home() {
  let backendStatuses: Record<string, string> = {};
  let isConnected = false;

  try {
    const statuses = await fetchApi<Record<string, string>>("/foundation/status", {
      next: { revalidate: 0 } 
    });
    backendStatuses = statuses;
    isConnected = true;
  } catch (error) {
    backendStatuses = {
      Frontend: "Connected",
      Backend: `Connection failed: ${(error as Error).message}`
    };
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-zinc-950 min-h-screen py-16">
      <main className="w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-10 flex flex-col items-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
          Foundation Validation
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-10 text-center">
          Enterprise Timesheet & Invoice Management
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {Object.entries(backendStatuses).map(([module, status]) => {
            let statusColor = "text-zinc-600 dark:text-zinc-400";
            let bgColor = "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800";
            let icon = "❓";

            if (status.includes("Connected") || status.includes("Ready") || status.includes("Loaded") || status.includes("Registered") || status === "Running") {
              statusColor = "text-green-700 dark:text-green-400";
              bgColor = "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50";
              icon = "✔";
            }
            if (status.includes("Configured but not started")) {
              statusColor = "text-amber-700 dark:text-amber-400";
              bgColor = "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50";
              icon = "⏳";
            }
            if (status.includes("Failed") || status.includes("Error") || status.includes("Not Configured")) {
              statusColor = "text-red-700 dark:text-red-400";
              bgColor = "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50";
              icon = "❌";
            }

            return (
              <div key={module} className={`p-5 rounded-lg border ${bgColor} flex flex-col justify-between transition-all hover:shadow-md`}>
                <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 mb-1">
                  {module}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span>{icon}</span>
                  <span className={`font-medium ${statusColor}`}>
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
