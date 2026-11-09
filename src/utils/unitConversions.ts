export type UnitCategory =
  | 'length'
  | 'weight'
  | 'temperature'
  | 'area'
  | 'volume'
  | 'speed'
  | 'data';

export interface UnitDefinition {
  id: string;
  name: string;
  symbol: string;
  toBase: (val: number) => number;
  fromBase: (baseVal: number) => number;
}

export const UNIT_CATEGORIES: Record<
  UnitCategory,
  { name: string; units: Record<string, UnitDefinition> }
> = {
  length: {
    name: 'Length',
    units: {
      m: { id: 'm', name: 'Meter', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
      km: { id: 'km', name: 'Kilometer', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      cm: { id: 'cm', name: 'Centimeter', symbol: 'cm', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      mm: { id: 'mm', name: 'Millimeter', symbol: 'mm', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      mi: { id: 'mi', name: 'Mile', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      yd: { id: 'yd', name: 'Yard', symbol: 'yd', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      ft: { id: 'ft', name: 'Foot', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      in: { id: 'in', name: 'Inch', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    },
  },
  weight: {
    name: 'Weight / Mass',
    units: {
      kg: { id: 'kg', name: 'Kilogram', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
      g: { id: 'g', name: 'Gram', symbol: 'g', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      mg: { id: 'mg', name: 'Milligram', symbol: 'mg', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
      lb: { id: 'lb', name: 'Pound', symbol: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      oz: { id: 'oz', name: 'Ounce', symbol: 'oz', toBase: (v) => v * 0.028349523125, fromBase: (v) => v / 0.028349523125 },
      ton: { id: 'ton', name: 'Metric Ton', symbol: 't', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    },
  },
  temperature: {
    name: 'Temperature',
    units: {
      c: { id: 'c', name: 'Celsius', symbol: '°C', toBase: (v) => v, fromBase: (v) => v },
      f: { id: 'f', name: 'Fahrenheit', symbol: '°F', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      k: { id: 'k', name: 'Kelvin', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    },
  },
  area: {
    name: 'Area',
    units: {
      sqm: { id: 'sqm', name: 'Square Meter', symbol: 'm²', toBase: (v) => v, fromBase: (v) => v },
      sqkm: { id: 'sqkm', name: 'Square Kilometer', symbol: 'km²', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
      sqft: { id: 'sqft', name: 'Square Foot', symbol: 'ft²', toBase: (v) => v * 0.09290304, fromBase: (v) => v / 0.09290304 },
      sqyd: { id: 'sqyd', name: 'Square Yard', symbol: 'yd²', toBase: (v) => v * 0.83612736, fromBase: (v) => v / 0.83612736 },
      acre: { id: 'acre', name: 'Acre', symbol: 'ac', toBase: (v) => v * 4046.8564224, fromBase: (v) => v / 4046.8564224 },
      hectare: { id: 'hectare', name: 'Hectare', symbol: 'ha', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    },
  },
  volume: {
    name: 'Volume',
    units: {
      l: { id: 'l', name: 'Liter', symbol: 'L', toBase: (v) => v, fromBase: (v) => v },
      ml: { id: 'ml', name: 'Milliliter', symbol: 'mL', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      cum: { id: 'cum', name: 'Cubic Meter', symbol: 'm³', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      gal: { id: 'gal', name: 'US Gallon', symbol: 'gal', toBase: (v) => v * 3.785411784, fromBase: (v) => v / 3.785411784 },
      cup: { id: 'cup', name: 'US Cup', symbol: 'cup', toBase: (v) => v * 0.2365882365, fromBase: (v) => v / 0.2365882365 },
      floz: { id: 'floz', name: 'Fluid Ounce', symbol: 'fl oz', toBase: (v) => v * 0.0295735295625, fromBase: (v) => v / 0.0295735295625 },
    },
  },
  speed: {
    name: 'Speed',
    units: {
      kmh: { id: 'kmh', name: 'Kilometer per hour', symbol: 'km/h', toBase: (v) => v, fromBase: (v) => v },
      mph: { id: 'mph', name: 'Mile per hour', symbol: 'mph', toBase: (v) => v * 1.609344, fromBase: (v) => v / 1.609344 },
      ms: { id: 'ms', name: 'Meter per second', symbol: 'm/s', toBase: (v) => v * 3.6, fromBase: (v) => v / 3.6 },
      knot: { id: 'knot', name: 'Knot', symbol: 'kn', toBase: (v) => v * 1.852, fromBase: (v) => v / 1.852 },
    },
  },
  data: {
    name: 'Data Storage',
    units: {
      b: { id: 'b', name: 'Byte', symbol: 'B', toBase: (v) => v, fromBase: (v) => v },
      kb: { id: 'kb', name: 'Kilobyte', symbol: 'KB', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      mb: { id: 'mb', name: 'Megabyte', symbol: 'MB', toBase: (v) => v * 1024 * 1024, fromBase: (v) => v / (1024 * 1024) },
      gb: { id: 'gb', name: 'Gigabyte', symbol: 'GB', toBase: (v) => v * Math.pow(1024, 3), fromBase: (v) => v / Math.pow(1024, 3) },
      tb: { id: 'tb', name: 'Terabyte', symbol: 'TB', toBase: (v) => v * Math.pow(1024, 4), fromBase: (v) => v / Math.pow(1024, 4) },
      pb: { id: 'pb', name: 'Petabyte', symbol: 'PB', toBase: (v) => v * Math.pow(1024, 5), fromBase: (v) => v / Math.pow(1024, 5) },
    },
  },
};

export function convertUnit(
  category: UnitCategory,
  fromUnitId: string,
  toUnitId: string,
  value: number
): number {
  if (isNaN(value)) return 0;
  const cat = UNIT_CATEGORIES[category];
  if (!cat) return 0;

  const from = cat.units[fromUnitId];
  const to = cat.units[toUnitId];
  if (!from || !to) return value;

  const base = from.toBase(value);
  return to.fromBase(base);
}
