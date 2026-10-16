import { redirect } from "next/navigation";

/** The old breakdown page lives on as /records. */
export default function BreakdownPage() {
  redirect("/records");
}
