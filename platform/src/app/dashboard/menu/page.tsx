"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Modal } from "~/components/ui/modal";
import { Input, Textarea, Select } from "~/components/ui/input";
import { formatPrice } from "~/lib/utils";

export default function MenuPage() {
  const { data: business, refetch } = api.business.getMyBusiness.useQuery();
  const { data: categories } = api.menu.getCategories.useQuery();
  const { data: recipes } = api.recipe.list.useQuery();

  const [showItemModal, setShowItemModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    id?: string;
    name: string;
    description: string;
    price: string;
    categoryId: string;
    recipeId: string;
  } | null>(null);
  const [catName, setCatName] = useState("");

  const createItem = api.menu.createItem.useMutation({
    onSuccess: () => { refetch(); setShowItemModal(false); },
  });
  const updateItem = api.menu.updateItem.useMutation({
    onSuccess: () => { refetch(); setShowItemModal(false); setEditingItem(null); },
  });
  const deleteItem = api.menu.deleteItem.useMutation({ onSuccess: () => refetch() });
  const createCategory = api.menu.createCategory.useMutation({
    onSuccess: () => { refetch(); setShowCatModal(false); setCatName(""); },
  });

  function openNewItem() {
    setEditingItem({ name: "", description: "", price: "", categoryId: "", recipeId: "" });
    setShowItemModal(true);
  }

  function openEditItem(item: typeof business extends null | undefined ? never : NonNullable<typeof business>["menuItems"][number]) {
    setEditingItem({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      price: String(item.price / 100),
      categoryId: item.categoryId ?? "",
      recipeId: item.recipeId ?? "",
    });
    setShowItemModal(true);
  }

  function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    const price = Math.round(parseFloat(editingItem.price) * 100);

    if (editingItem.id) {
      updateItem.mutate({
        id: editingItem.id,
        name: editingItem.name,
        description: editingItem.description || undefined,
        price,
        categoryId: editingItem.categoryId || undefined,
        recipeId: editingItem.recipeId || undefined,
      });
    } else {
      createItem.mutate({
        name: editingItem.name,
        description: editingItem.description || undefined,
        price,
        categoryId: editingItem.categoryId || undefined,
        recipeId: editingItem.recipeId || undefined,
      });
    }
  }

  if (!business) return null;

  const groupedItems = (categories ?? []).reduce(
    (acc, cat) => {
      acc[cat.name] = business.menuItems.filter((m) => m.categoryId === cat.id);
      return acc;
    },
    {} as Record<string, typeof business.menuItems>,
  );

  const uncategorized = business.menuItems.filter((m) => !m.categoryId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your menu items and categories
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowCatModal(true)}>
            + Category
          </Button>
          <Button onClick={openNewItem}>+ Menu Item</Button>
        </div>
      </div>

      {business.menuItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-3 text-4xl">📋</div>
            <h3 className="font-semibold text-gray-900">Menu is empty</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add your first menu item to get started.
            </p>
            <div className="mt-4">
              <Button onClick={openNewItem}>Add Menu Item</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([catName, items]) => (
            <Card key={catName}>
              <CardHeader>
                <CardTitle>{catName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-orange-600">
                          {formatPrice(item.price)}
                        </span>
                        <button
                          onClick={() => openEditItem(item)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete this menu item?")) {
                              deleteItem.mutate({ id: item.id });
                            }
                          }}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-sm text-gray-400">No items in this category.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {uncategorized.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uncategorized</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uncategorized.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-orange-600">
                          {formatPrice(item.price)}
                        </span>
                        <button onClick={() => openEditItem(item)} className="text-xs text-gray-400 hover:text-gray-600">Edit</button>
                        <button onClick={() => { if (confirm("Delete?")) deleteItem.mutate({ id: item.id }); }} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Modal
        open={showItemModal}
        onClose={() => { setShowItemModal(false); setEditingItem(null); }}
        title={editingItem?.id ? "Edit Menu Item" : "New Menu Item"}
      >
        {editingItem && (
          <form onSubmit={handleSaveItem} className="space-y-4">
            <Input
              label="Name"
              required
              value={editingItem.name}
              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
            />
            <Textarea
              label="Description"
              value={editingItem.description}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
            />
            <Input
              label="Price (AUD)"
              type="number"
              step="0.01"
              min="0"
              required
              value={editingItem.price}
              onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
              placeholder="12.50"
            />
            {categories && categories.length > 0 && (
              <Select
                label="Category"
                value={editingItem.categoryId}
                onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="No category"
              />
            )}
            {recipes && recipes.length > 0 && (
              <Select
                label="Linked Recipe"
                value={editingItem.recipeId}
                onChange={(e) => setEditingItem({ ...editingItem, recipeId: e.target.value })}
                options={recipes.map((r) => ({ value: r.id, label: r.name }))}
                placeholder="No recipe"
              />
            )}
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={createItem.isPending || updateItem.isPending}>
                {editingItem.id ? "Save Changes" : "Add Item"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setShowItemModal(false); setEditingItem(null); }}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={showCatModal}
        onClose={() => setShowCatModal(false)}
        title="New Category"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (catName.trim()) createCategory.mutate({ name: catName });
          }}
          className="space-y-4"
        >
          <Input
            label="Category name"
            required
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="e.g. Savory, Sweet, Drinks"
          />
          <div className="flex gap-3">
            <Button type="submit" loading={createCategory.isPending}>
              Create
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowCatModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
