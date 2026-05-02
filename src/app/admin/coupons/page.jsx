"use client";

import { useEffect, useMemo, useState } from "react";
import AdminProtectedRoute from "@/app/components/admin/AdminProtectedRoute";
import AdminDashboardLayout from "@/app/components/admin/AdminDashboardLayout";
import adminApi from "@/app/lib/adminApi";
import toast from "react-hot-toast";
import {
  Calendar,
  CheckCircle2,
  Edit3,
  Loader2,
  Percent,
  Plus,
  Power,
  PowerOff,
  Search,
  Store,
  Tag,
  Trash2,
  X,
} from "lucide-react";

const emptyForm = {
  code: "",
  description: "",
  type: "PERCENTAGE",
  value: "",
  scope: "GLOBAL_ORDER",
  vendorId: "",
  targetFoodIds: [],
  minOrderAmount: "0",
  maxDiscountAmount: "",
  startDate: "",
  endDate: "",
  usageLimit: "",
  userUsageLimit: "1",
  fundedBy: "PLATFORM",
};

const scopeOptions = [
  { value: "GLOBAL_ORDER", label: "Platform Order" },
  { value: "VENDOR_ORDER", label: "Restaurant Order" },
  { value: "SPECIFIC_ITEMS", label: "Specific Items" },
  { value: "DELIVERY_FEE", label: "Delivery Fee" },
];

