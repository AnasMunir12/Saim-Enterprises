import { readSiteData } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await readSiteData();

  const stats = [
    { label: "Total Products", value: data.products.length },
    { label: "Active Products", value: data.products.filter((item) => item.active).length },
    { label: "Categories", value: data.categories.length },
    { label: "Collections", value: data.collections.length },
    { label: "Featured", value: data.products.filter((item) => item.featured).length },
    { label: "Orders", value: "0" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{item.label}</p>
            <p className="mt-5 text-3xl font-semibold tracking-tight">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Recent products</h2>
            <a className="text-sm text-stone-600 underline" href="/admin/products">Manage all</a>
          </div>

          <div className="space-y-3">
            {data.products.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 p-3">
                <div className="flex items-center gap-3">
                  <img src={product.image} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-stone-500">{product.categoryId}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">PKR {product.price.toLocaleString("en-PK")}</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-stone-500">{product.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight">Quick actions</h2>
          <div className="mt-4 space-y-3">
            <a href="/admin/products" className="block rounded-xl bg-stone-100 p-3 text-sm font-medium">Add Product</a>
            <a href="/admin/categories" className="block rounded-xl bg-stone-100 p-3 text-sm font-medium">Add Category</a>
            <a href="/admin/content/homepage" className="block rounded-xl bg-stone-100 p-3 text-sm font-medium">Edit Homepage</a>
            <a href="/admin/content/hero" className="block rounded-xl bg-stone-100 p-3 text-sm font-medium">Manage Hero</a>
            <a href="/admin/settings" className="block rounded-xl bg-stone-100 p-3 text-sm font-medium">Website Settings</a>
          </div>
        </div>
      </div>
    </div>
  );
}
