import { redirect } from "next/navigation";

/**
 * There is no public landing page: this is an invitation-only tool. Providers
 * work from /provider; patients arrive through their own /r/[token] link.
 */
export default function Home() {
  redirect("/provider");
}
