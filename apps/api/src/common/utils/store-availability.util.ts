const weekdayLabels: Record<string, string> = {
  monday: 'Pazartesi',
  tuesday: 'Sali',
  wednesday: 'Carsamba',
  thursday: 'Persembe',
  friday: 'Cuma',
  saturday: 'Cumartesi',
  sunday: 'Pazar',
};

type RawWorkingHour = {
  day?: unknown;
  enabled?: unknown;
  open?: unknown;
  close?: unknown;
};

export interface StoreOperatingStatus {
  isStoreActive: boolean;
  isPubliclyVisible: boolean;
  hasSchedule: boolean;
  isOpenNow: boolean;
  acceptingOrders: boolean;
  currentDay: string;
  currentDayLabel: string;
  openTime: string | null;
  closeTime: string | null;
  timezone: string;
  message: string;
}

function getSettingsObject(settings: unknown) {
  if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
    return settings as Record<string, unknown>;
  }

  return {};
}

function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
}

function parseWorkingHours(settings: unknown) {
  const settingsObject = getSettingsObject(settings);
  const workingHours = Array.isArray(settingsObject.workingHours) ? settingsObject.workingHours : [];

  return workingHours
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const current = entry as RawWorkingHour;
      const day = typeof current.day === 'string' ? current.day.toLowerCase() : null;

      if (!day || !weekdayLabels[day] || !isValidTime(current.open) || !isValidTime(current.close)) {
        return null;
      }

      return {
        day,
        enabled: typeof current.enabled === 'boolean' ? current.enabled : true,
        open: current.open,
        close: current.close,
      };
    })
    .filter((entry): entry is { day: string; enabled: boolean; open: string; close: string } => !!entry);
}

function getVisibility(settings: unknown) {
  const settingsObject = getSettingsObject(settings);
  const visibility = getSettingsObject(settingsObject.visibility);

  return typeof visibility.isPubliclyVisible === 'boolean' ? visibility.isPubliclyVisible : true;
}

function getCurrentDay(timezone: string, date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: timezone,
  })
    .format(date)
    .toLowerCase();
}

function getCurrentTime(timezone: string, date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(date);
}

function isTimeWithinRange(currentTime: string, openTime: string, closeTime: string) {
  if (openTime === closeTime) {
    return true;
  }

  if (openTime < closeTime) {
    return currentTime >= openTime && currentTime <= closeTime;
  }

  return currentTime >= openTime || currentTime <= closeTime;
}

export function getStoreOperatingStatus(input: {
  isActive: boolean;
  settings: unknown;
  timezone?: string | null;
  now?: Date;
}): StoreOperatingStatus {
  const timezone = input.timezone || 'Europe/Istanbul';
  const now = input.now ?? new Date();
  const isPubliclyVisible = getVisibility(input.settings);
  const currentDay = getCurrentDay(timezone, now);
  const currentDayLabel = weekdayLabels[currentDay] || currentDay;
  const workingHours = parseWorkingHours(input.settings);
  const hasSchedule = workingHours.length > 0;

  if (!input.isActive) {
    return {
      isStoreActive: false,
      isPubliclyVisible,
      hasSchedule,
      isOpenNow: false,
      acceptingOrders: false,
      currentDay,
      currentDayLabel,
      openTime: null,
      closeTime: null,
      timezone,
      message: 'Magaza gecici olarak hizmet vermiyor.',
    };
  }

  if (!isPubliclyVisible) {
    return {
      isStoreActive: true,
      isPubliclyVisible: false,
      hasSchedule,
      isOpenNow: false,
      acceptingOrders: false,
      currentDay,
      currentDayLabel,
      openTime: null,
      closeTime: null,
      timezone,
      message: 'Musteri menusu su anda yayinda degil.',
    };
  }

  if (!hasSchedule) {
    return {
      isStoreActive: true,
      isPubliclyVisible: true,
      hasSchedule: false,
      isOpenNow: true,
      acceptingOrders: true,
      currentDay,
      currentDayLabel,
      openTime: null,
      closeTime: null,
      timezone,
      message: 'Magaza su anda siparis kabul ediyor.',
    };
  }

  const todaySchedule = workingHours.find((entry) => entry.day === currentDay);

  if (!todaySchedule) {
    return {
      isStoreActive: true,
      isPubliclyVisible: true,
      hasSchedule: true,
      isOpenNow: true,
      acceptingOrders: true,
      currentDay,
      currentDayLabel,
      openTime: null,
      closeTime: null,
      timezone,
      message: 'Magaza su anda siparis kabul ediyor.',
    };
  }

  if (!todaySchedule.enabled) {
    return {
      isStoreActive: true,
      isPubliclyVisible: true,
      hasSchedule: true,
      isOpenNow: false,
      acceptingOrders: false,
      currentDay,
      currentDayLabel,
      openTime: todaySchedule.open,
      closeTime: todaySchedule.close,
      timezone,
      message: `${currentDayLabel} gunu kapaliyiz.`,
    };
  }

  const currentTime = getCurrentTime(timezone, now);
  const isOpenNow = isTimeWithinRange(currentTime, todaySchedule.open, todaySchedule.close);

  return {
    isStoreActive: true,
    isPubliclyVisible: true,
    hasSchedule: true,
    isOpenNow,
    acceptingOrders: isOpenNow,
    currentDay,
    currentDayLabel,
    openTime: todaySchedule.open,
    closeTime: todaySchedule.close,
    timezone,
    message: isOpenNow
      ? `Bugun ${todaySchedule.close} saatine kadar siparis verebilirsiniz.`
      : `Su anda kapaliyiz. Bugunku saatlerimiz ${todaySchedule.open} - ${todaySchedule.close}.`,
  };
}
