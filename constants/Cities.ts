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

export const CITY_NAMES = PAKISTAN_CITIES.map((c) => c.name);
