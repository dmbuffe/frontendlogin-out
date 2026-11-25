"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { clearTokens } from "@/lib/auth";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  LogOut,
  ParkingSquare,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

type TabKey = "vehicle" | "slot" | "timex" | "staff" | "payment";

interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  placeholder: string;
  options?: string[];
  fkSource?: "vehicle" | "timex";
}

interface TableConfig {
  key: TabKey;
  title: string;
  singular: string;
  description: string;
  endpoint: string;
  idField: string;
  icon: React.ComponentType<{ className?: string }>;
  columns: {
    key: string;
    label: string;
    isBadge?: boolean;
    isDate?: boolean;
    isCurrency?: boolean;
  }[];
  fields: FieldConfig[];
}

const TABLES: Record<TabKey, TableConfig> = {
  vehicle: {
    key: "vehicle",
    title: "Vehicles",
    singular: "Vehicle",
    description: "Manage registered vehicles in the parking system.",
    endpoint: "/vehicle",
    idField: "vehicle_id",
    icon: Car,
    columns: [
      { key: "vehicle_id", label: "ID" },
      { key: "vehicle_number", label: "Vehicle Number" },
      { key: "vehicle_type", label: "Vehicle Type", isBadge: true },
      { key: "created_at", label: "Created At", isDate: true },
    ],
    fields: [
      {
        key: "vehicle_number",
        label: "Vehicle Number",
        type: "number",
        placeholder: "e.g. 1112",
      },
      {
        key: "vehicle_type",
        label: "Vehicle Type",
        type: "text",
        placeholder: "e.g. Car, SUV, Van, Motorcycle",
      },
    ],
  },
  slot: {
    key: "slot",
    title: "Parking Slots",
    singular: "Slot",
    description: "Manage floor levels, slot statuses, and assigned vehicles.",
    endpoint: "/slot",
    idField: "slot_id",
    icon: ParkingSquare,
    columns: [
      { key: "slot_id", label: "ID" },
      { key: "floor_level", label: "Floor Level" },
      { key: "slot_number", label: "Slot Number" },
      { key: "slot_status", label: "Status", isBadge: true },
      { key: "vehicle_id", label: "Vehicle ID" },
      { key: "created_at", label: "Created At", isDate: true },
    ],
    fields: [
      {
        key: "floor_level",
        label: "Floor Level",
        type: "text",
        placeholder: "e.g. Floor 1, Basement A",
      },
      {
        key: "slot_number",
        label: "Slot Number",
        type: "number",
        placeholder: "e.g. 101",
      },
      {
        key: "slot_status",
        label: "Slot Status",
        type: "select",
        placeholder: "Select slot status",
        options: ["Available", "Occupied", "Reserved", "Maintenance"],
      },
      {
        key: "vehicle_id",
        label: "Assigned Vehicle",
        type: "number",
        placeholder: "Select or enter vehicle_id",
        fkSource: "vehicle",
      },
    ],
  },
  timex: {
    key: "timex",
    title: "Time Logs",
    singular: "Time Record",
    description: "Track vehicle entry and exit timestamps.",
    endpoint: "/timex",
    idField: "record_id",
    icon: Clock,
    columns: [
      { key: "record_id", label: "Record ID" },
      { key: "entry_time", label: "Entry Time" },
      { key: "exit_time", label: "Exit Time" },
      { key: "created_at", label: "Created At", isDate: true },
    ],
    fields: [
      {
        key: "entry_time",
        label: "Entry Time",
        type: "text",
        placeholder: "e.g. 08:30 AM",
      },
      {
        key: "exit_time",
        label: "Exit Time",
        type: "text",
        placeholder: "e.g. 02:15 PM",
      },
    ],
  },
  staff: {
    key: "staff",
    title: "Staff",
    singular: "Staff Member",
    description: "Manage parking attendants linked to system user accounts.",
    endpoint: "/staff",
    idField: "staff_id",
    icon: Users,
    columns: [
      { key: "staff_id", label: "Staff ID" },
      { key: "staff_name", label: "Staff Name" },
      { key: "staff_contactno", label: "Contact No." },
      { key: "id", label: "User ID" },
      { key: "created_at", label: "Created At", isDate: true },
    ],
    fields: [
      {
        key: "staff_name",
        label: "Staff Name",
        type: "text",
        placeholder: "e.g. Juan Dela Cruz",
      },
      {
        key: "staff_contactno",
        label: "Contact Number",
        type: "text",
        placeholder: "e.g. 09171234567",
      },
      {
        key: "id",
        label: "User ID (Existing users.id)",
        type: "number",
        placeholder: "e.g. 1",
      },
    ],
  },
  payment: {
    key: "payment",
    title: "Payments",
    singular: "Payment",
    description: "Manage parking fee transactions linked to time records.",
    endpoint: "/payment",
    idField: "payment_id",
    icon: CreditCard,
    columns: [
      { key: "payment_id", label: "Payment ID" },
      { key: "payment_date", label: "Payment Date" },
      { key: "payment_amount", label: "Amount", isCurrency: true },
      { key: "payment_method", label: "Method", isBadge: true },
      { key: "record_id", label: "Record ID" },
      { key: "created_at", label: "Created At", isDate: true },
    ],
    fields: [
      {
        key: "payment_date",
        label: "Payment Date",
        type: "text",
        placeholder: "e.g. 2026-11-25",
      },
      {
        key: "payment_amount",
        label: "Payment Amount",
        type: "number",
        placeholder: "e.g. 150",
      },
      {
        key: "payment_method",
        label: "Payment Method",
        type: "select",
        placeholder: "Select payment method",
        options: ["Cash", "GCash", "Card", "Maya"],
      },
      {
        key: "record_id",
        label: "Time Log Record",
        type: "number",
        placeholder: "Select or enter record_id",
        fkSource: "timex",
      },
    ],
  },
};

