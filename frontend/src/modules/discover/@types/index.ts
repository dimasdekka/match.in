export type SwipeDecision = 'pass' | 'like' | 'superlike';
export type SwipeAction = SwipeDecision;

export interface DiscoverProfile {
  id: number;
  name: string;
  age: number;
  city: string;
  distance: number;
  bio: string;
  image: string;
  verified: boolean;
  willMatch?: boolean;
  interests: Array<{ label: string; icon: string }>;
}

export interface SwipeResponse {
  is_match: boolean;
  match?: unknown;
  profile?: import('@/@types').Profile;
}
