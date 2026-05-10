"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Modal } from "~/components/ui/modal";
import { Input, Textarea } from "~/components/ui/input";

export default function RecipesPage() {
  const { data: recipes, refetch } = api.recipe.list.useQuery();
  const { data: ingredients } = api.ingredient.list.useQuery();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [servingQty, setServingQty] = useState("1");

  const create = api.recipe.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowModal(false);
      setName(""); setDescription(""); setServingSize(""); setServingQty("1");
    },
  });
  const deleteRecipe = api.recipe.delete.useMutation({ onSuccess: () => refetch() });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Link recipes to menu items for ingredient tracking
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ New Recipe</Button>
      </div>

      {!recipes || recipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-3 text-4xl">📖</div>
            <h3 className="font-semibold text-gray-900">No recipes yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add recipes to automatically calculate ingredient shopping lists.
            </p>
            <div className="mt-4">
              <Button onClick={() => setShowModal(true)}>Add Recipe</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <Card key={recipe.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{recipe.name}</CardTitle>
                  <button
                    onClick={() => {
                      if (confirm("Delete this recipe?")) {
                        deleteRecipe.mutate({ id: recipe.id });
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {recipe.description && (
                  <p className="mb-2 text-sm text-gray-500">{recipe.description}</p>
                )}
                <p className="mb-3 text-xs text-gray-400">
                  Per {recipe.servingQty} {recipe.servingSize}
                </p>
                <div className="space-y-1">
                  {recipe.ingredients.length === 0 ? (
                    <p className="text-xs text-gray-400">No ingredients added</p>
                  ) : (
                    recipe.ingredients.map((ri) => (
                      <div key={ri.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{ri.ingredient.name}</span>
                        <span className="text-gray-500">
                          {ri.quantity} {ri.ingredient.unit}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-3">
                  <Link href={`/dashboard/recipes/${recipe.id}`}>
                    <Button variant="ghost" size="sm">
                      Manage ingredients →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Recipe">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({
              name,
              description: description || undefined,
              servingSize,
              servingQty: parseFloat(servingQty),
            });
          }}
          className="space-y-4"
        >
          <Input
            label="Recipe name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cheese Esfija"
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            label="Serving size label"
            required
            value={servingSize}
            onChange={(e) => setServingSize(e.target.value)}
            placeholder="e.g. per unit, per batch of 12"
          />
          <Input
            label="Serving quantity"
            type="number"
            min="0.1"
            step="0.1"
            required
            value={servingQty}
            onChange={(e) => setServingQty(e.target.value)}
            hint="How many units does this recipe produce?"
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={create.isPending}>
              Create Recipe
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
