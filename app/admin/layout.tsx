import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/account");
  }

  if (user.role !== "admin" && user.role !== "researcher") {
    redirect("/account?admin=denied");
  }

  return children;
}
