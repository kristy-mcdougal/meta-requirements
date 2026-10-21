import { Board } from "@/components/Board";
import { getRequirements } from "@/lib/requirements";

export const dynamic = "force-dynamic";

export default async function Page() {
  try {
    const requirements = await getRequirements();
    return <Board initialRequirements={requirements} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load requirements.";
    return (
      <main className="boot-error">
        <p className="eyebrow">Meta</p>
        <h1>Requirements are unavailable</h1>
        <p>{message}</p>
      </main>
    );
  }
}