const dateForInput = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const normalizeList = (payload, keys) => {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorFoods, setVendorFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadCoupons = async () => {
    const data = await adminApi.getDiscounts();
    setCoupons(normalizeList(data, ["discounts"]));
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [discountData, vendorData] = await Promise.all([
          adminApi.getDiscounts(),
          adminApi.getAllVendors({ limit: 200 }),
        ]);
        setCoupons(normalizeList(discountData, ["discounts"]));
        setVendors(normalizeList(vendorData, ["vendors", "data"]));
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load coupons");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!form.vendorId || form.scope !== "SPECIFIC_ITEMS") {
      setVendorFoods([]);
      return;
    }

    const loadFoods = async () => {
      try {
        const data = await adminApi.getVendorFoods(form.vendorId);
        setVendorFoods(normalizeList(data, ["foods", "items", "data"]));
      } catch (err) {
        setVendorFoods([]);
      }
    };

    loadFoods();
  }, [form.vendorId, form.scope]);

  const filteredCoupons = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return coupons;
    return coupons.filter((coupon) =>
      [coupon.code, coupon.description, coupon.scope, coupon.type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [coupons, query]);

  const stats = useMemo(() => ({
    active: coupons.filter((coupon) => coupon.isActive).length,
    inactive: coupons.filter((coupon) => !coupon.isActive).length,
    used: coupons.reduce((sum, coupon) => sum + (coupon.usageCount || 0), 0),
  }), [coupons]);

  const openCreate = () => {
    setEditingCoupon(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code || "",
      description: coupon.description || "",
      type: coupon.type || "PERCENTAGE",
      value: coupon.value || "",
      scope: coupon.scope || "GLOBAL_ORDER",
      vendorId: coupon.vendorId?._id || coupon.vendorId || "",
      targetFoodIds: (coupon.targetFoodIds || []).map((item) => item?._id || item),
      minOrderAmount: coupon.minOrderAmount ?? "0",
      maxDiscountAmount: coupon.maxDiscountAmount ?? "",
      startDate: dateForInput(coupon.startDate),
      endDate: dateForInput(coupon.endDate),
      usageLimit: coupon.usageLimit ?? "",
      userUsageLimit: coupon.userUsageLimit ?? "1",
      fundedBy: coupon.fundedBy || "PLATFORM",
    });
    setShowForm(true);
  };

  const updateForm = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "scope") {
        next.fundedBy = value === "GLOBAL_ORDER" || value === "DELIVERY_FEE" ? "PLATFORM" : "VENDOR";
        if (value !== "SPECIFIC_ITEMS") next.targetFoodIds = [];
        if (value === "GLOBAL_ORDER" || value === "DELIVERY_FEE") next.vendorId = "";
      }
      return next;
    });
  };

  const buildPayload = () => ({
    code: form.code.trim().toUpperCase(),
    description: form.description.trim(),
    type: form.type,
    value: Number(form.value),
    scope: form.scope,
    vendorId: form.vendorId || null,
    targetFoodIds: form.scope === "SPECIFIC_ITEMS" ? form.targetFoodIds : [],
    minOrderAmount: Number(form.minOrderAmount || 0),
    maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
    userUsageLimit: form.userUsageLimit === "" ? null : Number(form.userUsageLimit),
    fundedBy: form.fundedBy,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingCoupon) {
        await adminApi.updateDiscount(editingCoupon._id, payload);
        toast.success("Coupon updated");
      } else {
        await adminApi.createDiscount(payload);
        toast.success("Coupon created");
      }
      await loadCoupons();
      setShowForm(false);
      setEditingCoupon(null);
      setForm(emptyForm);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (coupon) => {
    try {
      if (coupon.isActive) {
        await adminApi.deactivateDiscount(coupon._id);
        toast.success("Coupon deactivated");
      } else {
        await adminApi.activateDiscount(coupon._id);
        toast.success("Coupon activated");
      }
      await loadCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update coupon status");
    }
  };

  const deleteCoupon = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}? This cannot be undone.`)) return;
    try {
      await adminApi.deleteDiscount(coupon._id);
      toast.success("Coupon deleted");
      await loadCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete coupon");
    }
  };

  return (
    <AdminProtectedRoute>
      <AdminDashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-600">Marketing Rules</p>
              <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-zinc-950 dark:text-white">
                Coupon Management
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Create platform, restaurant, item, and delivery-fee coupons with usage limits, dates, caps, and per-customer rules.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-[11px] font-black uppercase tracking-widest text-white transition active:scale-95 dark:bg-white dark:text-zinc-950"
            >
              <Plus size={16} />
              New Coupon
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Stat label="Active Coupons" value={stats.active} icon={CheckCircle2} />
            <Stat label="Inactive Coupons" value={stats.inactive} icon={PowerOff} />
            <Stat label="Total Redemptions" value={stats.used} icon={Tag} />
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                  {editingCoupon ? "Edit Coupon" : "Create Coupon"}
                </h2>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Code">
                  <input required value={form.code} onChange={(e) => updateForm("code", e.target.value.toUpperCase())} className="input" placeholder="SAVE20" />
                </Field>
                <Field label="Description">
                  <input required value={form.description} onChange={(e) => updateForm("description", e.target.value)} className="input" placeholder="20% off orders" />
                </Field>
                <Field label="Discount Type">
                  <select value={form.type} onChange={(e) => updateForm("type", e.target.value)} className="input">
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </Field>
                <Field label={form.type === "PERCENTAGE" ? "Value (%)" : "Value (NGN)"}>
                  <input required min="1" max={form.type === "PERCENTAGE" ? "100" : undefined} type="number" value={form.value} onChange={(e) => updateForm("value", e.target.value)} className="input" />
                </Field>
                <Field label="Scope">
                  <select value={form.scope} onChange={(e) => updateForm("scope", e.target.value)} className="input">
                    {scopeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </Field>
                {(form.scope === "VENDOR_ORDER" || form.scope === "SPECIFIC_ITEMS") && (
                  <Field label="Restaurant">
                    <select required value={form.vendorId} onChange={(e) => updateForm("vendorId", e.target.value)} className="input">
                      <option value="">Select restaurant</option>
                      {vendors.map((vendor) => (
                        <option key={vendor._id} value={vendor._id}>{vendor.storeName || vendor.businessName || vendor.email}</option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field label="Funded By">
                  <select value={form.fundedBy} onChange={(e) => updateForm("fundedBy", e.target.value)} className="input">
                    <option value="PLATFORM">Platform</option>
                    <option value="VENDOR">Vendor</option>
                  </select>
                </Field>
                <Field label="Minimum Order">
                  <input min="0" type="number" value={form.minOrderAmount} onChange={(e) => updateForm("minOrderAmount", e.target.value)} className="input" />
                </Field>
                <Field label="Max Discount">
                  <input min="0" type="number" value={form.maxDiscountAmount} onChange={(e) => updateForm("maxDiscountAmount", e.target.value)} className="input" placeholder="Optional" />
                </Field>
                <Field label="Total Usage Limit">
                  <input min="1" type="number" value={form.usageLimit} onChange={(e) => updateForm("usageLimit", e.target.value)} className="input" placeholder="Unlimited" />
                </Field>
                <Field label="Limit Per Customer">
                  <input min="1" type="number" value={form.userUsageLimit} onChange={(e) => updateForm("userUsageLimit", e.target.value)} className="input" />
                </Field>
                <Field label="Start Date">
                  <input type="date" value={form.startDate} onChange={(e) => updateForm("startDate", e.target.value)} className="input" />
                </Field>
                <Field label="End Date">
                  <input type="date" value={form.endDate} onChange={(e) => updateForm("endDate", e.target.value)} className="input" />
                </Field>
              </div>

              {form.scope === "SPECIFIC_ITEMS" && (
                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">Target Items</p>
                  <div className="grid max-h-52 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-zinc-200 p-3 dark:border-zinc-800 md:grid-cols-2">
                    {vendorFoods.length === 0 ? (
                      <p className="text-xs font-bold text-zinc-400">Select a restaurant to load items.</p>
                    ) : vendorFoods.map((food) => {
                      const id = food._id;
                      const checked = form.targetFoodIds.includes(id);
                      return (
                        <label key={id} className="flex cursor-pointer items-center gap-2 rounded-xl bg-zinc-50 p-2 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...form.targetFoodIds, id]
                                : form.targetFoodIds.filter((itemId) => itemId !== id);
                              updateForm("targetFoodIds", next);
                            }}
                          />
                          {food.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="h-11 rounded-xl px-5 text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  Cancel
                </button>
                <button disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-600 px-5 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50">
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  Save Coupon
                </button>
              </div>
            </form>
          )}

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Coupons</h2>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm outline-none focus:border-orange-500 dark:border-zinc-800 dark:bg-zinc-950 md:w-72" placeholder="Search coupons" />
              </div>
            </div>

            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="animate-spin text-orange-600" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCoupons.map((coupon) => (
                  <CouponRow key={coupon._id} coupon={coupon} onEdit={openEdit} onToggle={toggleStatus} onDelete={deleteCoupon} />
                ))}
                {filteredCoupons.length === 0 && (
                  <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm font-bold text-zinc-400 dark:border-zinc-800">
                    No coupons found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .input {
            width: 100%;
            height: 44px;
            border-radius: 12px;
            border: 1px solid rgb(228 228 231);
            background: rgb(250 250 250);
            padding: 0 12px;
            font-size: 13px;
            font-weight: 700;
            outline: none;
          }
          .input:focus {
            border-color: rgb(234 88 12);
            background: white;
          }
          :global(.dark) .input {
            border-color: rgb(39 39 42);
            background: rgb(9 9 11);
            color: white;
          }
        `}</style>
      </AdminDashboardLayout>
    </AdminProtectedRoute>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
          <p className="text-xl font-black text-zinc-950 dark:text-white">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function CouponRow({ coupon, onEdit, onToggle, onDelete }) {
  const usageLabel = coupon.usageLimit ? `${coupon.usageCount || 0}/${coupon.usageLimit}` : `${coupon.usageCount || 0}/Unlimited`;
  return (
    <div className="grid gap-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-orange-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
            {coupon.code}
          </span>
          <span className={`rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${coupon.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"}`}>
            {coupon.isActive ? "Active" : "Inactive"}
          </span>
          <span className="rounded-lg bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:bg-zinc-900">
            {coupon.scope?.replaceAll("_", " ")}
          </span>
        </div>
        <h3 className="mt-2 text-sm font-black text-zinc-950 dark:text-white">{coupon.description}</h3>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-bold text-zinc-500">
          <span className="inline-flex items-center gap-1"><Percent size={12} /> {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `NGN ${coupon.value?.toLocaleString()}`} off</span>
          <span className="inline-flex items-center gap-1"><Tag size={12} /> Used {usageLabel}</span>
          <span className="inline-flex items-center gap-1"><Store size={12} /> {coupon.fundedBy}</span>
          <span className="inline-flex items-center gap-1"><Calendar size={12} /> {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString() : "No expiry"}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onEdit(coupon)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3 text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          <Edit3 size={14} /> Edit
        </button>
        <button onClick={() => onToggle(coupon)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3 text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          {coupon.isActive ? <PowerOff size={14} /> : <Power size={14} />}
          {coupon.isActive ? "Deactivate" : "Activate"}
        </button>
        <button onClick={() => onDelete(coupon)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-50 px-3 text-[10px] font-black uppercase tracking-widest text-red-600 dark:bg-red-500/10">
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}
