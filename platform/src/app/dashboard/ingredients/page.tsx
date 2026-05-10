"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Modal } from "~/components/ui/modal";
import { Input } from "~/components/ui/input";

export default function IngredientsPage() {
  const { data: ingredients, refetch } = api.ingredient.list.useQuery();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [unitCost, setUnitCost] = useState("");

  const create = api.ingredient.create.useMutation({
    onSuccess: () => { refetch(); closeModal(); },
  });
  const update = api.ingredient.update.useMutation({
    onSuccess: () => { refetch(); closeModal(); },
  });
  const deleteIngredient = api.ingredient.delete.useMutation({
    onSuccess: () => refetch(),
  });

  function openNew() {
    setEditId(null); setName(""); setUnit(""); setUnitCost("");
    setShowModal(true);
  }

  function openEdit(ing: { id: string; name: string; unit: string; unitCost: number | null }) {
    setEditId(ing.id);
    setName(ing.name);
    setUnit(ing.unit);
    setUnitCost(ing.unitCost ? String(ing.unitCost) : "");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false); setEditId(null); setName(""); setUnit(""); setUnitCost("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cost = unitCost ? parseFloat(unitCost) : undefined;
    if (editId) {
      update.mutate({ id: editId, name, unit, unitCost: cost ?? null });
    } else {
      create.mutate({ name, unit, unitCost: cost });
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ingredients</h1>
          <p className="mt-1 text-sm text-gray-500">
            Master ingredient list for recipe and shopping list calculations
          </p>
        </div>
        <Button onClick={openNew}>+ Add Ingredient</Button>
      </div>

      {!ingredients || ingredients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-3 text-4xl">🛒</div>
            <h3 className="font-semibold text-gray-900">No ingredients yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add ingredients to use in your recipes.
            </p>
            <div className="mt-4">
              <Button onClick={openNew}>Add Ingredient</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Unit</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Cost / unit</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ingredients.map((ing) => (
                <tr key={ing.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{ing.name}</td>
                  <td className="px-4 py-3 text-gray-600">{ing.unit}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {ing.unitCost ? `$${ing.unitCost.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(ing)} className="mr-3 text-xs text-gray-400 hover:text-gray-700">Edit</button>
                    <button
                      onClick={() => { if (confirm("Delete ingredient?")) deleteIngredient.mutate({ id: ing.id }); }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editId ? "Edit Ingredient" : "New Ingredient"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Flour" />
          <Input label="Unit" required value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="g, kg, ml, L, pcs" />
          <Input
            label="Cost per unit (optional)"
            type="number"
            min="0"
            step="0.01"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            placeholder="0.00"
            hint="Used to estimate total cost on shopping list"
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={create.isPending || update.isPending}>
              {editId ? "Save" : "Add"}
            </Button>
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
