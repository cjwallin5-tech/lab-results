import { redirect } from 'next/navigation';

/**
 * No public landing page: this is an invitation-only tool. Providers work from
 * /provider; patients arrive through their own /r/[token] link.
 */
export default function Home() {
  redirect('/provider');
}
