// Resolve the public package entrypoints without introducing product behavior.
import type {} from "@vowora/domain";
import type {} from "@vowora/contracts";
export default function Home() {
  return (
    <main>
      <p>Vowora</p>
      <h1>The application is in development.</h1>
      <p>Planning features and account access are not available yet.</p>
    </main>
  );
}
