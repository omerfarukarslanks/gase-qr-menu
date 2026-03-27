"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, UserCog } from "lucide-react";
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

// Demo data for display purposes
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // API call would go here
    if (editingId) {
      alert("Personel bilgileri guncellendi.");
    } else {
      alert("Yeni personel eklendi.");
    }
    handleCancel();
  }

  function handleDelete(id: string) {
    if (confirm("Bu personeli silmek istediginize emin misiniz?")) {
      // API call would go here
      alert(`Personel silindi: ${id}`);
    }
  }

  function getRoleLabel(role: string) {
    return ROLES.find((r) => r.value === role)?.label ?? role;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personel Yonetimi</h1>
          <p className="text-muted-foreground">
            Personel ekleyin, rollerini ve sube atamalarini yonetin.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Personel
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? "Personeli Duzenle" : "Yeni Personel Ekle"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ad Soyad</label>
                <Input
                  placeholder="orn. Ahmet Yilmaz"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="personel@restoran.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {editingId ? "Yeni Sifre (bos birakilabilir)" : "Sifre"}
                </label>
                <Input
                  type="password"
                  placeholder="Sifre girin"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit">
                  {editingId ? "Guncelle" : "Ekle"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Iptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Role Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => {
          const count = staff.filter((s) => s.role === role.value).length;
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
          <CardTitle>Personel Listesi</CardTitle>
          <CardDescription>
            Tum kayitli personel ve rol atamalari.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henuz personel eklenmemis. &quot;Yeni Personel&quot; butonuna
              tiklayarak baslayabilirsiniz.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Ad Soyad</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Rol</th>
                  <th className="pb-3 font-medium">Sube</th>
                  <th className="pb-3 font-medium text-center">Durum</th>
                  <th className="pb-3 font-medium text-right">Islemler</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} className="border-b last:border-0">
                    <td className="py-3 text-sm font-medium">{member.name}</td>
                    <td className="py-3 text-sm text-muted-foreground">{member.email}</td>
                    <td className="py-3 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeClass(
                          member.role
                        )}`}
                      >
                        {getRoleLabel(member.role)}
                      </span>
                    </td>
                    <td className="py-3 text-sm">{member.storeName}</td>
                    <td className="py-3 text-center">
                      {member.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          Pasif
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(member)}
                        >
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
