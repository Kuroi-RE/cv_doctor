import { redirect } from "next/navigation";

export default function AnalysisPage() {
  // Analysis list is served at /history
  // This route is kept for potential future use (e.g., analysis overview)
  redirect("/history");
}
