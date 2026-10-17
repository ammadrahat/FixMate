export interface CityOption {
  id: string;
  name: string;
  province: string;
  isPopular?: boolean;
}

export const PAKISTAN_CITIES: CityOption[] = [
  // Federal Capital
  { id: 'isb', name: 'Islamabad', province: 'Federal Capital', isPopular: true },
  
  // Punjab
  { id: 'lhr', name: 'Lahore', province: 'Punjab', isPopular: true },
  { id: 'rwp', name: 'Rawalpindi', province: 'Punjab', isPopular: true },
  { id: 'fsd', name: 'Faisalabad', province: 'Punjab', isPopular: true },
  { id: 'mul', name: 'Multan', province: 'Punjab', isPopular: true },
  { id: 'guj', name: 'Gujranwala', province: 'Punjab', isPopular: true },
  { id: 'skt', name: 'Sialkot', province: 'Punjab', isPopular: true },
  { id: 'bwp', name: 'Bahawalpur', province: 'Punjab' },
  { id: 'sgd', name: 'Sargodha', province: 'Punjab' },
  { id: 'gjt', name: 'Gujrat', province: 'Punjab' },
  { id: 'skp', name: 'Sheikhupura', province: 'Punjab' },
  { id: 'ryk', name: 'Rahim Yar Khan', province: 'Punjab' },
  { id: 'swl', name: 'Sahiwal', province: 'Punjab' },
  { id: 'wah', name: 'Wah Cantt', province: 'Punjab' },
  { id: 'ksr', name: 'Kasur', province: 'Punjab' },

  // Sindh
  { id: 'khi', name: 'Karachi', province: 'Sindh', isPopular: true },
  { id: 'hyd', name: 'Hyderabad', province: 'Sindh', isPopular: true },
  { id: 'skr', name: 'Sukkur', province: 'Sindh' },
  { id: 'lrk', name: 'Larkana', province: 'Sindh' },
  { id: 'mpk', name: 'Mirpur Khas', province: 'Sindh' },

  // Khyber Pakhtunkhwa
  { id: 'psh', name: 'Peshawar', province: 'Khyber Pakhtunkhwa', isPopular: true },
  { id: 'abt', name: 'Abbottabad', province: 'Khyber Pakhtunkhwa', isPopular: true },
  { id: 'mdn', name: 'Mardan', province: 'Khyber Pakhtunkhwa' },
  { id: 'swt', name: 'Swat', province: 'Khyber Pakhtunkhwa' },

  // Balochistan
  { id: 'qta', name: 'Quetta', province: 'Balochistan', isPopular: true },
  { id: 'gwd', name: 'Gwadar', province: 'Balochistan' },

  // Azad Kashmir & Gilgit
  { id: 'mzd', name: 'Muzaffarabad', province: 'Azad Kashmir' },
  { id: 'mpr', name: 'Mirpur (AJK)', province: 'Azad Kashmir' },
  { id: 'glt', name: 'Gilgit', province: 'Gilgit-Baltistan' },
];

export const NOT_IN_LIST_CITY: CityOption = {
  id: 'not_in_list',
  name: '➕ Not in the list? (Add custom city)',
  province: 'Custom City',
};

export const CITY_NAMES = PAKISTAN_CITIES.map((c) => c.name);

// Storage key for user-added custom cities
export const CUSTOM_CITIES_STORAGE_KEY = '@fixmate_custom_cities';

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getStoredCustomCities(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_CITIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCustomCityToStorage(cityName: string): Promise<string[]> {
  const clean = cityName.trim();
  if (!clean || clean.length < 2) return [];
  try {
    const current = await getStoredCustomCities();
    const exists = current.some((c) => c.toLowerCase() === clean.toLowerCase()) ||
                   PAKISTAN_CITIES.some((c) => c.name.toLowerCase() === clean.toLowerCase());
    if (!exists) {
      const updated = [clean, ...current];
      await AsyncStorage.setItem(CUSTOM_CITIES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch {
    return [];
  }
}

export function getCityDropdownOptions(customCities: string[] = []): CityOption[] {
  const customList: CityOption[] = customCities.map((cityName, idx) => ({
    id: `custom-${idx}-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
    name: cityName,
    province: 'Custom Added',
    isPopular: false,
  }));

  return [
    ...customList,
    ...PAKISTAN_CITIES,
    NOT_IN_LIST_CITY,
  ];
}
