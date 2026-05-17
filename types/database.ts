export type AreaUnit = "m2" | "dekar" | "hektar";
export type PlanStatus = "pending" | "completed" | "cancelled";

export type Profile = {
  id: string;
  full_name: string | null;
  weather_city: string | null;
  weather_city_code: string | null;
  weather_district: string | null;
  weather_district_code: string | null;
  weather_neighborhood: string | null;
  weather_neighborhood_code: string | null;
  weather_latitude: number | null;
  weather_longitude: number | null;
  weather_location_source: string | null;
  created_at: string;
};

export type Field = {
  id: string;
  user_id: string;
  name: string;
  city: string;
  city_code: string | null;
  district: string;
  district_code: string | null;
  neighborhood: string | null;
  neighborhood_code: string | null;
  latitude: number | null;
  longitude: number | null;
  location_source: string | null;
  block_no: string | null;
  parcel_no: string | null;
  area: number | null;
  area_unit: AreaUnit | null;
  current_crop: string | null;
  planting_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type FieldOperation = {
  id: string;
  user_id: string;
  field_id: string;
  operation_type: string;
  operation_date: string;
  material_name: string | null;
  amount: number | null;
  unit: string | null;
  cost: number | null;
  notes: string | null;
  created_at: string;
};

export type Plan = {
  id: string;
  user_id: string;
  field_id: string | null;
  title: string;
  plan_type: string | null;
  planned_crop: string | null;
  planned_date: string | null;
  status: PlanStatus;
  notes: string | null;
  created_at: string;
};

export type WeatherCache = {
  id: string;
  user_id: string;
  field_id: string;
  latitude: number | null;
  longitude: number | null;
  weather_json: unknown;
  fetched_at: string;
};
