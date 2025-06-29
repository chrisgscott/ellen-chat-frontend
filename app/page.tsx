import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DeployButton } from "@/components/deploy-button";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { InfoIcon } from "lucide-react";
import { FetchDataSteps } from "@/components/tutorial/fetch-data-steps";

export default async function App() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Next.js Supabase Starter</Link>
              <div className="flex items-center gap-2">
                <DeployButton />
              </div>
            </div>
            <AuthButton />
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <div className="flex-1 w-full flex flex-col gap-12">
            <div className="w-full">
              <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
                <InfoIcon size="16" strokeWidth={2} />
                This is a protected page that you can only see as an authenticated
                user
              </div>
            </div>
            <div className="flex flex-col gap-2 items-start">
              <h2 className="font-bold text-2xl mb-4">Your user details</h2>
              <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
                {JSON.stringify(data.user, null, 2)}
              </pre>
            </div>
            <div>
              <h2 className="font-bold text-2xl mb-4">Next steps</h2>
              <FetchDataSteps />
            </div>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
