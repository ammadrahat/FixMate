import { ServiceCategory } from '@/types';

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    icon: 'water',
    description: 'Pipes, leak fixes, water tanks, sanitary fittings & pump repairs',
    popularServices: [
      'Leak & Tap Repair',
      'Water Tank Cleaning & Motor',
      'Bathroom Sanitary Fitting',
      'Drain & Pipe Unclogging',
      'Geyser Connection'
    ],
    color: '#0284C7',
    bgLight: '#E0F2FE',
  },
  {
    id: 'electrical',
    name: 'Electrical Work',
    icon: 'flash',
    description: 'Wiring, circuit breakers, switches, fans, lights & UPS systems',
    popularServices: [
      'Fan & Light Installation',
      'Short Circuit Troubleshooting',
      'UPS & Inverter Wiring',
      'Circuit Breaker Replacement',
      'Main Distribution Board'
    ],
    color: '#EAB308',
    bgLight: '#FEF9C3',
  },
  {
    id: 'masonry',
    name: 'Masonry',
    icon: 'construct',
    description: 'Brickwork, plastering, floor tiles, marble polish & structural repairs',
    popularServices: [
      'Tile & Grout Repair',
      'Wall Plastering & Crack Fix',
      'Marble Grinding & Polish',
      'Concrete & Boundary Work',
      'Roof Seeping Treatment'
    ],
    color: '#D97706',
    bgLight: '#FEF3C7',
  },
  {
    id: 'carpentry',
    name: 'Carpentry',
    icon: 'hammer',
    description: 'Door locks, furniture repair, kitchen cabinets, wooden polish & shelves',
    popularServices: [
      'Door Lock & Hinges Fix',
      'Furniture Assembly & Repair',
      'Kitchen Cabinet Alignment',
      'Wood Polishing & Varnish',
      'Custom Wooden Shelves'
    ],
    color: '#92400E',
    bgLight: '#FDE68A',
  },
  {
    id: 'painting',
    name: 'Painting',
    icon: 'color-palette',
    description: 'Interior & exterior painting, weather-proofing, wall putty & polish',
    popularServices: [
      'Room Wall Emulsion Paint',
      'Waterproofing & Damp Control',
      'Door & Window Enamel Polish',
      'Texture & Accent Wall',
      'Exterior Weather-Sheet'
    ],
    color: '#8B5CF6',
    bgLight: '#EDE9FE',
  },
  {
    id: 'appliance',
    name: 'Appliance Repair',
    icon: 'cube',
    description: 'Air conditioners, refrigerators, washing machines & microwave repairs',
    popularServices: [
      'AC Gas Refill & Service',
      'Refrigerator Compressor Fix',
      'Washing Machine Motor & Drum',
      'Microwave Oven Repair',
      'Instant Water Heater Fix'
    ],
    color: '#10B981',
    bgLight: '#D1FAE5',
  },
];

export const PREDEFINED_TRADES = [
  'Plumbing',
  'Electrical Work',
  'Masonry',
  'Carpentry',
  'Painting',
  'Appliance Repair',
  'General Handyman'
];
