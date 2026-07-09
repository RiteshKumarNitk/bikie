export interface SOSAlertDTO {
  id: string;
  userId: string;
  userName: string;
  userPhone: string | null;
  userEmail: string;
  type: string;
  description: string | null;
  latitude: number;
  longitude: number;
  city: string;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
}

export interface SOSAlertCreateInput {
  type: string;
  description?: string;
  latitude: number;
  longitude: number;
  city: string;
}