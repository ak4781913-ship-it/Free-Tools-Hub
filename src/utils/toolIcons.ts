/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import {
  Activity,
  Binary,
  Briefcase,
  Calculator,
  Calendar,
  CaseSensitive,
  Clock,
  Coins,
  FileJson,
  FileText,
  Globe,
  Image,
  Landmark,
  Minimize2,
  Percent,
  Pipette,
  QrCode,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Type,
  Video,
  Wallet,
  Wrench,
} from 'lucide-react';

const TOOL_ICON_MAP: Record<string, React.ElementType> = {
  Activity,
  Binary,
  Briefcase,
  Calculator,
  Calendar,
  CaseSensitive,
  Clock,
  Coins,
  FileJson,
  FileText,
  Globe,
  Image,
  Landmark,
  Minimize2,
  Percent,
  Pipette,
  QrCode,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Type,
  Video,
  Wallet,
  Wrench,
};

/**
 * Resolves a tool or category icon component without wildcard-importing
 * all 1,500+ Lucide icons into the main entry bundle.
 */
export function resolveToolIcon(iconName?: string): React.ElementType {
  if (!iconName) return Wrench;
  return TOOL_ICON_MAP[iconName] || Wrench;
}