const TAB_ORDER: TabKey[] = ["vehicle", "slot", "timex", "staff", "payment"];

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  const [activeTab, setActiveTab] = useState<TabKey>("vehicle");
  const currentConfig = TABLES[activeTab];

  // Tagged table state prevents stale rows across tab switches
  const [tableState, setTableState] = useState<{
    tab: TabKey;
    rows: Record<string, any>[];
  }>({ tab: "vehicle", rows: [] });

  // Cached lookup options for FK dropdowns (vehicle_id & record_id)
  const [vehicleOptions, setVehicleOptions] = useState<Record<string, any>[]>([]);
  const [timexOptions, setTimexOptions] = useState<Record<string, any>[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Shared Create / Update form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Single record inspection state
  const [selectedRecord, setSelectedRecord] = useState<Record<string, any> | null>(
    null
  );

  const records = tableState.tab === activeTab ? tableState.rows : [];

  // Live filtered rows based on search query
  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((row) =>
      currentConfig.columns.some((col) =>
        String(row[col.key] ?? "")
          .toLowerCase()
          .includes(q)
      )
    );
  }, [records, searchQuery, currentConfig.columns]);

  // Fetch foreign key reference lists quietly for smart dropdowns
  const fetchFkLookups = useCallback(async () => {
    try {
      const [vehs, times] = await Promise.all([
        apiClient<Record<string, any>[]>("/vehicle", {
          method: "GET",
          requiresAuth: true,
        } as RequestInit).catch(() => []),
        apiClient<Record<string, any>[]>("/timex", {
          method: "GET",
          requiresAuth: true,
        } as RequestInit).catch(() => []),
      ]);
      if (Array.isArray(vehs)) setVehicleOptions(vehs);
      if (Array.isArray(times)) setTimexOptions(times);
    } catch {
      // Non-blocking lookup helper
    }
  }, []);

  // 1. READ ALL (GET /<endpoint>)
  const fetchRecords = useCallback(
    async (targetTab: TabKey = activeTab) => {
      const cfg = TABLES[targetTab];
      setLoading(true);
      setError("");
      try {
        const data = await apiClient<Record<string, any>[]>(cfg.endpoint, {
          method: "GET",
          requiresAuth: true,
        } as RequestInit);

        const list = Array.isArray(data) ? data : [];
        setTableState({ tab: targetTab, rows: list });

        if (targetTab === "vehicle") setVehicleOptions(list);
        if (targetTab === "timex") setTimexOptions(list);
      } catch (err: any) {
        setTableState({ tab: targetTab, rows: [] });
        setError(
          err.message || `Failed to fetch ${cfg.title.toLowerCase()}.`
        );
      } finally {
        setLoading(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    if (!isChecking) {
      fetchRecords(activeTab);
      fetchFkLookups();
    }
  }, [isChecking, activeTab, fetchRecords, fetchFkLookups]);

  const handleTabChange = (tab: TabKey) => {
    if (tab === activeTab) return;
    setTableState({ tab, rows: [] });
    setActiveTab(tab);
    setSearchQuery("");
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({});
    setSelectedRecord(null);
    setError("");
    setSuccess("");
  };

  // 2. READ SINGLE (GET /<endpoint>/:id)
  const handleReadSingle = async (id: number) => {
    setError("");
    setSuccess("");
    try {
      const data = await apiClient<Record<string, any>>(
        `${currentConfig.endpoint}/${id}`,
        {
          method: "GET",
          requiresAuth: true,
        } as RequestInit
      );
      setSelectedRecord(data);
      setIsFormOpen(false);
      setEditingId(null);
    } catch (err: any) {
      setError(
        err.message || `Failed to fetch ${currentConfig.singular} #${id}.`
      );
    }
  };

  // Open form for CREATE
  const openCreateForm = () => {
    const emptyState: Record<string, string> = {};
    currentConfig.fields.forEach((f) => {
      if (f.type === "select" && f.options?.length) {
        emptyState[f.key] = f.options[0];
      } else if (f.fkSource === "vehicle" && vehicleOptions.length > 0) {
        emptyState[f.key] = String(vehicleOptions[0].vehicle_id);
      } else if (f.fkSource === "timex" && timexOptions.length > 0) {
        emptyState[f.key] = String(timexOptions[0].record_id);
      } else {
        emptyState[f.key] = "";
      }
    });
    setEditingId(null);
    setFormData(emptyState);
    setSelectedRecord(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  // Open form pre-filled for UPDATE
  const openEditForm = (row: Record<string, any>) => {
    const prefilled: Record<string, string> = {};
    currentConfig.fields.forEach((f) => {
      prefilled[f.key] =
        row[f.key] !== undefined && row[f.key] !== null
          ? String(row[f.key])
          : "";
    });
    setEditingId(Number(row[currentConfig.idField]));
    setFormData(prefilled);
    setSelectedRecord(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({});
  };

  // 3 & 4. CREATE (POST /<endpoint>) & UPDATE (PUT /<endpoint>/:id)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const payload: Record<string, any> = {};
    currentConfig.fields.forEach((field) => {
      const rawValue = formData[field.key] ?? "";
      payload[field.key] =
        field.type === "number" ? Number(rawValue) : rawValue;
    });

    try {
      if (editingId !== null) {
        await apiClient(`${currentConfig.endpoint}/${editingId}`, {
          method: "PUT",
          requiresAuth: true,
          body: JSON.stringify(payload),
        } as RequestInit);
        setSuccess(
          `${currentConfig.singular} #${editingId} updated successfully.`
        );
      } else {
        await apiClient(currentConfig.endpoint, {
          method: "POST",
          requiresAuth: true,
          body: JSON.stringify(payload),
        } as RequestInit);
        setSuccess(`${currentConfig.singular} created successfully.`);
      }

      closeForm();
      await fetchRecords(activeTab);
    } catch (err: any) {
      setError(
        err.message ||
          (editingId !== null
            ? `Failed to update ${currentConfig.singular.toLowerCase()}.`
            : `Failed to create ${currentConfig.singular.toLowerCase()}.`)
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 5. DELETE (DELETE /<endpoint>/:id)
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${currentConfig.singular} #${id}?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await apiClient(`${currentConfig.endpoint}/${id}`, {
        method: "DELETE",
        requiresAuth: true,
      } as RequestInit);

      if (selectedRecord?.[currentConfig.idField] === id) {
        setSelectedRecord(null);
      }
      if (editingId === id) closeForm();
      setSuccess(`${currentConfig.singular} #${id} deleted successfully.`);
      await fetchRecords(activeTab);
    } catch (err: any) {
      const msg = String(err.message || "");
      if (msg.toLowerCase().includes("internal server error")) {
        setError(
          `Cannot delete ${currentConfig.singular} #${id} because another table still references it. Delete the linked child record first.`
        );
      } else {
        setError(
          msg || `Failed to delete ${currentConfig.singular} #${id}.`
        );
      }
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  const getBadgeStyle = (value: string) => {
    const normalized = String(value).trim().toLowerCase();
    if (
      normalized.includes("available") ||
      normalized.includes("cash") ||
      normalized.includes("motor")
    ) {
      return {
        pill: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
        dot: "bg-emerald-500",
      };
    }
    if (
      normalized.includes("occupied") ||
      normalized.includes("van") ||
      normalized.includes("suv") ||
      normalized.includes("reserved")
    ) {
      return {
        pill: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
        dot: "bg-amber-500",
      };
    }
    if (normalized.includes("maintenance")) {
      return {
        pill: "bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
        dot: "bg-red-500",
      };
    }
    return {
      pill: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      dot: "bg-blue-500",
    };
  };

  const formatAmount = (value: unknown) => {
    const num = Number(value);
    if (value === null || value === undefined || Number.isNaN(num)) {
      return "—";
    }
    return `₱${num.toLocaleString()}`;
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 animate-pulse">
          Verifying session...
        </p>
      </div>
    );
  }

  const ActiveIcon = currentConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/80 to-slate-50 p-4 sm:p-8 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Card with Accent Strip & Table Switcher */}
        <header className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
          <div className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20">
                <ActiveIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                    Parking Management System
                  </h1>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    {records.length}{" "}
                    {records.length === 1 ? "Record" : "Records"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                  Active Module: <span className="font-medium text-slate-700 dark:text-slate-200">{currentConfig.title}</span> — {currentConfig.description}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="self-start sm:self-auto border-red-200 bg-red-50/80 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Database Table Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 bg-slate-50/70 px-6 py-3 dark:border-slate-800 dark:bg-slate-900/60">
            {TAB_ORDER.map((tabKey) => {
              const tab = TABLES[tabKey];
              const Icon = tab.icon;
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => handleTabChange(tabKey)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.title}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Error Alert Banner */}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              className="rounded-md p-1 hover:bg-red-100 dark:hover:bg-red-900/40"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Success Alert Banner */}
        {success && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
            <button
              onClick={() => setSuccess("")}
              className="rounded-md p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Shared Create / Update Form Card */}
        {isFormOpen && (
          <Card className="overflow-hidden rounded-2xl border-blue-200/80 bg-white shadow-sm dark:border-blue-900/60 dark:bg-slate-900">
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600" />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-slate-100 bg-slate-50/60 pb-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingId !== null
                    ? `Update ${currentConfig.singular} #${editingId}`
                    : `Create New ${currentConfig.singular}`}
                </CardTitle>
                <CardDescription>
                  {editingId !== null
                    ? `Modify the ${currentConfig.singular.toLowerCase()} details below.`
                    : `Fill in the details to add a new ${currentConfig.singular.toLowerCase()}.`}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {currentConfig.fields.map((field) => {
                    // Render smart FK dropdown if vehicle or timex records exist
                    if (
                      field.fkSource === "vehicle" &&
                      vehicleOptions.length > 0
                    ) {
                      return (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={field.key}>{field.label}</Label>
                          <select
                            id={field.key}
                            value={formData[field.key] ?? ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            required
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                          >
                            <option value="" disabled>
                              Select a vehicle...
                            </option>
                            {vehicleOptions.map((v) => (
                              <option key={v.vehicle_id} value={v.vehicle_id}>
                                #{v.vehicle_id} — Plate {v.vehicle_number} (
                                {v.vehicle_type})
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    if (
                      field.fkSource === "timex" &&
                      timexOptions.length > 0
                    ) {
                      return (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={field.key}>{field.label}</Label>
                          <select
                            id={field.key}
                            value={formData[field.key] ?? ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            required
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                          >
                            <option value="" disabled>
                              Select a time log...
                            </option>
                            {timexOptions.map((t) => (
                              <option key={t.record_id} value={t.record_id}>
                                #{t.record_id} — In: {t.entry_time} / Out:{" "}
                                {t.exit_time}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    if (field.type === "select" && field.options) {
                      return (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={field.key}>{field.label}</Label>
                          <select
                            id={field.key}
                            value={formData[field.key] ?? ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            required
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                          >
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    return (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={field.key}>{field.label}</Label>
                        <Input
                          id={field.key}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formData[field.key] ?? ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    disabled={submitting}
                  >
                    {submitting
                      ? editingId !== null
                        ? "Updating..."
                        : "Creating..."
                      : editingId !== null
                        ? `Update ${currentConfig.singular}`
                        : `Create ${currentConfig.singular}`}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Single Record Details Card (GET /<endpoint>/:id) */}
        {selectedRecord && (
          <Card className="overflow-hidden rounded-2xl border-indigo-200/80 bg-white shadow-sm dark:border-indigo-900/60 dark:bg-slate-900">
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-cyan-500" />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-slate-100 bg-slate-50/60 pb-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                  {currentConfig.singular} Details (#
                  {selectedRecord[currentConfig.idField]})
                </CardTitle>
                <CardDescription>
                  Fetched directly from GET {currentConfig.endpoint}/
                  {selectedRecord[currentConfig.idField]}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedRecord(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
                {currentConfig.columns.map((col) => {
                  const val = selectedRecord[col.key];
                  return (
                    <div
                      key={col.key}
                      className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <p className="text-xs text-slate-500">{col.label}</p>
                      <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                        {col.key === currentConfig.idField
                          ? `#${val ?? "—"}`
                          : col.isCurrency
                            ? formatAmount(val)
                            : col.isDate
                              ? val
                                ? new Date(val).toLocaleDateString()
                                : "N/A"
                              : (val ?? "N/A")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Records Table Card */}
        <Card className="overflow-hidden rounded-2xl border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/50 lg:flex-row lg:items-center dark:border-slate-800 dark:bg-slate-900/50">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                {currentConfig.title}
              </CardTitle>
              <CardDescription>{currentConfig.description}</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Live Search Filter */}
              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder={`Search ${currentConfig.title.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-7 text-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchRecords(activeTab)}
                disabled={loading}
                className="h-8"
              >
                <RefreshCw
                  className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={openCreateForm}
                className="h-8 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create {currentConfig.singular}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-slate-50/80 dark:bg-slate-800/40">
                  <TableRow>
                    {currentConfig.columns.map((col, idx) => (
                      <TableHead
                        key={col.key}
                        className={`${idx === 0 ? "w-20 pl-6" : ""} whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-500`}
                      >
                        {col.label}
                      </TableHead>
                    ))}
                    <TableHead className="w-56 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={currentConfig.columns.length + 1}
                        className="py-12 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                          <span className="text-sm">
                            Loading {currentConfig.title.toLowerCase()}...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={currentConfig.columns.length + 1}
                        className="py-12 text-center"
                      >
                        <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                            <ActiveIcon className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {searchQuery
                              ? `No matching ${currentConfig.title.toLowerCase()}`
                              : `No ${currentConfig.title.toLowerCase()} found`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {searchQuery
                              ? "Try clearing your search filter."
                              : `Click "+ Create ${currentConfig.singular}" to add your first entry.`}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((row, rowIdx) => {
                      const rawId = row[currentConfig.idField];
                      const rowId = Number(rawId);
                      return (
                        <TableRow
                          key={rawId ?? `${activeTab}-${rowIdx}`}
                          className="transition-colors hover:bg-blue-50/30 dark:hover:bg-slate-800/40"
                        >
                          {currentConfig.columns.map((col, idx) => {
                            const value = row[col.key];

                            if (idx === 0) {
                              return (
                                <TableCell
                                  key={col.key}
                                  className="whitespace-nowrap pl-6"
                                >
                                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    #{value ?? "—"}
                                  </span>
                                </TableCell>
                              );
                            }

                            if (col.isBadge) {
                              const badge = getBadgeStyle(String(value ?? ""));
                              return (
                                <TableCell
                                  key={col.key}
                                  className="whitespace-nowrap"
                                >
                                  {value ? (
                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.pill}`}
                                    >
                                      <span
                                        className={`h-1.5 w-1.5 rounded-full ${badge.dot}`}
                                      />
                                      {value}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-400">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                              );
                            }

                            if (col.isDate) {
                              return (
                                <TableCell
                                  key={col.key}
                                  className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    <span>
                                      {value
                                        ? new Date(value).toLocaleDateString()
                                        : "N/A"}
                                    </span>
                                  </div>
                                </TableCell>
                              );
                            }

                            if (col.isCurrency) {
                              return (
                                <TableCell
                                  key={col.key}
                                  className="whitespace-nowrap font-medium text-slate-900 dark:text-white"
                                >
                                  {formatAmount(value)}
                                </TableCell>
                              );
                            }

                            return (
                              <TableCell
                                key={col.key}
                                className="whitespace-nowrap font-medium text-slate-900 dark:text-white"
                              >
                                {value ?? "—"}
                              </TableCell>
                            );
                          })}

                          <TableCell className="whitespace-nowrap pr-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReadSingle(rowId)}
                                className="h-7 px-2.5 text-xs hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                              >
                                <Eye className="mr-1 h-3.5 w-3.5" />
                                Read
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditForm(row)}
                                className="h-7 px-2.5 text-xs hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                              >
                                <Pencil className="mr-1 h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(rowId)}
                                className="h-7 px-2.5 text-xs"
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}