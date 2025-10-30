"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function getUserSession() {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        return null;
    }
    return { status: "success", user: data.session?.user };
}

export async function signUp(formData: FormData) {
    const supabase = await createClient();

    const credentials = {
        username: formData.get("username") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const {error, data} = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
            data: {
                username: credentials.username,
            },
        },
    });

    if (error) {
        return {
            status: error?.message,
            user: null
        };
    } else if (data?.user?.identities?.length === 0) {
        return {
            status: "User with this email already exists, please login.",
            user: null
        };
    }

    revalidatePath("/", "layout");
    return {status: "success", user: data.user};
}

export async function signIn(formData: FormData) {
    const supabase = await createClient();

    const credentials = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const {error, data} = await supabase.auth.signInWithPassword(credentials);

    if(error) {
        return {
            status: error?.message,
            user: null,
        }
    }

    const { data: existingUser } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("email", credentials?.email)
        .limit(1)
        .single();

        if(!existingUser) {
            const { error: insertError } = await supabase.from("user_profiles").insert({
                email: data?.user.email,
                username: data?.user?.user_metadata?.username,
            });
            if (insertError) {
                return {
                    status: insertError?.message,
                    user: null,
                };
            }
        }

    revalidatePath("/", "layout");
    return { status: "success", user: data.user};
}

export async function signOut() {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        redirect("/error")
    }

    revalidatePath("/", "layout");
    redirect("/login");
}

export type MealPlan = Record<string, string[]>;

export async function fetchMealPlans(): Promise<MealPlan> {
    const supabase = await createClient();
    
    const { data, error } = await supabase.from("meal_plans").select("day, meals");

    if (error) {
        console.error("❌ Fetch error:", error.message);
        return {};
    }

    console.log("✅ Fetch success:", data);
    const plan: MealPlan = {};
    data?.forEach((row) => (plan[row.day] = row.meals || []));
    return plan;
}

export async function addMealToDay(day: string, meal: string, currentPlan: MealPlan) {
    const supabase = await createClient();
    const updatedMeals = [...(currentPlan[day] || []), meal];
    console.log(`🟢 Adding meal "${meal}" to ${day}`);

    const { data: existing, error: selectError } = await supabase
        .from("meal_plans")
        .select("id")
        .eq("day", day)
        .maybeSingle();

    if (selectError) console.error("❌ Select error:", selectError.message);
    
    const userId = supabase.from("user_profiles").select("id");

    if (existing) {
        console.log(`Updating existing record for ${day}`);
        const { error } = await supabase
        .from("meal_plans")
        .update({ meals: updatedMeals })
        .eq("day", day);
        if (error) console.error("❌ Update error:", error.message);
    } else {
        console.log(`Inserting new record for ${day}`);
        const { error } = await supabase
        .from("meal_plans")
        .insert([{ day, meals: updatedMeals }]);
        if (error) console.error("❌ Insert error:", error.message);
    }

    return updatedMeals;
}

export async function removeMealFromDay(day: string, index: number, currentPlan: MealPlan) {
    const supabase = await createClient();
    const updatedMeals = currentPlan[day].filter((_, i) => i !== index);
    console.log(`🗑️ Removing meal index ${index} from ${day}`);

    const { error } = await supabase
        .from("meal_plans")
        .update({ meals: updatedMeals })
        .eq("day", day);

    if (error) console.error("❌ Remove error:", error.message);
    return updatedMeals;
}
