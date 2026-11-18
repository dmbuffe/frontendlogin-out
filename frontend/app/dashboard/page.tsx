"use client";

import { useCallback, useEffect, useState } from "react";
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
  Calendar,
  Car,
  Check,
  Eye,
  Hash,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

interface Vehicle {
  vehicle_id: number;
  vehicle_number: number;
  vehicle_type: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

 
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");


  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

 
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient<Vehicle[]>("/vehicle", {
        method: "GET",
        requiresAuth: true,
      } as RequestInit);
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch vehicles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isChecking) {
      fetchVehicles();
    }
  }, [isChecking, fetchVehicles]);

  
  const handleReadSingle = async (id: number) => {
    setError("");
    setSuccess("");
    try {
      const data = await apiClient<Vehicle>(`/vehicle/${id}`, {
        method: "GET",
        requiresAuth: true,
      } as RequestInit);
      setSelectedVehicle(data);
      setIsFormOpen(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || `Failed to fetch vehicle #${id}.`);
    }
  };

 
  const openCreateForm = () => {
    setEditingId(null);
    setVehicleNumber("");
    setVehicleType("");
    setSelectedVehicle(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

 
  const openEditForm = (vehicle: Vehicle) => {
    setEditingId(vehicle.vehicle_id);
    setVehicleNumber(String(vehicle.vehicle_number));
    setVehicleType(vehicle.vehicle_type);
    setSelectedVehicle(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setVehicleNumber("");
    setVehicleType("");
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const payload = {
      vehicle_number: Number(vehicleNumber),
      vehicle_type: vehicleType,
    };

    try {
      if (editingId !== null) {
        await apiClient(`/vehicle/${editingId}`, {
          method: "PUT",
          requiresAuth: true,
          body: JSON.stringify(payload),
        } as RequestInit);
        setSuccess(`Vehicle #${editingId} updated successfully.`);
      } else {
        await apiClient("/vehicle", {
          method: "POST",
          requiresAuth: true,
          body: JSON.stringify(payload),
        } as RequestInit);
        setSuccess("Vehicle created successfully.");
      }

      closeForm();
      await fetchVehicles();
    } catch (err: any) {
      setError(
        err.message ||
          (editingId !== null
            ? "Failed to update vehicle."
            : "Failed to create vehicle.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Vehicle #${id}?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await apiClient(`/vehicle/${id}`, {
        method: "DELETE",
        requiresAuth: true,
      } as RequestInit);

      if (selectedVehicle?.vehicle_id === id) setSelectedVehicle(null);
      if (editingId === id) closeForm();
      setSuccess(`Vehicle #${id} deleted successfully.`);
      await fetchVehicles();
    } catch (err: any) {
      setError(err.message || `Failed to delete Vehicle #${id}.`);
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  const getTypeBadgeStyle = (type: string) => {
    const normalized = type.trim().toLowerCase();
    if (normalized.includes("car") || normalized.includes("sedan")) {
      return {
        pill: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
        dot: "bg-blue-500",
      };
    }
    if (normalized.includes("van") || normalized.includes("suv") || normalized.includes("truck")) {
      return {
        pill: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
        dot: "bg-amber-500",
      };
    }
    if (normalized.includes("motor") || normalized.includes("bike")) {
      return {
        pill: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
        dot: "bg-emerald-500",
      };
    }
    return {
      pill: "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
      dot: "bg-indigo-500",
    };
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/80 to-slate-50 p-4 sm:p-8 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
          <div className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                    Dashboard
                  </h1>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    {vehicles.length} {vehicles.length === 1 ? "Vehicle" : "Vehicles"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                  Parking Management System — Manage vehicles
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
        </header>

        
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="rounded-md p-1 hover:bg-red-100 dark:hover:bg-red-900/40"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        
        {success && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
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

       
        {isFormOpen && (
          <Card className="overflow-hidden rounded-2xl border-blue-200/80 bg-white shadow-sm dark:border-blue-900/60 dark:bg-slate-900">
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600" />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-slate-100 bg-slate-50/60 pb-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingId !== null
                    ? `Update Vehicle #${editingId}`
                    : "Create New Vehicle"}
                </CardTitle>
                <CardDescription>
                  {editingId !== null
                    ? "Modify the vehicle details below."
                    : "Fill in the details to add a new vehicle."}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_number">Vehicle Number</Label>
                    <div className="relative">
                      <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="vehicle_number"
                        type="number"
                        placeholder="e.g. 1112"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_type">Vehicle Type</Label>
                    <div className="relative">
                      <Car className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="vehicle_type"
                        type="text"
                        placeholder="e.g. Car, SUV, Motorcycle"
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
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
                        ? "Update Vehicle"
                        : "Create Vehicle"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

       
        {selectedVehicle && (
          <Card className="overflow-hidden rounded-2xl border-indigo-200/80 bg-white shadow-sm dark:border-indigo-900/60 dark:bg-slate-900">
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-cyan-500" />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-slate-100 bg-slate-50/60 pb-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                  Vehicle Details (#{selectedVehicle.vehicle_id})
                </CardTitle>
                <CardDescription>
                  Fetched directly from GET /vehicle/{selectedVehicle.vehicle_id}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedVehicle(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="text-xs text-slate-500">Vehicle ID</p>
                  <p className="mt-1 font-mono text-base font-bold text-slate-900 dark:text-white">
                    #{selectedVehicle.vehicle_id}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="text-xs text-slate-500">Vehicle Number</p>
                  <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                    {selectedVehicle.vehicle_number}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="text-xs text-slate-500">Vehicle Type</p>
                  <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                    {selectedVehicle.vehicle_type}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="text-xs text-slate-500">Created At</p>
                  <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                    {selectedVehicle.created_at
                      ? new Date(selectedVehicle.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

    
        <Card className="overflow-hidden rounded-2xl border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/50 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900/50">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Vehicles
              </CardTitle>
              <CardDescription>
                A list of all vehicles stored in the backend.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchVehicles}
                disabled={loading}
              >
                <RefreshCw
                  className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Read / Refresh
              </Button>
              <Button
                size="sm"
                onClick={openCreateForm}
                className="bg-blue-600 text-white shadow-sm hover:bg-blue-700"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create Vehicle
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-slate-800/40">
                <TableRow>
                  <TableHead className="pl-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    ID
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vehicle Number
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vehicle Type
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Created At
                  </TableHead>
                  <TableHead className="pr-6 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-slate-500"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                        <span className="text-sm">Loading vehicles...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                          <Car className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          No vehicles found
                        </p>
                        <p className="text-xs text-slate-500">
                          Click &quot;+ Create Vehicle&quot; to add your first entry.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicles.map((veh) => {
                    const badge = getTypeBadgeStyle(veh.vehicle_type);
                    return (
                      <TableRow
                        key={veh.vehicle_id}
                        className="transition-colors hover:bg-blue-50/30 dark:hover:bg-slate-800/40"
                      >
                        <TableCell className="pl-6">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            #{veh.vehicle_id}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900 dark:text-white">
                          {veh.vehicle_number}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.pill}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                            {veh.vehicle_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                              {veh.created_at
                                ? new Date(veh.created_at).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReadSingle(veh.vehicle_id)}
                              className="h-8 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              Read
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditForm(veh)}
                              className="h-8 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                            >
                              <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              Update
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(veh.vehicle_id)}
                              className="h-8"
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}