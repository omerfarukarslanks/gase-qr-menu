"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Loader2, Pencil, Plus, UserCog } from "lucide-react";
import { AdminDrawer } from "@/components/admin/admin-drawer";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ResponsiveDataTable } from "@/components/admin/responsive-data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";
import { useCurrentStore } from "@/hooks/use-current-store";
import {
  type StaffMember,
  type StaffRole,
  useCreateStaff,
  useStaff,
  useToggleStaffStatus,
  useUpdateStaff,
} from "@/hooks/use-staff";

const ROLES: { value: StaffRole; label: string }[] = [
  { value: "MANAGER", label: "Mudur" },
  { value: "STAFF", label: "Personel" },
  { value: "WAITER", label: "Garson" },
  { value: "KITCHEN", label: "Mutfak" },
];

interface StaffForm {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
}

const emptyForm: StaffForm = {
  name: "",
  email: "",
  password: "",
  role: "STAFF",
};

function getErrorMessage(error: unknown) {
  if (!error) {
    return "Islem tamamlanamadi.";
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string | string[] } } }).response?.data
      ?.message !== "undefined"
  ) {
    const message = (error as { response?: { data?: { message?: string | string[] } } })
      .response?.data?.message;
    return Array.isArray(message) ? message.join(", ") : message || "Islem tamamlanamadi.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Islem tamamlanamadi.";
}

