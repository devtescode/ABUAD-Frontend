import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Brush,
  Droplets,
  Hammer,
  Heart,
  Home,
  Laptop,
  Scissors,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";

export type CategoryStyle = {
  tint: string;
  iconColor: string;
  Icon: LucideIcon;
};

const CATEGORY_STYLES: Array<{ match: RegExp; style: CategoryStyle }> = [
  {
    match: /clean|laundry|housekeep/i,
    style: { tint: "#E8F5E9", iconColor: "#2E7D32", Icon: Sparkles },
  },
  {
    match: /electri|wiring|power|light/i,
    style: { tint: "#FFF3E0", iconColor: "#EF6C00", Icon: Zap },
  },
  {
    match: /beaut|makeup|hair|braid|salon|barb|spa|nail/i,
    style: { tint: "#EAF4F0", iconColor: "#459670", Icon: Scissors },
  },
  {
    match: /appliance|fridge|ac|air|cool|repair|microwave|washing/i,
    style: { tint: "#EAF4F0", iconColor: "#26714F", Icon: Wrench },
  },
  {
    match: /plumb|pipe|water|leak|toilet/i,
    style: { tint: "#E0F2F1", iconColor: "#00695C", Icon: Droplets },
  },
  {
    match: /tutor|lesson|teach|study|class|coach|academic/i,
    style: { tint: "#FFF9C4", iconColor: "#9A7B00", Icon: BookOpen },
  },
  {
    match: /paint|design|decor|art|photo|video|graphic/i,
    style: { tint: "#FCE4EC", iconColor: "#AD1457", Icon: Brush },
  },
  {
    match: /tech|computer|laptop|phone|software|it/i,
    style: { tint: "#EDF5F0", iconColor: "#0E2B25", Icon: Laptop },
  },
  {
    match: /home|carpent|furniture|install|handy/i,
    style: { tint: "#EFEBE9", iconColor: "#5D4037", Icon: Home },
  },
  {
    match: /health|care|wellness|fitness/i,
    style: { tint: "#FFEBEE", iconColor: "#C62828", Icon: Heart },
  },
];

const FALLBACK_STYLE: CategoryStyle = {
  tint: "#E9F5EF",
  iconColor: "#0E2B25",
  Icon: Hammer,
};

export function getCategoryStyle(category?: string | null): CategoryStyle {
  const value = (category || "").trim();
  if (!value) return FALLBACK_STYLE;
  const found = CATEGORY_STYLES.find((entry) => entry.match.test(value));
  return found?.style ?? FALLBACK_STYLE;
}

export function formatPrice(price: unknown): string {
  if (typeof price === "number" && Number.isFinite(price)) {
    return `₦${price.toLocaleString("en-NG")}`;
  }
  return "Price on request";
}

export function getInitials(name?: string | null): string {
  const value = (name || "").trim();
  if (!value) return "P";
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}
