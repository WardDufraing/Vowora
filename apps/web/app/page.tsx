// Resolve the public package entrypoints without introducing product behavior.
import type {} from "@vowora/domain";
import type {} from "@vowora/contracts";
import Link from "next/link";
export default function Home() {
  return (
    <main>
      <p>Vowora</p>
      <h1>The application is in development.</h1>
      <p>Planning features are in development. Account access is available.</p>
      <nav aria-label="Account">
        <Link href="/sign-in">Sign in</Link>
        <Link href="/sign-up">Create account</Link>
      </nav>
    </main>
  );
}