export default function StaffPage() {
  const { activeStoreId, activeStore } = useCurrentStore();
  const { data: staff = [], isLoading, isError, error } = useStaff(activeStoreId ?? "");
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const toggleStaffStatus = useToggleStaffStatus();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");

  const editingMember = useMemo(
    () => staff.find((member) => member.id === editingId) ?? null,
    [editingId, staff]
  );
  const busy =
    createStaff.isPending || updateStaff.isPending || toggleStaffStatus.isPending;

  function handleOpenCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  }

  function handleEdit(member: StaffMember) {
    setEditingId(member.id);
    setForm({
      name: member.name,
      email: member.email,
      password: "",
      role: member.role,
    });
    setFormError("");
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!activeStoreId) {
      setFormError("Devam etmek icin aktif magaza secin.");
      return;
    }

    setFormError("");
    setSuccessMessage("");

    if (editingId) {
      updateStaff.mutate(
        {
          id: editingId,
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          role: form.role,
        },
        {
          onSuccess: () => {
            setSuccessMessage("Personel bilgileri guncellendi.");
            handleCancel();
          },
          onError: (mutationError) => {
            setFormError(getErrorMessage(mutationError));
          },
        }
      );
      return;
    }

    createStaff.mutate(
      {
        storeId: activeStoreId,
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      },
      {
        onSuccess: () => {
          setSuccessMessage("Yeni personel eklendi.");
          handleCancel();
        },
        onError: (mutationError) => {
          setFormError(getErrorMessage(mutationError));
        },
      }
    );
  }

  function handleToggleActive(member: StaffMember) {
    setSuccessMessage("");

    toggleStaffStatus.mutate(
      {
        id: member.id,
        isActive: !member.isActive,
      },
      {
        onSuccess: () => {
          setSuccessMessage(
            member.isActive
              ? `${member.name} pasif yapildi.`
              : `${member.name} tekrar aktif edildi.`
          );
        },
      }
    );
  }

  function getRoleLabel(role: string) {
    return ROLES.find((item) => item.value === role)?.label ?? role;
  }

  function getRoleBadgeClass(role: string) {
    switch (role) {
      case "MANAGER":
        return "bg-purple-100 text-purple-700";
      case "STAFF":
        return "bg-blue-100 text-blue-700";
      case "WAITER":
        return "bg-green-100 text-green-700";
      case "KITCHEN":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Personel yonetimi"
        description={
          activeStore
            ? `${activeStore.name} icin personel rollerini ve erisimlerini yonetin.`
            : "Personel yonetimi icin aktif magaza secin."
        }
        action={
          <Button onClick={handleOpenCreate} disabled={!activeStoreId}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni personel
          </Button>
        }
      />

      <AdminDrawer
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            handleCancel();
          }
        }}
        title={editingId ? "Personeli duzenle" : "Yeni personel ekle"}
        description={
          editingMember
            ? `${editingMember.storeName} personel kaydini guncelleyin.`
            : "Personel, rol ve giris bilgilerini drawer uzerinden yonetin."
        }
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          onInvalidCapture={(event) =>
            event.currentTarget.classList.add("form-validation-submitted")
          }
        >
          {formError && (
            <p className="rounded-[1.1rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {formError}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ad soyad</label>
              <Input
                placeholder="orn. Ahmet Yilmaz"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="personel@restoran.com"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {editingId ? "Yeni sifre (bos birakilabilir)" : "Sifre"}
              </label>
              <Input
                type="password"
                placeholder="Sifre girin"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required={!editingId}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <SearchableSelect
                options={ROLES}
                value={form.role}
                onChange={(value) =>
                  setForm({ ...form, role: String(value) as StaffRole })
                }
                searchPlaceholder="Rol ara..."
              />
            </div>
          </div>

          <div className="sticky bottom-0 z-10 -mx-2 rounded-[1.4rem] border border-border/80 bg-background/92 p-3 shadow-[var(--card-shadow-hover)] backdrop-blur lg:mx-0">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingId ? "Guncelle" : "Ekle"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Iptal
              </Button>
            </div>
          </div>
        </form>
      </AdminDrawer>

      {successMessage && (
        <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => {
          const count = staff.filter((item) => item.role === role.value).length;
          return (
            <Card key={role.value}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`rounded-lg p-2 ${getRoleBadgeClass(role.value)}`}>
                  <UserCog className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{role.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personel listesi</CardTitle>
          <CardDescription>Tum kayitli personel ve rol atamalari.</CardDescription>
        </CardHeader>
        <CardContent>
          {!activeStoreId ? (
            <p className="text-sm text-muted-foreground">
              Devam etmek icin bir magaza secin.
            </p>
          ) : isLoading ? (
            <div className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Personel listesi yukleniyor...
            </div>
          ) : isError ? (
            <div className="flex items-start gap-3 rounded-[1.25rem] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{getErrorMessage(error)}</p>
            </div>
          ) : staff.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henuz personel eklenmemis. "Yeni Personel" butonuna tiklayarak baslayabilirsiniz.
            </p>
          ) : (
            <ResponsiveDataTable
              data={staff}
              getKey={(member) => member.id}
              columns={[
                {
                  header: "Ad soyad",
                  cell: (member) => <span className="font-medium">{member.name}</span>,
                },
                {
                  header: "Email",
                  cell: (member) => (
                    <span className="text-muted-foreground">{member.email}</span>
                  ),
                },
                {
                  header: "Rol",
                  cell: (member) => (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeClass(
                        member.role
                      )}`}
                    >
                      {getRoleLabel(member.role)}
                    </span>
                  ),
                },
                {
                  header: "Sube",
                  cell: (member) => member.storeName,
                },
                {
                  header: "Islemler",
                  className: "text-right",
                  cell: (member) => (
                    <div className="flex items-center justify-end gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={member.isActive}
                          disabled={busy}
                          onCheckedChange={() => handleToggleActive(member)}
                          aria-label={`${member.name} durumunu degistir`}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busy}
                        onClick={() => handleEdit(member)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              mobileCard={(member) => (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{member.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeClass(
                        member.role
                      )}`}
                    >
                      {getRoleLabel(member.role)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Sube
                      </p>
                      <p className="mt-1 text-foreground">{member.storeName}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Durum
                      </p>
                      <p className="mt-1 text-foreground">
                        {member.isActive ? "Aktif" : "Pasif"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={member.isActive}
                        disabled={busy}
                        onCheckedChange={() => handleToggleActive(member)}
                        aria-label={`${member.name} durumunu degistir`}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={busy}
                      onClick={() => handleEdit(member)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
