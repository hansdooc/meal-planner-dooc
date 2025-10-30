import MealForm from "@/components/MealForm";
import { createClient } from "@/utils/supabase/server";

export default async function PrivatePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return (
    <div>
      <p className="flex flex-col items-center justify-between">
        {data?.user?.user_metadata?.username}'s Meal Planner
      </p>
    </div>
  );
}