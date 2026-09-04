import { redirect } from "next/navigation";

// Root route — sends visitors straight into the back office. There is no
// public marketing page in this scaffold.
export default function RootPage() {
  redirect("/dashboard");
}
