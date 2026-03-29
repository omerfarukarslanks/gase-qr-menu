import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppButton, AppCard, AppChip, AppInput, EmptyState, Screen, StatPill } from '../../../src/components/ui';
import { usePublicMenu } from '../../../src/hooks/use-customer';
import { useCartStore } from '../../../src/stores/cart-store';
import { formatCurrency } from '../../../src/lib/format';
import { useAppTheme } from '../../../src/theme/provider';

function ProductRow({
  qrToken,
  product,
  onQuickAdd,
}: {
  qrToken: string;
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    images: { id: string; url: string; order: number }[];
    isAvailable: boolean;
    allergens: { id: string; name: string }[];
    categoryName?: string;
  };
  onQuickAdd: () => void;
}) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const coverImage = [...product.images].sort((a, b) => a.order - b.order)[0]?.url;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/m/[qrToken]/product/[productId]',
          params: {
            qrToken,
            productId: product.id,
          },
        })
      }
    >
      <AppCard style={{ flexDirection: 'row', gap: 14, opacity: product.isAvailable ? 1 : 0.72 }}>
        {coverImage ? (
          <Image
            source={{ uri: coverImage }}
            style={{ width: 92, height: 92, borderRadius: 18, backgroundColor: colors.muted }}
          />
        ) : (
          <View
            style={{
              width: 92,
              height: 92,
              borderRadius: 18,
              backgroundColor: colors.secondary,
            }}
          />
        )}

        <View style={{ flex: 1, gap: 8 }}>
          {product.categoryName ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>
              {product.categoryName.toUpperCase()}
            </Text>
          ) : null}
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>
            {product.name}
          </Text>
          {product.description ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 20 }}>
              {product.description}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {product.allergens.slice(0, 3).map((allergen) => (
              <View
                key={allergen.id}
                style={{
                  backgroundColor: colors.warmSurface,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ color: colors.warm, fontSize: 11, fontWeight: '700' }}>
                  {allergen.name}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '800' }}>
              {formatCurrency(product.price)}
            </Text>
            <AppButton
              style={{ minHeight: 40, paddingHorizontal: 16 }}
              variant={product.isAvailable ? 'secondary' : 'ghost'}
              onPress={onQuickAdd}
              disabled={!product.isAvailable}
            >
              {product.isAvailable ? 'Hizli Ekle' : 'Kapali'}
            </AppButton>
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

export default function MenuScreen() {
  const params = useLocalSearchParams<{ qrToken: string; table?: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const addItem = useCartStore((state) => state.addItem);
  const totalItems = useCartStore((state) => state.totalItems());
  const setTable = useCartStore((state) => state.setTable);
  const language = useCartStore((state) => state.language);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [excludeAllergens, setExcludeAllergens] = useState<string[]>([]);

  const qrToken = Array.isArray(params.qrToken) ? params.qrToken[0] : params.qrToken;
  const tableId = Array.isArray(params.table) ? params.table[0] : params.table;

  const { data, isLoading, isError, error } = usePublicMenu(qrToken, {
    table: tableId,
    lang: language,
  });

  useEffect(() => {
    if (data?.store.tableId) {
      setTable({
        tableId: data.store.tableId,
        tableName: data.store.tableName,
        menuToken: qrToken,
      });
    }
  }, [data?.store.tableId, data?.store.tableName, qrToken, setTable]);

  const flatProducts = useMemo(() => {
    return (data?.categories ?? []).flatMap((category) =>
      category.products.map((product) => ({
        ...product,
        categoryName: category.name,
      })),
    );
  }, [data?.categories]);

  const filteredProducts = useMemo(() => {
    return flatProducts.filter((product) => {
      if (selectedCategory && product.categoryId !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const haystack = `${product.name} ${product.description ?? ''}`.toLowerCase();

        if (!haystack.includes(searchQuery.trim().toLowerCase())) {
          return false;
        }
      }

      if (minPrice && product.price < Number(minPrice)) {
        return false;
      }

      if (maxPrice && product.price > Number(maxPrice)) {
        return false;
      }

      if (
        excludeAllergens.length > 0 &&
        product.allergens.some((allergen) => excludeAllergens.includes(allergen.code.toLowerCase()))
      ) {
        return false;
      }

      return true;
    });
  }, [excludeAllergens, flatProducts, maxPrice, minPrice, searchQuery, selectedCategory]);

  const groupedProducts = useMemo(() => {
    if (!data?.categories) {
      return [];
    }

    return data.categories
      .map((category) => ({
        ...category,
        products: filteredProducts.filter((product) => product.categoryId === category.id),
      }))
      .filter((category) => category.products.length > 0);
  }, [data?.categories, filteredProducts]);

  const activeFilterCount =
    (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + excludeAllergens.length + (searchQuery ? 1 : 0);

  if (isLoading) {
    return (
      <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <AppCard>
          <Text style={{ color: colors.foreground }}>Menu yukleniyor...</Text>
        </AppCard>
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <EmptyState
          title="Menu acilamadi"
          description={
            error instanceof Error
              ? error.message
              : 'Bu QR baglantisina ait aktif bir menu bulunamadi.'
          }
          action={<AppButton onPress={() => router.replace('/scanner')}>QR Tara</AppButton>}
        />
      </Screen>
    );
  }

  const operatingStatus = data.store.operatingStatus;

  return (
    <>
      <Screen>
        <AppCard>
          <View style={{ gap: 12 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>
                {tableId ? `Masa ${tableId}` : 'Canli menu'}
              </Text>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 34,
                  lineHeight: 40,
                  fontFamily: 'Fraunces_600SemiBold',
                }}
              >
                {data.store.name}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 22 }}>
                Hızlı tarama, net kategori geçişleri ve görünür sipariş aksiyonları.
              </Text>
            </View>

            {operatingStatus ? (
              <View
                style={{
                  backgroundColor: operatingStatus.acceptingOrders ? colors.successSurface : colors.warmSurface,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  alignSelf: 'flex-start',
                }}
              >
                <Text
                  style={{
                    color: operatingStatus.acceptingOrders ? colors.success : colors.warm,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {operatingStatus.message}
                </Text>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatPill label="Kategori" value={String(data.categories.length)} />
              <StatPill label="Urun" value={String(filteredProducts.length)} />
              <StatPill label="Sepet" value={String(totalItems)} />
            </View>
          </View>
        </AppCard>

        <AppCard>
          <AppInput
            placeholder="Urun, kategori veya lezzet ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <AppButton variant="secondary" onPress={() => filterSheetRef.current?.present()}>
            Filtreler {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
          </AppButton>
        </AppCard>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <AppChip
              label="Tum kategoriler"
              active={!selectedCategory}
              onPress={() => setSelectedCategory(null)}
            />
            {data.categories.map((category) => (
              <AppChip
                key={category.id}
                label={category.name}
                active={selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id)}
              />
            ))}
          </View>
        </ScrollView>

        {groupedProducts.length === 0 ? (
          <EmptyState
            title="Sonuc bulunamadi"
            description="Filtreleri sadeleştirerek daha fazla ürün görebilirsin."
            action={
              <AppButton
                variant="secondary"
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setMinPrice('');
                  setMaxPrice('');
                  setExcludeAllergens([]);
                }}
              >
                Filtreleri Temizle
              </AppButton>
            }
          />
        ) : (
          groupedProducts.map((category) => (
            <View key={category.id} style={{ gap: 12 }}>
              {!selectedCategory ? (
                <View style={{ gap: 4 }}>
                  <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '800' }}>
                    {category.name}
                  </Text>
                  {category.description ? (
                    <Text style={{ color: colors.mutedForeground }}>{category.description}</Text>
                  ) : null}
                </View>
              ) : null}

              {category.products.map((product) => (
                <ProductRow
                  key={product.id}
                  qrToken={qrToken}
                  product={product}
                  onQuickAdd={() =>
                    addItem({
                      productId: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.images[0]?.url,
                    })
                  }
                />
              ))}
            </View>
          ))
        )}

        {totalItems > 0 ? (
          <AppButton
            onPress={() =>
              router.push({
                pathname: '/m/[qrToken]/cart',
                params: { qrToken },
              })
            }
          >
            Sepete Git ({totalItems})
          </AppButton>
        ) : null}
      </Screen>

      <BottomSheetModal ref={filterSheetRef} snapPoints={['55%']} backgroundStyle={{ backgroundColor: colors.card }}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>Filtreler</Text>

          <AppInput
            keyboardType="numeric"
            placeholder="Min fiyat"
            value={minPrice}
            onChangeText={setMinPrice}
          />
          <AppInput
            keyboardType="numeric"
            placeholder="Max fiyat"
            value={maxPrice}
            onChangeText={setMaxPrice}
          />

          <Text style={{ color: colors.mutedForeground, fontWeight: '700' }}>Alerjen hariç tut</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {data.allergens.map((allergen) => (
              <AppChip
                key={allergen.id}
                label={allergen.name}
                active={excludeAllergens.includes(allergen.code.toLowerCase())}
                onPress={() =>
                  setExcludeAllergens((current) =>
                    current.includes(allergen.code.toLowerCase())
                      ? current.filter((item) => item !== allergen.code.toLowerCase())
                      : [...current, allergen.code.toLowerCase()],
                  )
                }
              />
            ))}
          </View>

          <AppButton variant="secondary" onPress={() => filterSheetRef.current?.dismiss()}>
            Uygula
          </AppButton>
        </View>
      </BottomSheetModal>
    </>
  );
}
