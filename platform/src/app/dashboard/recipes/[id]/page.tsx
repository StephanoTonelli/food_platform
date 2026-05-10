"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input, Select } from "~/components/ui/input";

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: recipe, refetch } = api.recipe.getById.useQuery({ id: params.id });
  const { data: ingredients } = api.ingredient.list.useQuery();

  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");

  const upsertIngredient = api.recipe.upsertIngredient.useMutation({
    onSuccess: () => { refetch(); setSelectedIngredientId(""); setQuantity(""); },
  });
  const removeIngredient = api.recipe.removeIngredient.useMutation({
    onSuccess: () => refetch(),
  });

  if (!recipe) return <div className="py-20 text-center text-gray-400">Loading…</div>;

  const availableIngredients = (ingredients ?? []).filter(
    (ing) => !recipe.ingredients.some((ri) => ri.ingredient.id === ing.id),
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-1 block text-sm text-gray-500 hover:text-gray-700"
        >
          ← Recipes
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{recipe.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Per {recipe.servingQty} {recipe.servingSize}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          {recipe.ingredients.length === 0 ? (
            <p className="mb-4 text-sm text-gray-400">No ingredients yet.</p>
          ) : (
            <div className="mb-4 space-y-2">
              {recipe.ingredients.map((ri) => (
                <div
                  key={ri.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <span className="text-sm text-gray-800">
                    {ri.ingredient.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {ri.quantity} {ri.ingredient.unit}
                    </span>
                    <button
                      onClick={() =>
                        removeIngredient.mutate({
                          recipeId: recipe.id,
                          ingredientId: ri.ingredient.id,
                        })
                      }
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {availableIngredients.length > 0 ? (
            <div className="flex gap-2">
              <Select
                options={availableIngredients.map((i) => ({
                  value: i.id,
                  label: `${i.name} (${i.unit})`,
                }))}
                placeholder="Select ingredient"
                value={selectedIngredientId}
                onChange={(e) => setSelectedIngredientId(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-24"
              />
              <Button
                size="md"
                variant="secondary"
                onClick={() => {
                  if (selectedIngredientId && quantity) {
                    upsertIngredient.mutate({
                      recipeId: recipe.id,
                      ingredientId: selectedIngredientId,
                      quantity: parseFloat(quantity),
                    });
                  }
                }}
                loading={upsertIngredient.isPending}
              >
                Add
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              All ingredients added, or{" "}
              <a
                href="/dashboard/ingredients"
                className="text-orange-600 hover:underline"
              >
                add more ingredients
              </a>
              .
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
