'use client';

import { useEffect, useRef, useState } from 'react';
import type { IconType } from 'react-icons';
import {
  FiActivity,
  FiAlertTriangle,
  FiAnchor,
  FiArchive,
  FiAward,
  FiBarChart2,
  FiBell,
  FiBookmark,
  FiBox,
  FiBriefcase,
  FiCalendar,
  FiCamera,
  FiCheckSquare,
  FiClipboard,
  FiClock,
  FiCloud,
  FiCoffee,
  FiCompass,
  FiCpu,
  FiCreditCard,
  FiDatabase,
  FiDollarSign,
  FiDownload,
  FiFileText,
  FiFilter,
  FiFlag,
  FiFolder,
  FiGift,
  FiGlobe,
  FiGrid,
  FiHash,
  FiHeart,
  FiHome,
  FiImage,
  FiInbox,
  FiKey,
  FiLayers,
  FiLink,
  FiLock,
  FiMail,
  FiMap,
  FiMapPin,
  FiMonitor,
  FiMoon,
  FiMusic,
  FiNavigation,
  FiPackage,
  FiPercent,
  FiPhone,
  FiPieChart,
  FiPrinter,
  FiRepeat,
  FiSend,
  FiServer,
  FiSettings,
  FiShield,
  FiShoppingBag,
  FiShoppingCart,
  FiSliders,
  FiSmartphone,
  FiStar,
  FiSun,
  FiTablet,
  FiTag,
  FiTarget,
  FiThumbsUp,
  FiTool,
  FiTrendingDown,
  FiTrendingUp,
  FiTruck,
  FiUmbrella,
  FiUnlock,
  FiUpload,
  FiUser,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
  FiWatch,
  FiWifi,
  FiZap,
} from 'react-icons/fi';

