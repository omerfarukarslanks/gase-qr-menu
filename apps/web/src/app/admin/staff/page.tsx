"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, UserCog } from "lucide-react";
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

const ROLES = [
  { value: "MANAGER", label: "Mudur" },
  { value: "STAFF", label: "Personel" },
  { value: "WAITER", label: "Garson" },
  { value: "KITCHEN", label: "Mutfak" },
];

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  storeName: string;
  isActive: boolean;
}

interface StaffForm {
  name: string;
  email: string;
  password: string;
  role: string;
}

const emptyForm: StaffForm = {
  name: "",
  email: "",
  password: "",
  role: "STAFF",
};

const demoStaff: StaffMember[] = [];

export default function StaffPage() {
  const [staff] = useState<StaffMember[]>(demoStaff);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);

  function handleOpenCreate() {
    setEditingId(null);
    setForm(emptyForm);
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
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (editingId) {
      alert("Personel bilgileri guncellendi.");
    } else {
      alert("Yeni personel eklendi.");
    }
    handleCancel();
  }

  function handleDelete(id: string) {
    if (confirm("Bu personeli silmek istediginize emin misiniz?")) {
      alert(`Personel silindi: ${id}`);
    }
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
        description="Personel ekleyin, rollerini ve sube atamalarini yonetin."
        action={
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni personel
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Personeli duzenle" : "Yeni personel ekle"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
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
                <select
                  className="flex h-11 w-full rounded-[1rem] border border-input bg-background px-3 py-2 text-sm"
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2 sm:flex-row">
                <Button type="submit">{editingId ? "Guncelle" : "Ekle"}</Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Iptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
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
          {staff.length === 0 ? (
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
                  header: "Durum",
                  className: "text-center",
                  cell: (member) =>
                    member.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        Pasif
                      </span>
                    ),
                },
                {
                  header: "Islemler",
                  className: "text-right",
                  cell: (member) => (
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(member.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(member.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
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
