"use client";

import { addMealToDay, fetchMealPlans, MealPlan, removeMealFromDay } from "@/actions/auth";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function MealPlanner() {
  const [mealPlan, setMealPlan] = useState<MealPlan>({});
  const [selectedDay, setSelectedDay] = useState(daysOfWeek[0]);
  const [mealInput, setMealInput] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch meals when page loads
  useEffect(() => {
    const loadMeals = async () => {
      setLoading(true);
      const plan = await fetchMealPlans();
      setMealPlan(plan);
      setLoading(false);
    };
    loadMeals();
  }, []);

  // Add meal handler
  const handleAddMeal = async () => {
    if (!mealInput.trim()) return;
    const updatedMeals = await addMealToDay(selectedDay, mealInput.trim(), mealPlan);
    setMealPlan((prev) => ({ ...prev, [selectedDay]: updatedMeals }));
    setMealInput("");
  };

  // Remove meal handler
  const handleRemoveMeal = async (day: string, index: number) => {
    const updatedMeals = await removeMealFromDay(day, index, mealPlan);
    setMealPlan((prev) => ({ ...prev, [day]: updatedMeals }));
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold text-green-600 mb-6">
        🥗 Meal Planner (Supabase)
      </h1>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-green-300"
        >
          {daysOfWeek.map((day) => (
            <option key={day}>{day}</option>
          ))}
        </select>

        <input
          type="text"
          value={mealInput}
          onChange={(e) => setMealInput(e.target.value)}
          placeholder="Enter a meal"
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring focus:ring-green-300"
        />

        <button
          onClick={handleAddMeal}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
        >
          Add Meal
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading meals...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
          {daysOfWeek.map((day) => (
            <div key={day} className="bg-white shadow-md rounded-xl p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">{day}</h2>
              <ul className="space-y-2">
                {(mealPlan[day] || []).length > 0 ? (
                  mealPlan[day].map((meal, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center bg-gray-100 rounded-md px-3 py-2"
                    >
                      <span>{meal}</span>
                      <button
                        onClick={() => handleRemoveMeal(day, index)}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        ✕
                      </button>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm italic">
                    No meals added yet
                  </p>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