// Keep keys in sync with backend/src/fields/icon-keys.ts.
export const ICONS: { key: string; label: string; Icon: IconType }[] = [
  { key: 'trending-up', label: 'Trending up', Icon: FiTrendingUp },
  { key: 'trending-down', label: 'Trending down', Icon: FiTrendingDown },
  { key: 'repeat', label: 'Exchange', Icon: FiRepeat },
  { key: 'dollar-sign', label: 'Dollar', Icon: FiDollarSign },
  { key: 'credit-card', label: 'Card', Icon: FiCreditCard },
  { key: 'briefcase', label: 'Briefcase', Icon: FiBriefcase },
  { key: 'clock', label: 'Clock', Icon: FiClock },
  { key: 'alert-triangle', label: 'Alert', Icon: FiAlertTriangle },
  { key: 'pie-chart', label: 'Pie chart', Icon: FiPieChart },
  { key: 'bar-chart', label: 'Bar chart', Icon: FiBarChart2 },
  { key: 'activity', label: 'Activity', Icon: FiActivity },
  { key: 'layers', label: 'Layers', Icon: FiLayers },
  { key: 'tag', label: 'Tag', Icon: FiTag },
  { key: 'shopping-bag', label: 'Shopping', Icon: FiShoppingBag },
  { key: 'percent', label: 'Percent', Icon: FiPercent },
  { key: 'database', label: 'Database', Icon: FiDatabase },
  { key: 'grid', label: 'Grid', Icon: FiGrid },
  { key: 'hash', label: 'Hash', Icon: FiHash },
  { key: 'sliders', label: 'Sliders', Icon: FiSliders },
  { key: 'home', label: 'Bank', Icon: FiHome },
  { key: 'users', label: 'Team', Icon: FiUsers },
  { key: 'user', label: 'Person', Icon: FiUser },
  { key: 'calendar', label: 'Calendar', Icon: FiCalendar },
  { key: 'map-pin', label: 'Location', Icon: FiMapPin },
  { key: 'truck', label: 'Delivery', Icon: FiTruck },
  { key: 'package', label: 'Package', Icon: FiPackage },
  { key: 'shopping-cart', label: 'Cart', Icon: FiShoppingCart },
  { key: 'gift', label: 'Gift', Icon: FiGift },
  { key: 'award', label: 'Award', Icon: FiAward },
  { key: 'target', label: 'Target', Icon: FiTarget },
  { key: 'flag', label: 'Flag', Icon: FiFlag },
  { key: 'bookmark', label: 'Bookmark', Icon: FiBookmark },
  { key: 'file-text', label: 'Document', Icon: FiFileText },
  { key: 'folder', label: 'Folder', Icon: FiFolder },
  { key: 'clipboard', label: 'Clipboard', Icon: FiClipboard },
  { key: 'check-square', label: 'Checklist', Icon: FiCheckSquare },
  { key: 'phone', label: 'Phone', Icon: FiPhone },
  { key: 'mail', label: 'Mail', Icon: FiMail },
  { key: 'globe', label: 'Global', Icon: FiGlobe },
  { key: 'server', label: 'Server', Icon: FiServer },
  { key: 'cpu', label: 'Processor', Icon: FiCpu },
  { key: 'settings', label: 'Settings', Icon: FiSettings },
  { key: 'zap', label: 'Energy', Icon: FiZap },
  { key: 'sun', label: 'Sun', Icon: FiSun },
  { key: 'heart', label: 'Health', Icon: FiHeart },
  { key: 'star', label: 'Rating', Icon: FiStar },
  { key: 'coffee', label: 'Break', Icon: FiCoffee },
  { key: 'tool', label: 'Maintenance', Icon: FiTool },
  { key: 'compass', label: 'Navigate', Icon: FiCompass },
  { key: 'box', label: 'Box', Icon: FiBox },
  { key: 'moon', label: 'Night', Icon: FiMoon },
  { key: 'cloud', label: 'Cloud', Icon: FiCloud },
  { key: 'umbrella', label: 'Umbrella', Icon: FiUmbrella },
  { key: 'anchor', label: 'Anchor', Icon: FiAnchor },
  { key: 'navigation', label: 'Navigation', Icon: FiNavigation },
  { key: 'map', label: 'Map', Icon: FiMap },
  { key: 'inbox', label: 'Inbox', Icon: FiInbox },
  { key: 'archive', label: 'Archive', Icon: FiArchive },
  { key: 'send', label: 'Send', Icon: FiSend },
  { key: 'printer', label: 'Printer', Icon: FiPrinter },
  { key: 'monitor', label: 'Monitor', Icon: FiMonitor },
  { key: 'smartphone', label: 'Mobile', Icon: FiSmartphone },
  { key: 'tablet', label: 'Tablet', Icon: FiTablet },
  { key: 'watch', label: 'Watch', Icon: FiWatch },
  { key: 'bell', label: 'Alert bell', Icon: FiBell },
  { key: 'lock', label: 'Lock', Icon: FiLock },
  { key: 'unlock', label: 'Unlock', Icon: FiUnlock },
  { key: 'key', label: 'Key', Icon: FiKey },
  { key: 'shield', label: 'Security', Icon: FiShield },
  { key: 'user-check', label: 'Verified', Icon: FiUserCheck },
  { key: 'user-plus', label: 'Add user', Icon: FiUserPlus },
  { key: 'thumbs-up', label: 'Like', Icon: FiThumbsUp },
  { key: 'camera', label: 'Camera', Icon: FiCamera },
  { key: 'image', label: 'Image', Icon: FiImage },
  { key: 'music', label: 'Music', Icon: FiMusic },
  { key: 'wifi', label: 'Wifi', Icon: FiWifi },
  { key: 'download', label: 'Download', Icon: FiDownload },
  { key: 'upload', label: 'Upload', Icon: FiUpload },
  { key: 'link', label: 'Link', Icon: FiLink },
  { key: 'filter', label: 'Filter', Icon: FiFilter },
];

const ICON_MAP = new Map(ICONS.map((entry) => [entry.key, entry.Icon]));

export function FieldIcon({ icon, size = 18, fallback: Fallback = FiTag }: { icon?: string; size?: number; fallback?: IconType }) {
  const Icon = (icon && ICON_MAP.get(icon)) || Fallback;
  return <Icon size={size} aria-hidden="true" />;
}

export default function IconPicker({
  value,
  onChange,
  size = 'md',
  disabled = false,
}: {
  value?: string;
  onChange: (icon: string) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dims = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 14 : 18;

  useEffect(() => {
    if (!open) return;
    function onClickAway(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-label="Choose icon"
        aria-expanded={open}
        aria-disabled={disabled}
        className={`flex ${dims} items-center justify-center rounded-xl bg-blue-100 text-blue-700 transition ${disabled ? 'cursor-default opacity-70' : 'hover:bg-blue-200'}`}
      >
        <FieldIcon icon={value} size={iconSize} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-blue-100 bg-white p-3 shadow-2xl">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-blue-900/45">Choose an icon</p>
          <div className="grid max-h-64 grid-cols-5 gap-1.5 overflow-y-auto pr-1">
            {ICONS.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  value === key ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
