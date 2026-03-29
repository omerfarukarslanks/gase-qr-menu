import { useMemo, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { AppButton, AppCard, AppChip, AppInput, EmptyState, Screen, SectionTitle } from '../../src/components/ui';
import { useAuthState } from '../../src/hooks/use-auth';
import { type RestaurantTable, useCloseTableSession, useOpenTableSession, useTables } from '../../src/hooks/use-staff';
import { formatShortTime } from '../../src/lib/format';
import { useAppTheme } from '../../src/theme/provider';

type TableFilter = 'ALL' | 'AVAILABLE' | 'OCCUPIED';

export default function StoreTablesScreen() {
  const { activeStoreId } = useAuthState();
  const { colors } = useAppTheme();
  const [filter, setFilter] = useState<TableFilter>('ALL');
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const { data = [], isLoading, isError } = useTables(activeStoreId ?? '');
  const openSession = useOpenTableSession();
  const closeSession = useCloseTableSession();

  const tables = useMemo(() => {
    if (filter === 'ALL') {
      return data;
    }

    return data.filter((table) => table.status === filter);
  }, [data, filter]);

  return (
    <>
      <Screen>
        <SectionTitle
          eyebrow="Masa board"
          title="Doluluk, session ve hizli kapama."
          description="Sahada tek bakista hangi masa ne durumda gorunsun diye optimize edildi."
        />

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['ALL', 'AVAILABLE', 'OCCUPIED'] as TableFilter[]).map((status) => (
            <AppChip
              key={status}
              label={status === 'ALL' ? 'Tumu' : status}
              active={filter === status}
              onPress={() => setFilter(status)}
            />
          ))}
        </View>

        {isLoading ? (
          <AppCard>
            <Text style={{ color: colors.foreground }}>Masalar yukleniyor...</Text>
          </AppCard>
        ) : isError ? (
          <EmptyState title="Masalar okunamadi" description="Store table listesi alinamadi." />
        ) : tables.length === 0 ? (
          <EmptyState title="Masa bulunmadi" description="Bu filtreye uyan masa yok." />
        ) : (
          tables.map((table) => (
            <AppCard key={table.id}>
              <View style={{ gap: 4 }}>
                <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>
                  {table.name}
                </Text>
                <Text style={{ color: colors.mutedForeground }}>
                  {table.section || 'Salon'} • {table.capacity} kisi • {table.status}
                </Text>
                {table.currentSession ? (
                  <Text style={{ color: colors.mutedForeground }}>
                    Acilis: {formatShortTime(table.currentSession.openedAt)} •{' '}
                    {table.currentSession.customerName || 'Misafir'}
                  </Text>
                ) : null}
              </View>

              {table.currentSession ? (
                <View style={{ gap: 8 }}>
                  <Text style={{ color: colors.foreground }}>
                    Aktif siparis: {table.currentSession.orderCount}
                  </Text>
                  <AppButton
                    variant="secondary"
                    loading={closeSession.isPending}
                    onPress={() =>
                      closeSession.mutate({
                        sessionId: table.currentSession?.id || '',
                      })
                    }
                  >
                    Oturumu Kapat
                  </AppButton>
                </View>
              ) : (
                <AppButton
                  variant="secondary"
                  onPress={() => {
                    setSelectedTable(table);
                    setCustomerName('');
                    setCustomerPhone('');
                  }}
                >
                  Oturum Ac
                </AppButton>
              )}
            </AppCard>
          ))
        )}
      </Screen>

      <Modal visible={Boolean(selectedTable)} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.42)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
              gap: 14,
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '800' }}>
              {selectedTable?.name} icin session ac
            </Text>
            <AppInput placeholder="Musteri adi" value={customerName} onChangeText={setCustomerName} />
            <AppInput
              placeholder="Telefon"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
            />
            <AppButton
              loading={openSession.isPending}
              onPress={() =>
                openSession.mutate(
                  {
                    tableId: selectedTable?.id || '',
                    customerName: customerName || undefined,
                    customerPhone: customerPhone || undefined,
                  },
                  {
                    onSuccess: () => {
                      setSelectedTable(null);
                    },
                  },
                )
              }
            >
              Session Baslat
            </AppButton>
            <AppButton variant="ghost" onPress={() => setSelectedTable(null)}>
              Vazgec
            </AppButton>
          </View>
        </View>
      </Modal>
    </>
  );
}
