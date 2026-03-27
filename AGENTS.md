# GASE QR Menu System - Geliştirme Rehberi

## Proje Hakkında
QR kod tabanlı restoran menü, sipariş, masa yönetimi ve ödeme sistemi.
Çoklu şube, çoklu dil, stok takibi, kampanya yönetimi ve raporlama destekler.

## Teknoloji Stack'i
- **Backend**: NestJS (TypeScript) + Prisma ORM + PostgreSQL
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Mobil**: React Native (Expo) - Phase 2
- **Real-time**: Socket.IO + Redis pub/sub
- **Storage**: MinIO (S3-compatible) - resim ve 3D model
- **Cache/Queue**: Redis + Bull
- **Monorepo**: Turborepo + pnpm

## Proje Yapısı
```
gase-qr-menu/
├── apps/
│   ├── api/              # NestJS backend (port 4000)
│   └── web/              # Next.js frontend (port 3000)
├── packages/
│   ├── database/         # Prisma schema + client
│   └── shared/           # Ortak tipler, sabitler
├── docker-compose.yml    # PostgreSQL + Redis + MinIO
└── AGENTS.md
```

## Geliştirme Ortamı

### Başlangıç
```bash
# Bağımlılıkları yükle
pnpm install

# Docker servisleri başlat (PostgreSQL, Redis, MinIO)
docker-compose up -d

# .env dosyasını oluştur
cp .env.example .env

# Prisma client oluştur + migration
pnpm db:generate
pnpm db:migrate

# Seed data (diller + alerjenler)
pnpm db:seed

# Geliştirme sunucularını başlat
pnpm dev
```

### Ortam Değişkenleri
`.env.example` dosyasını `.env` olarak kopyalayıp değerleri güncelle.
Kritik değişkenler: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `S3_*`, `IYZICO_*`

## Veritabanı

### Schema
`packages/database/prisma/schema.prisma` - Tüm tablolar burada tanımlı.

### Temel Varlıklar
- **Organization** → Store (1:N) - çoklu şube
- **Category** - hiyerarşik (parent-child)
- **Product** - resim (max 5), 3D model, malzeme, alerjen
- **Menu** - kategori/ürün aktif-pasif, QR kod
- **RestaurantTable** - masa session, sipariş
- **Order** - durum akışı: DRAFT → PENDING → CONFIRMED → PREPARING → READY → SERVED
- **Campaign** - yüzde/sabit/happy hour/x al y öde

### Migration
```bash
pnpm db:migrate          # Yeni migration oluştur
pnpm db:push             # Schema'yı DB'ye push et (dev)
pnpm db:generate         # Prisma client güncelle
pnpm db:seed             # Seed data yükle
```

## Backend (NestJS)

### Modüller
| Modül | Açıklama |
|-------|----------|
| auth | JWT login, register, refresh token |
| organization | İşletme CRUD |
| store | Şube CRUD |
| category | Hiyerarşik kategori + çeviri |
| unit | Birim CRUD |
| ingredient | Malzeme + stok bilgisi |
| allergen | EU 14 alerjen + çeviri |
| product | Ürün CRUD + resim/3D upload |
| menu | Menü oluşturma + QR kod |
| table | Masa + session yönetimi |
| order | Sipariş + durum akışı |
| cart | Redis-backed sepet |
| payment | iyzico entegrasyonu |
| notification | WebSocket + bildirimler |
| campaign | Kampanya/indirim |
| stock | Stok takibi + hareket |
| kitchen | Mutfak ekranı API |
| report | Raporlama + export |
| upload | Dosya yükleme (S3/MinIO) |

### API Kuralları
- Tüm endpoint'ler `/api/v1/` prefix'i kullanır
- Auth gerektiren endpoint'ler JWT Bearer token bekler
- Public endpoint'ler `@Public()` decorator'ü ile işaretlenir
- Response format: `{ success: boolean, data?: T, message?: string, error?: string }`
- Pagination: `?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc`

### WebSocket Events
- `order:new` - Yeni sipariş geldi
- `order:status` - Sipariş durumu değişti
- `waiter:call` - Garson çağırıldı
- `kitchen:new-item` - Mutfağa yeni ürün geldi
- `kitchen:item-status` - Mutfak ürün durumu güncellendi
- `stock:low` - Düşük stok uyarısı
- `notification:new` - Yeni bildirim

## Frontend (Next.js)

### Sayfa Yapısı
- `/admin/*` - Yönetim paneli (sidebar layout)
- `/admin/kitchen` - Mutfak ekranı (tam ekran)
- `/m/:menuSlug` - Müşteri menü (mobile-first)
- `/m/:menuSlug/cart` - Sepet
- `/m/:menuSlug/product/:id` - Ürün detayı + 3D

### State Yönetimi
- **Server state**: TanStack Query (React Query)
- **Client state**: Zustand (auth, cart)
- **Cart**: Redis-backed (API) + Zustand (client sync)

### UI Bileşenleri
shadcn/ui pattern'i: `src/components/ui/` altında CVA tabanlı bileşenler.
Admin bileşenleri: `src/components/admin/`
Menü bileşenleri: `src/components/menu/`

### 3D Model Görüntüleme
Google `<model-viewer>` web component'i kullanılır.
Format: GLB (glTF Binary). AR desteği mobil tarayıcılarda otomatik.

## Önemli Kurallar

### Güvenlik
- JWT token'lar httpOnly cookie'de saklanır (production)
- Tüm input'lar class-validator ile doğrulanır
- File upload: tip ve boyut kontrolü (resim max 5MB, 3D max 50MB)
- CORS sadece izin verilen origin'lere açık
- SQL injection: Prisma parameterized queries

### Performans
- Redis: sepet, session cache, pub/sub
- Resim: sharp ile otomatik resize (thumbnail, medium, large)
- Pagination: tüm liste endpoint'lerinde zorunlu
- WebSocket: room-based (şube bazlı, gereksiz broadcast yok)

### Çoklu Dil
- DB: `*Translation` tabloları (CategoryTranslation, ProductTranslation, AllergenTranslation)
- Frontend: next-intl
- API: `?lang=tr` query param veya Accept-Language header

### Stok Takibi
- Sipariş onaylandığında (CONFIRMED) malzeme stoğu otomatik düşer
- Min stok seviyesi altında `stock:low` WebSocket event'i tetiklenir
- Manuel stok girişi/düzeltme admin panelden yapılır

### Ödeme (iyzico)
- Abstract PaymentProvider interface → farklı sağlayıcılar eklenebilir
- 3D Secure zorunlu
- Sandbox: `https://sandbox-api.iyzipay.com`
- Production: `https://api.iyzipay.com`

## Test
```bash
pnpm test              # Tüm testler
pnpm --filter @gase/api test       # Sadece backend
pnpm --filter @gase/web test       # Sadece frontend
```

## Geliştirme Fazları
1. ✅ Temel Altyapı (monorepo, DB, auth, CRUD)
2. Ürün & Menü Yönetimi
3. Müşteri Menü & Sepet
4. Masa & Sipariş Yönetimi
5. Ödeme, Kampanya & Sadakat
6. Stok & Raporlama
7. Mobil Uygulama
