import { useMemo, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppButton, AppCard, AppInput, Screen } from '../../../../src/components/ui';
import { usePublicProduct } from '../../../../src/hooks/use-customer';
import { useCartStore } from '../../../../src/stores/cart-store';
import { formatCurrency } from '../../../../src/lib/format';
import { useAppTheme } from '../../../../src/theme/provider';

export default function ProductDetailScreen() {
  const params = useLocalSearchParams<{ qrToken: string; productId: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const addItem = useCartStore((state) => state.addItem);
  const language = useCartStore((state) => state.language);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);

  const qrToken = Array.isArray(params.qrToken) ? params.qrToken[0] : params.qrToken;
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const { data: product, isLoading, isError, error } = usePublicProduct(productId, language);

  const removedNames = useMemo(
    () =>
      product?.ingredients
        .filter((ingredient) => removedIngredients.includes(ingredient.id))
        .map((ingredient) => ingredient.name) ?? [],
    [product?.ingredients, removedIngredients],
  );

  if (isLoading) {
    return (
      <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <AppCard>
          <Text style={{ color: colors.foreground }}>Urun yukleniyor...</Text>
        </AppCard>
      </Screen>
    );
  }

  if (isError || !product) {
    return (
      <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <AppCard>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>
            Urun bulunamadi
          </Text>
          <Text style={{ color: colors.mutedForeground }}>
            {error instanceof Error ? error.message : 'Urun bilgisi alinamadi.'}
          </Text>
          <AppButton variant="secondary" onPress={() => router.back()}>
            Menuye Don
          </AppButton>
        </AppCard>
      </Screen>
    );
  }

  const operatingStatus = product.operatingStatus;

  return (
    <Screen>
      <AppButton variant="ghost" onPress={() => router.back()}>
        Menuye Don
      </AppButton>

      <AppCard style={{ padding: 0, overflow: 'hidden' }}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {(product.images.length > 0 ? product.images : [{ id: 'empty', url: '', order: 0 }]).map((image) =>
            image.url ? (
              <Image
                key={image.id}
                source={{ uri: image.url }}
                style={{ width: 320, height: 320, backgroundColor: colors.muted }}
              />
            ) : (
              <View
                key={image.id}
                style={{
                  width: 320,
                  height: 320,
                  backgroundColor: colors.secondary,
                }}
              />
            ),
          )}
        </ScrollView>
      </AppCard>

      <AppCard>
        <Text
          style={{
            color: colors.foreground,
            fontSize: 30,
            fontFamily: 'Fraunces_600SemiBold',
          }}
        >
          {product.name}
        </Text>
        <Text style={{ color: colors.primary, fontSize: 24, fontWeight: '800' }}>
          {formatCurrency(product.price)}
        </Text>
        {product.description ? (
          <Text style={{ color: colors.mutedForeground, lineHeight: 22 }}>{product.description}</Text>
        ) : null}
        {operatingStatus && !operatingStatus.acceptingOrders ? (
          <View
            style={{
              backgroundColor: colors.warmSurface,
              borderRadius: 16,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: colors.warm, fontWeight: '700' }}>{operatingStatus.message}</Text>
          </View>
        ) : null}
      </AppCard>

      {product.allergens.length > 0 ? (
        <AppCard>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '800' }}>Alerjenler</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {product.allergens.map((allergen) => (
              <View
                key={allergen.id}
                style={{
                  backgroundColor: colors.warmSurface,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ color: colors.warm, fontSize: 12, fontWeight: '700' }}>
                  {allergen.name}
                </Text>
              </View>
            ))}
          </View>
        </AppCard>
      ) : null}

      {product.ingredients.length > 0 ? (
        <AppCard>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '800' }}>Malzemeler</Text>
          <View style={{ gap: 10 }}>
            {product.ingredients.map((ingredient) => {
              const removed = removedIngredients.includes(ingredient.id);
              return (
                <View
                  key={ingredient.id}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Text
                    style={{
                      color: removed ? colors.mutedForeground : colors.foreground,
                      textDecorationLine: removed ? 'line-through' : 'none',
                    }}
                  >
                    {ingredient.name}
                  </Text>
                  {ingredient.isRemovable ? (
                    <AppButton
                      variant={removed ? 'secondary' : 'ghost'}
                      style={{ minHeight: 36, paddingHorizontal: 14 }}
                      onPress={() =>
                        setRemovedIngredients((current) =>
                          current.includes(ingredient.id)
                            ? current.filter((item) => item !== ingredient.id)
                            : [...current, ingredient.id],
                        )
                      }
                    >
                      {removed ? 'Geri Ekle' : 'Cikar'}
                    </AppButton>
                  ) : null}
                </View>
              );
            })}
          </View>
        </AppCard>
      ) : null}

      <AppCard>
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '800' }}>Not</Text>
        <AppInput
          multiline
          placeholder="Pisirim, servis veya ozel istek notu ekleyebilirsin."
          value={notes}
          onChangeText={setNotes}
          style={{
            minHeight: 120,
            textAlignVertical: 'top',
            paddingTop: 14,
          }}
        />
      </AppCard>

      <AppCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.foreground, fontWeight: '700' }}>Adet</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <AppButton variant="secondary" style={{ minHeight: 40, width: 48 }} onPress={() => setQuantity((current) => Math.max(1, current - 1))}>
              -
            </AppButton>
            <View style={{ minWidth: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>{quantity}</Text>
            </View>
            <AppButton variant="secondary" style={{ minHeight: 40, width: 48 }} onPress={() => setQuantity((current) => current + 1)}>
              +
            </AppButton>
          </View>
        </View>

        <AppButton
          disabled={operatingStatus ? !operatingStatus.acceptingOrders : false}
          onPress={() => {
            const fullNotes = [
              removedNames.length > 0 ? `Cikarilacak: ${removedNames.join(', ')}` : '',
              notes.trim(),
            ]
              .filter(Boolean)
              .join(' | ');

            for (let index = 0; index < quantity; index += 1) {
              addItem({
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.images[0]?.url,
                notes: fullNotes || undefined,
              });
            }

            router.push({
              pathname: '/m/[qrToken]/cart',
              params: { qrToken },
            });
          }}
        >
          Sepete Ekle
        </AppButton>
      </AppCard>
    </Screen>
  );
}
