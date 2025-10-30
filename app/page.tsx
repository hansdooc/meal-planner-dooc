import ClientComponent from "@/components/ClientComponent";
import MealPlanner from "@/components/MealForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <MealPlanner />
    </main>
  );
}
