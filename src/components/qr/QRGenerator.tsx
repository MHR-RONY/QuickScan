import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import QRCodeStyling, {
  type Options as QROptions,
  type DotType,
  type CornerSquareType,
  type CornerDotType,
  type ErrorCorrectionLevel,
  type FileExtension,
} from "qr-code-styling";
import { toPng, toJpeg, toSvg } from "html-to-image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Download, Upload, RefreshCw, Sparkles, X,
  ShoppingCart, ShoppingBag, Shirt, Store, Tag, Gift, Heart, Star, Sparkle,
  Coffee, Pizza, Utensils, Wine, IceCream, Cake,
  Music, Camera, Video, Headphones, Gamepad2, Film, Book,
  Instagram, Facebook, Twitter, Youtube, Linkedin, Github, Twitch, MessageCircle,
  Home, Building2, Car, Plane, Bike, MapPin, Globe, Wifi,
  Dumbbell, Bike as CycleIcon, Trophy, Palette, Scissors, Flower2, PawPrint, Leaf,
  Phone, Mail, Calendar, Zap, Rocket, Crown, Diamond, Anchor, Sun, Moon,
  ScanLine, Wallet, Bitcoin,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

type ContentType = "url" | "text" | "email" | "phone" | "sms" | "wifi" | "vcard";
type FrameId =
  | "none"
  | "scan-bottom"
  | "coffee-bag"
  | "shopping-bag"
  | "polaroid"
  | "gift-bow";

const NATIVE_DOTS: DotType[] = ["square","dots","rounded","classy","classy-rounded","extra-rounded"];
type DotId =
  | DotType
  | "star" | "heart" | "plus" | "diamond" | "bars-h" | "bars-v" | "cross-x"
  | "sparkle" | "mini-dot" | "mini-plus" | "mini-heart" | "triangle"
  | "hexagon" | "arrow" | "chevron" | "pixel" | "leaf"
  | "ring" | "squircle" | "droplet" | "shield" | "flower" | "pentagon"
  | "moon" | "bolt" | "burst" | "gear-dot" | "cloud" | "capsule-h" | "capsule-v"
  | "checker" | "circle-plus";
/** Custom per-module shapes in a 100x100 viewBox (one QR module). */
const DOT_CUSTOM: Record<Exclude<DotId, DotType>, string> = {
  star: "M50,6 L61,38 L95,38 L67,58 L78,92 L50,71 L22,92 L33,58 L5,38 L39,38 Z",
  heart: "M50,88 C10,62 8,32 26,20 C40,12 50,22 50,36 C50,22 60,12 74,20 C92,32 90,62 50,88 Z",
  plus: "M38,4 H62 V38 H96 V62 H62 V96 H38 V62 H4 V38 H38 Z",
  diamond: "M50,4 L96,50 L50,96 L4,50 Z",
  "bars-h": "M-2,30 H102 V70 H-2 Z",
  "bars-v": "M30,-2 H70 V102 H30 Z",
  "cross-x": "M12,4 L50,42 L88,4 L96,12 L58,50 L96,88 L88,96 L50,58 L12,96 L4,88 L42,50 L4,12 Z",
  // 4-point sparkle (concave star)
  sparkle: "M50,4 C54,36 64,46 96,50 C64,54 54,64 50,96 C46,64 36,54 4,50 C36,46 46,36 50,4 Z",
  // Tiny centered dot (~35% module)
  "mini-dot": "M50,50 m-18,0 a18,18 0 1 0 36,0 a18,18 0 1 0 -36,0",
  // Small plus / cross
  "mini-plus": "M44,20 H56 V44 H80 V56 H56 V80 H44 V56 H20 V44 H44 Z",
  // Small heart
  "mini-heart": "M50,82 C22,62 20,40 34,30 C44,24 50,32 50,42 C50,32 56,24 66,30 C80,40 78,62 50,82 Z",
  // Upward triangle
  triangle: "M50,6 L94,90 L6,90 Z",
  // Regular hexagon
  hexagon: "M50,4 L92,27 L92,73 L50,96 L8,73 L8,27 Z",
  // Right arrow
  arrow: "M4,36 H58 V16 L96,50 L58,84 V64 H4 Z",
  // Chevron / right caret
  chevron: "M20,10 L64,50 L20,90 L36,90 L80,50 L36,10 Z",
  // Small centered pixel square
  pixel: "M32,32 H68 V68 H32 Z",
  // Simple leaf
  leaf: "M10,90 C10,40 40,10 90,10 C90,60 60,90 10,90 Z",
  // Ring (donut) — outer circle with inner hole via even-odd
  ring: "M50,10 a40,40 0 1 0 0.001,0 Z M50,28 a22,22 0 1 1 -0.001,0 Z",
  // Squircle (rounded square)
  squircle: "M20,4 H80 A16,16 0 0 1 96,20 V80 A16,16 0 0 1 80,96 H20 A16,16 0 0 1 4,80 V20 A16,16 0 0 1 20,4 Z",
  // Droplet / teardrop
  droplet: "M50,4 C74,34 92,52 92,70 A42,42 0 1 1 8,70 C8,52 26,34 50,4 Z",
  // Shield
  shield: "M50,4 L92,20 V54 C92,78 74,92 50,98 C26,92 8,78 8,54 V20 Z",
  // 6-petal flower
  flower: "M50,6 C60,18 60,30 50,42 C60,30 74,28 86,34 C74,40 66,50 66,62 C66,50 76,40 90,42 C76,44 66,54 66,66 C66,54 60,66 50,78 C40,66 34,54 34,66 C34,54 24,44 10,42 C24,40 34,50 34,62 C34,50 26,40 14,34 C26,28 40,30 50,42 C40,30 40,18 50,6 Z",
  // Pentagon (pointing up)
  pentagon: "M50,6 L94,38 L77,92 L23,92 L6,38 Z",
  // Crescent moon
  moon: "M70,10 A44,44 0 1 0 70,90 A34,34 0 1 1 70,10 Z",
  // Lightning bolt
  bolt: "M56,4 L18,54 H44 L36,96 L82,42 H56 L64,4 Z",
  // 8-point starburst
  burst: "M50,4 L58,32 L82,14 L70,40 L96,44 L72,56 L88,80 L60,72 L54,96 L46,72 L18,86 L28,60 L4,52 L28,42 L14,18 L40,30 Z",
  // Gear-like dot
  "gear-dot": "M50,10 L58,18 L68,14 L70,26 L82,30 L80,42 L88,50 L80,58 L82,70 L70,74 L68,86 L58,82 L50,90 L42,82 L32,86 L30,74 L18,70 L20,58 L12,50 L20,42 L18,30 L30,26 L32,14 L42,18 Z",
  // Cloud
  cloud: "M28,72 A16,16 0 1 1 32,44 A20,20 0 0 1 70,44 A16,16 0 1 1 72,76 H28 Z",
  // Horizontal capsule (pill)
  "capsule-h": "M20,30 H80 A20,20 0 0 1 80,70 H20 A20,20 0 0 1 20,30 Z",
  // Vertical capsule (pill)
  "capsule-v": "M30,20 V80 A20,20 0 0 0 70,80 V20 A20,20 0 0 0 30,20 Z",
  // 2x2 checker (mini squares)
  checker: "M8,8 H44 V44 H8 Z M56,8 H92 V44 H56 Z M8,56 H44 V92 H8 Z M56,56 H92 V92 H56 Z",
  // Circle with plus cutout look (positive plus inside circle)
  "circle-plus": "M50,6 a44,44 0 1 0 0.001,0 Z M42,26 H58 V42 H74 V58 H58 V74 H42 V58 H26 V42 H42 Z",
};

const NATIVE_SQUARE: CornerSquareType[] = ["square","dot","extra-rounded","rounded","classy","classy-rounded","dots"];
const NATIVE_DOT: CornerDotType[] = ["square","dot","rounded","extra-rounded","classy","classy-rounded","dots"];

type BorderId =
  | CornerSquareType
  | "leaf-tr" | "leaf-tl" | "leaf-br" | "leaf-bl"
  | "leaf-diag" | "leaf-anti" | "octagon" | "notched";

type CenterId =
  | CornerDotType
  | "heart" | "star" | "diamond" | "cross" | "plus" | "clover" | "gear" | "blob";

/** Custom border-ring paths in a 100x100 viewBox. Even-odd fill with a 5x5-module hole. */
const BORDER_CUSTOM: Record<Exclude<BorderId, CornerSquareType>, string> = {
  // rounded rect with one corner squared
  "leaf-tr": "M18,0 H100 V82 A18,18 0 0 1 82,100 H18 A18,18 0 0 1 0,82 V18 A18,18 0 0 1 18,0 Z",
  "leaf-tl": "M0,0 H82 A18,18 0 0 1 100,18 V82 A18,18 0 0 1 82,100 H18 A18,18 0 0 1 0,82 Z",
  "leaf-br": "M18,0 H82 A18,18 0 0 1 100,18 V100 H18 A18,18 0 0 1 0,82 V18 A18,18 0 0 1 18,0 Z",
  "leaf-bl": "M18,0 H82 A18,18 0 0 1 100,18 V82 A18,18 0 0 1 82,100 H0 V18 A18,18 0 0 1 18,0 Z",
  // opposing sharp corners
  "leaf-diag": "M0,0 H82 A18,18 0 0 1 100,18 V100 H18 A18,18 0 0 1 0,82 Z",
  "leaf-anti": "M18,0 H100 V82 A18,18 0 0 1 82,100 H0 V18 A18,18 0 0 1 18,0 Z",
  // clipped corners (octagon)
  "octagon": "M22,0 H78 L100,22 V78 L78,100 H22 L0,78 V22 Z",
  // notched top-right
  "notched": "M18,0 H70 L100,30 V82 A18,18 0 0 1 82,100 H18 A18,18 0 0 1 0,82 V18 A18,18 0 0 1 18,0 Z",
};
const BORDER_HOLE = "M14.3,14.3 H85.7 V85.7 H14.3 Z";

/** Custom center dot paths in a 100x100 viewBox. */
const CENTER_CUSTOM: Record<Exclude<CenterId, CornerDotType>, string> = {
  heart: "M50,92 C10,64 6,32 26,20 C40,12 50,22 50,36 C50,22 60,12 74,20 C94,32 90,64 50,92 Z",
  star: "M50,4 L62,38 L98,38 L68,60 L79,94 L50,73 L21,94 L32,60 L2,38 L38,38 Z",
  diamond: "M50,4 L96,50 L50,96 L4,50 Z",
  cross: "M18,10 L50,42 L82,10 L90,18 L58,50 L90,82 L82,90 L50,58 L18,90 L10,82 L42,50 L10,18 Z",
  plus: "M36,6 H64 V36 H94 V64 H64 V94 H36 V64 H6 V36 H36 Z",
  clover: "M50,50 m-30,0 a20,20 0 1 1 40,0 a20,20 0 1 1 -40,0 M50,50 m0,-30 a20,20 0 1 1 0,40 a20,20 0 1 1 0,-40",
  gear: "M50,4 L58,14 L70,10 L72,22 L84,26 L82,38 L92,46 L84,54 L92,62 L82,72 L84,84 L72,80 L70,92 L58,88 L50,98 L42,88 L30,92 L28,80 L16,84 L18,72 L8,62 L16,54 L8,46 L18,38 L16,26 L28,22 L30,10 L42,14 Z",
  blob: "M20,30 Q10,55 25,80 Q55,100 80,80 Q100,55 80,25 Q55,0 30,15 Q15,20 20,30 Z",
};

type State = {
  contentType: ContentType;
  url: string;
  text: string;
  email: { to: string; subject: string; body: string };
  phone: string;
  sms: { number: string; message: string };
  wifi: { ssid: string; password: string; encryption: "WPA" | "WEP" | "nopass"; hidden: boolean };
  vcard: { name: string; org: string; phone: string; email: string; url: string };
  size: number;
  margin: number;
  dotType: DotId;
  dotColor: string;
  useGradient: boolean;
  gradientType: "linear" | "radial";
  gradientColor2: string;
  bgColor: string;
  bgTransparent: boolean;
  cornerSquareType: BorderId;
  cornerSquareColor: string;
  cornerDotType: CenterId;
  cornerDotColor: string;
  ecc: ErrorCorrectionLevel;
  logo: string | null;
  logoSize: number;
  logoMargin: number;
  hideDots: boolean;
  frame: FrameId;
  frameText: string;
  frameColor: string;
  frameTextColor: string;
};

const DEFAULT: State = {
  contentType: "url",
  url: "https://example.com",
  text: "",
  email: { to: "", subject: "", body: "" },
  phone: "",
  sms: { number: "", message: "" },
  wifi: { ssid: "", password: "", encryption: "WPA", hidden: false },
  vcard: { name: "", org: "", phone: "", email: "", url: "" },
  size: 320,
  margin: 8,
  dotType: "rounded",
  dotColor: "#f5f5ef",
  useGradient: false,
  gradientType: "linear",
  gradientColor2: "#7ee787",
  bgColor: "#1a1d24",
  bgTransparent: false,
  cornerSquareType: "extra-rounded",
  cornerSquareColor: "#c5f74b",
  cornerDotType: "dot",
  cornerDotColor: "#c5f74b",
  ecc: "Q",
  logo: null,
  logoSize: 0.35,
  logoMargin: 6,
  hideDots: true,
  frame: "none",
  frameText: "SCAN ME",
  frameColor: "#c5f74b",
  frameTextColor: "#0a0a0a",
};

function escapeWifi(s: string) {
  return s.replace(/([\\;,":])/g, "\\$1");
}

function buildData(s: State): string {
  switch (s.contentType) {
    case "url":
      return s.url || " ";
    case "text":
      return s.text || " ";
    case "email":
      return `mailto:${s.email.to}?subject=${encodeURIComponent(s.email.subject)}&body=${encodeURIComponent(s.email.body)}`;
    case "phone":
      return `tel:${s.phone}`;
    case "sms":
      return `SMSTO:${s.sms.number}:${s.sms.message}`;
    case "wifi":
      return `WIFI:T:${s.wifi.encryption};S:${escapeWifi(s.wifi.ssid)};P:${escapeWifi(s.wifi.password)};${s.wifi.hidden ? "H:true;" : ""};`;
    case "vcard":
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${s.vcard.name}`,
        s.vcard.org && `ORG:${s.vcard.org}`,
        s.vcard.phone && `TEL:${s.vcard.phone}`,
        s.vcard.email && `EMAIL:${s.vcard.email}`,
        s.vcard.url && `URL:${s.vcard.url}`,
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\n");
  }
}

function toOptions(s: State): Partial<QROptions> {
  return {
    width: s.size,
    height: s.size,
    type: "svg",
    data: buildData(s),
    margin: s.margin,
    qrOptions: { errorCorrectionLevel: s.logo ? "H" : s.ecc },
    image: s.logo ?? undefined,
    imageOptions: {
      hideBackgroundDots: s.hideDots,
      imageSize: s.logoSize,
      margin: s.logoMargin,
      crossOrigin: "anonymous",
    },
    dotsOptions: {
      // Custom dot shapes are drawn by the overlay — hide native dots.
      type: (NATIVE_DOTS as string[]).includes(s.dotType) ? (s.dotType as DotType) : "square",
      ...(!(NATIVE_DOTS as string[]).includes(s.dotType)
        ? { color: s.bgTransparent ? "transparent" : s.bgColor }
        : s.useGradient
        ? {
            gradient: {
              type: s.gradientType,
              rotation: 0,
              colorStops: [
                { offset: 0, color: s.dotColor },
                { offset: 1, color: s.gradientColor2 },
              ],
            },
          }
        : { color: s.dotColor }),
    },
    backgroundOptions: {
      color: s.bgTransparent ? "transparent" : s.bgColor,
    },
    cornersSquareOptions: {
      // Hide native corner square when a custom shape is picked — overlay renders it.
      type: (NATIVE_SQUARE as string[]).includes(s.cornerSquareType) ? (s.cornerSquareType as CornerSquareType) : "square",
      color: (NATIVE_SQUARE as string[]).includes(s.cornerSquareType) ? s.cornerSquareColor : (s.bgTransparent ? "transparent" : s.bgColor),
    },
    cornersDotOptions: {
      type: (NATIVE_DOT as string[]).includes(s.cornerDotType) ? (s.cornerDotType as CornerDotType) : "square",
      color: (NATIVE_DOT as string[]).includes(s.cornerDotType) ? s.cornerDotColor : (s.bgTransparent ? "transparent" : s.bgColor),
    },
  };
}

type Preset = { name: string; patch: Partial<State> };
const PRESETS: Preset[] = [
  { name: "Neon Lime", patch: { dotType: "rounded", dotColor: "#f5f5ef", useGradient: false, bgColor: "#1a1d24", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#c5f74b", cornerDotType: "dot", cornerDotColor: "#c5f74b" } },
  { name: "Minimal Ink", patch: { dotType: "square", dotColor: "#0a0a0a", useGradient: false, bgColor: "#ffffff", bgTransparent: false, cornerSquareType: "square", cornerSquareColor: "#0a0a0a", cornerDotType: "square", cornerDotColor: "#0a0a0a" } },
  { name: "Sunset", patch: { dotType: "classy-rounded", dotColor: "#ff6b35", useGradient: true, gradientType: "linear", gradientColor2: "#e83e8c", bgColor: "#fff7ed", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#e83e8c", cornerDotType: "dot", cornerDotColor: "#ff6b35" } },
  { name: "Ocean Dots", patch: { dotType: "dots", dotColor: "#0ea5e9", useGradient: true, gradientType: "radial", gradientColor2: "#22d3ee", bgColor: "#f0f9ff", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#0369a1", cornerDotType: "dot", cornerDotColor: "#0369a1" } },
  { name: "Forest", patch: { dotType: "rounded", dotColor: "#14532d", useGradient: true, gradientType: "linear", gradientColor2: "#65a30d", bgColor: "#f7fee7", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#14532d", cornerDotType: "dot", cornerDotColor: "#65a30d" } },
  { name: "Rose Gold", patch: { dotType: "classy-rounded", dotColor: "#b76e79", useGradient: true, gradientType: "linear", gradientColor2: "#f5c6c6", bgColor: "#fff1f2", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#b76e79", cornerDotType: "dot", cornerDotColor: "#b76e79" } },
  { name: "Midnight", patch: { dotType: "dots", dotColor: "#e0e7ff", useGradient: true, gradientType: "radial", gradientColor2: "#a5b4fc", bgColor: "#0f172a", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#a5b4fc", cornerDotType: "dot", cornerDotColor: "#e0e7ff" } },
  { name: "Grape Soda", patch: { dotType: "rounded", dotColor: "#7c3aed", useGradient: true, gradientType: "linear", gradientColor2: "#ec4899", bgColor: "#faf5ff", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#7c3aed", cornerDotType: "dot", cornerDotColor: "#ec4899" } },
  { name: "Cyberpunk", patch: { dotType: "classy", dotColor: "#f0abfc", useGradient: true, gradientType: "linear", gradientColor2: "#22d3ee", bgColor: "#09090b", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#22d3ee", cornerDotType: "dot", cornerDotColor: "#f0abfc" } },
  { name: "Coffee", patch: { dotType: "rounded", dotColor: "#3f2417", useGradient: true, gradientType: "linear", gradientColor2: "#a0522d", bgColor: "#faf3e7", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#3f2417", cornerDotType: "dot", cornerDotColor: "#a0522d" } },
  { name: "Mint Fresh", patch: { dotType: "dots", dotColor: "#059669", useGradient: false, bgColor: "#ecfdf5", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#065f46", cornerDotType: "dot", cornerDotColor: "#10b981" } },
  { name: "Fire", patch: { dotType: "classy-rounded", dotColor: "#dc2626", useGradient: true, gradientType: "radial", gradientColor2: "#fbbf24", bgColor: "#fffbeb", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#dc2626", cornerDotType: "dot", cornerDotColor: "#f59e0b" } },
  { name: "Blueprint", patch: { dotType: "square", dotColor: "#ffffff", useGradient: false, bgColor: "#1e3a8a", bgTransparent: false, cornerSquareType: "square", cornerSquareColor: "#ffffff", cornerDotType: "square", cornerDotColor: "#ffffff" } },
  { name: "Bubblegum", patch: { dotType: "dots", dotColor: "#db2777", useGradient: true, gradientType: "radial", gradientColor2: "#f472b6", bgColor: "#fdf2f8", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#db2777", cornerDotType: "dot", cornerDotColor: "#f472b6" } },
  { name: "Matrix", patch: { dotType: "square", dotColor: "#22c55e", useGradient: false, bgColor: "#000000", bgTransparent: false, cornerSquareType: "square", cornerSquareColor: "#22c55e", cornerDotType: "square", cornerDotColor: "#22c55e" } },
  { name: "Pastel Dream", patch: { dotType: "rounded", dotColor: "#a78bfa", useGradient: true, gradientType: "linear", gradientColor2: "#fca5a5", bgColor: "#fefce8", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#a78bfa", cornerDotType: "dot", cornerDotColor: "#fca5a5" } },
  { name: "Gold Lux", patch: { dotType: "classy-rounded", dotColor: "#d4af37", useGradient: true, gradientType: "linear", gradientColor2: "#facc15", bgColor: "#1c1917", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#facc15", cornerDotType: "dot", cornerDotColor: "#d4af37" } },
  { name: "Ice", patch: { dotType: "dots", dotColor: "#0369a1", useGradient: true, gradientType: "radial", gradientColor2: "#7dd3fc", bgColor: "#f0f9ff", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#0369a1", cornerDotType: "dot", cornerDotColor: "#7dd3fc" } },
  { name: "Retro Wave", patch: { dotType: "rounded", dotColor: "#ec4899", useGradient: true, gradientType: "linear", gradientColor2: "#8b5cf6", bgColor: "#0c0a1f", bgTransparent: false, cornerSquareType: "extra-rounded", cornerSquareColor: "#22d3ee", cornerDotType: "dot", cornerDotColor: "#ec4899" } },
];

const LOGO_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: "Cart", icon: ShoppingCart }, { name: "Bag", icon: ShoppingBag },
  { name: "Fashion", icon: Shirt }, { name: "Store", icon: Store },
  { name: "Tag", icon: Tag }, { name: "Gift", icon: Gift },
  { name: "Heart", icon: Heart }, { name: "Star", icon: Star },
  { name: "Sparkle", icon: Sparkle }, { name: "Crown", icon: Crown },
  { name: "Diamond", icon: Diamond }, { name: "Trophy", icon: Trophy },
  { name: "Coffee", icon: Coffee }, { name: "Pizza", icon: Pizza },
  { name: "Food", icon: Utensils }, { name: "Wine", icon: Wine },
  { name: "Ice cream", icon: IceCream }, { name: "Cake", icon: Cake },
  { name: "Music", icon: Music }, { name: "Camera", icon: Camera },
  { name: "Video", icon: Video }, { name: "Podcast", icon: Headphones },
  { name: "Gaming", icon: Gamepad2 }, { name: "Film", icon: Film },
  { name: "Book", icon: Book },
  { name: "Instagram", icon: Instagram }, { name: "Facebook", icon: Facebook },
  { name: "Twitter", icon: Twitter }, { name: "YouTube", icon: Youtube },
  { name: "LinkedIn", icon: Linkedin }, { name: "GitHub", icon: Github },
  { name: "Twitch", icon: Twitch }, { name: "Chat", icon: MessageCircle },
  { name: "Home", icon: Home }, { name: "Business", icon: Building2 },
  { name: "Car", icon: Car }, { name: "Travel", icon: Plane },
  { name: "Bike", icon: Bike }, { name: "Location", icon: MapPin },
  { name: "Web", icon: Globe }, { name: "WiFi", icon: Wifi },
  { name: "Fitness", icon: Dumbbell }, { name: "Cycling", icon: CycleIcon },
  { name: "Art", icon: Palette }, { name: "Salon", icon: Scissors },
  { name: "Floral", icon: Flower2 }, { name: "Pets", icon: PawPrint },
  { name: "Nature", icon: Leaf },
  { name: "Phone", icon: Phone }, { name: "Mail", icon: Mail },
  { name: "Calendar", icon: Calendar }, { name: "Energy", icon: Zap },
  { name: "Rocket", icon: Rocket }, { name: "Anchor", icon: Anchor },
];

const LOGO_BADGES: { name: string; icon: LucideIcon; color: string }[] = [
  { name: "Phone", icon: Phone, color: "#22c55e" },
  { name: "WhatsApp", icon: MessageCircle, color: "#25D366" },
  { name: "Link", icon: Globe, color: "#7c3aed" },
  { name: "Location", icon: MapPin, color: "#ef4444" },
  { name: "WiFi", icon: Wifi, color: "#0ea5e9" },
  { name: "Contact", icon: Mail, color: "#2563eb" },
  { name: "Email", icon: Mail, color: "#eab308" },
  { name: "Scan", icon: ScanLine, color: "#ec4899" },
  { name: "Camera", icon: Camera, color: "#10b981" },
  { name: "PayPal", icon: Wallet, color: "#0070ba" },
  { name: "Bitcoin", icon: Bitcoin, color: "#f7931a" },
  { name: "Cart", icon: ShoppingCart, color: "#f97316" },
  { name: "Bag", icon: ShoppingBag, color: "#6366f1" },
  { name: "Heart", icon: Heart, color: "#e11d48" },
  { name: "Star", icon: Star, color: "#f59e0b" },
  { name: "Gift", icon: Gift, color: "#db2777" },
  { name: "Music", icon: Music, color: "#8b5cf6" },
  { name: "Video", icon: Video, color: "#dc2626" },
  { name: "Gaming", icon: Gamepad2, color: "#7c3aed" },
  { name: "Food", icon: Utensils, color: "#ea580c" },
  { name: "Coffee", icon: Coffee, color: "#78350f" },
  { name: "Home", icon: Home, color: "#0891b2" },
  { name: "Calendar", icon: Calendar, color: "#0d9488" },
  { name: "Instagram", icon: Instagram, color: "#E1306C" },
  { name: "Facebook", icon: Facebook, color: "#1877F2" },
  { name: "YouTube", icon: Youtube, color: "#FF0000" },
  { name: "Twitter", icon: Twitter, color: "#1DA1F2" },
  { name: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
  { name: "GitHub", icon: Github, color: "#111827" },
  { name: "Twitch", icon: Twitch, color: "#9146FF" },
  { name: "Travel", icon: Plane, color: "#0284c7" },
  { name: "Car", icon: Car, color: "#334155" },
  { name: "Fitness", icon: Dumbbell, color: "#059669" },
  { name: "Fashion", icon: Shirt, color: "#c026d3" },
  { name: "Rocket", icon: Rocket, color: "#ef4444" },
  { name: "Energy", icon: Zap, color: "#facc15" },
];

function iconToDataUrl(Icon: LucideIcon, color = "#000000"): string {
  let markup = renderToStaticMarkup(
    <Icon color={color} size={128} strokeWidth={2.4} absoluteStrokeWidth />
  );
  // Ensure xmlns is present exactly once so the SVG loads as an <img>.
  if (!/\sxmlns=/.test(markup)) {
    markup = markup.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  return "data:image/svg+xml;utf8," + encodeURIComponent(markup);
}

function iconBadgeToDataUrl(Icon: LucideIcon, bg: string, fg = "#ffffff"): string {
  let inner = renderToStaticMarkup(
    <Icon color={fg} size={128} strokeWidth={2.4} absoluteStrokeWidth fill="none" />
  );
  // Strip the outer <svg> wrapper so we can nest the paths inside our badge SVG.
  inner = inner.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="256" height="256"><circle cx="12" cy="12" r="12" fill="${bg}"/><g transform="translate(4 4) scale(0.667)" stroke="${fg}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none">${inner}</g></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}


const FRAMES: { id: FrameId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "scan-bottom", label: "Scan bottom" },
  { id: "coffee-bag", label: "Coffee bag" },
  { id: "shopping-bag", label: "Shopping bag" },
  { id: "polaroid", label: "Polaroid" },
  { id: "gift-bow", label: "Gift bow" },
];

export default function QRGenerator() {
  const [s, setState] = useState<State>(DEFAULT);
  const previewNodeRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  const [moduleCount, setModuleCount] = useState<number>(25);

  const options = useMemo(() => toOptions(s), [s]);
  const hasCustomCorner =
    !(NATIVE_SQUARE as string[]).includes(s.cornerSquareType) ||
    !(NATIVE_DOT as string[]).includes(s.cornerDotType) ||
    !(NATIVE_DOTS as string[]).includes(s.dotType);

  // Rebuild QR when options change, and attach to current preview node.
  useEffect(() => {
    const qr = new QRCodeStyling(options as QROptions);
    qrRef.current = qr;
    if (previewNodeRef.current) {
      previewNodeRef.current.innerHTML = "";
      qr.append(previewNodeRef.current);
    }
    // Extract module count for the overlay to align to the QR grid.
    const tryRead = () => {
      const mc = (qr as unknown as { _qr?: { getModuleCount: () => number } })._qr?.getModuleCount?.();
      if (mc && mc !== moduleCount) setModuleCount(mc);
    };
    tryRead();
    const t = setTimeout(tryRead, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  // Callback ref: whenever React (re)mounts the preview slot — e.g. after a
  // frame change swaps the surrounding DOM — re-attach the imperative QR SVG.
  const setPreviewNode = useCallback((node: HTMLDivElement | null) => {
    previewNodeRef.current = node;
    if (node && qrRef.current) {
      node.innerHTML = "";
      qrRef.current.append(node);
    }
  }, []);

  const patch = (p: Partial<State>) => setState((prev) => ({ ...prev, ...p }));

  const onLogo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patch({ logo: reader.result as string });
    reader.readAsDataURL(file);
  };

  const download = async (ext: FileExtension) => {
    // Use library-native export only when there's no frame AND no custom corners.
    if (s.frame === "none" && !hasCustomCorner) {
      qrRef.current?.download({ name: "qrcode", extension: ext });
      return;
    }
    const node = frameRef.current;
    if (!node) return;
    const opts = { pixelRatio: 2, cacheBust: true, backgroundColor: s.bgTransparent ? undefined : "#ffffff" };
    let dataUrl: string;
    if (ext === "svg") dataUrl = await toSvg(node, opts);
    else if (ext === "jpeg") dataUrl = await toJpeg(node, opts);
    else dataUrl = await toPng(node, opts);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qrcode.${ext}`;
    a.click();
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 backdrop-blur-md sticky top-0 z-10 bg-background/70">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary grid place-items-center text-primary-foreground font-display font-bold">Q</div>
            <span className="font-display font-semibold text-lg">QRForge</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#generator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Generator</a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/50 px-3 py-1 text-xs text-muted-foreground mb-6">
            <Sparkles className="w-3 h-3 text-primary" />
            Design QR codes that don't look like QR codes
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-semibold leading-[1.05] mb-6">
            Stylish QR codes,<br />
            <span className="text-primary">crafted your way.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Pick a content type, choose a dot style, drop in a logo, tune the colors,
            wrap it in a frame, and export a pixel-perfect PNG or SVG in seconds.
          </p>
        </div>
      </section>

      <section id="generator" className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-[1fr_420px] gap-8">
          <div className="space-y-8 bg-card/40 border border-border/60 rounded-2xl p-6 md:p-8 min-w-0">
            <div>
              <h2 className="font-display text-xl mb-4">1. Content</h2>
              <ContentEditor state={s} patch={patch} />
            </div>

            <Separator />

            <div className="relative rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card/40 to-transparent p-4 sm:p-6 overflow-hidden">
              <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" aria-hidden />
              <div className="relative flex flex-col gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/15 text-primary border border-primary/30">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-xl leading-tight">2. Style</h2>
                    <p className="text-xs text-muted-foreground">Pick a preset or fine-tune every shape and color.</p>
                  </div>
                </div>
                <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
                  <div className="flex gap-2 px-1 min-w-min">
                    {PRESETS.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => patch(p.patch)}
                        className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border/70 bg-background/40 backdrop-blur hover:border-primary hover:text-primary hover:bg-primary/5 transition-all whitespace-nowrap"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative">
                <StyleEditor state={s} patch={patch} />
              </div>
            </div>


            <Separator />

            <div>
              <h2 className="font-display text-xl mb-4">3. Frame</h2>
              <FrameEditor state={s} patch={patch} />
            </div>

            <Separator />

            <div>
              <h2 className="font-display text-xl mb-4">4. Logo</h2>
              <LogoEditor state={s} patch={patch} onLogo={onLogo} />
            </div>

            <Separator />

            <div>
              <h2 className="font-display text-xl mb-4">5. Advanced</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <Label className="mb-2 block">Size: {s.size}px</Label>
                  <Slider value={[s.size]} min={200} max={800} step={20} onValueChange={([v]) => patch({ size: v })} />
                </div>
                <div>
                  <Label className="mb-2 block">Quiet zone: {s.margin}px</Label>
                  <Slider value={[s.margin]} min={0} max={40} step={2} onValueChange={([v]) => patch({ margin: v })} />
                </div>
                <div>
                  <Label className="mb-2 block">Error correction</Label>
                  <Select value={s.ecc} onValueChange={(v) => patch({ ecc: v as ErrorCorrectionLevel })} disabled={!!s.logo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Low (7%)</SelectItem>
                      <SelectItem value="M">Medium (15%)</SelectItem>
                      <SelectItem value="Q">Quartile (25%)</SelectItem>
                      <SelectItem value="H">High (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                  {s.logo && (<p className="text-xs text-muted-foreground mt-1">Auto-set to High while a logo is used.</p>)}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setState(DEFAULT)}>
                <RefreshCw className="w-4 h-4 mr-2" /> Reset all
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const dots = DOT_OPTIONS.map((o) => o.id);
                  const borders: BorderId[] = [
                    "square","dot","extra-rounded","rounded","classy","classy-rounded","dots",
                    "leaf-tr","leaf-tl","leaf-br","leaf-bl","leaf-diag","leaf-anti","octagon","notched",
                  ];
                  const centers: CenterId[] = [
                    "square","dot","rounded","extra-rounded","classy","classy-rounded","dots",
                    "heart","star","diamond","cross","plus","clover","gear","blob",
                  ];
                  const palettes: [string, string, string][] = [
                    ["#c5f74b", "#7ee787", "#1a1d24"],
                    ["#ff6b35", "#e83e8c", "#fff7ed"],
                    ["#0ea5e9", "#22d3ee", "#0f172a"],
                    ["#f0abfc", "#22d3ee", "#09090b"],
                    ["#facc15", "#d4af37", "#1c1917"],
                    ["#ec4899", "#8b5cf6", "#0c0a1f"],
                    ["#10b981", "#065f46", "#ecfdf5"],
                    ["#ffffff", "#a5b4fc", "#1e3a8a"],
                  ];
                  const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
                  const [c1, c2, bg] = pick(palettes);
                  patch({
                    dotType: pick(dots),
                    dotColor: c1,
                    useGradient: Math.random() < 0.5,
                    gradientType: Math.random() < 0.5 ? "linear" : "radial",
                    gradientColor2: c2,
                    bgColor: bg,
                    bgTransparent: false,
                    cornerSquareType: pick(borders),
                    cornerSquareColor: c2,
                    cornerDotType: pick(centers),
                    cornerDotColor: c1,
                  });
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" /> Randomize style
              </Button>
            </div>
          </div>


          <div className="lg:sticky lg:top-24 h-fit">
            <div className="grid-bg rounded-2xl border border-border/60 p-6 bg-card/40">
              <div className="rounded-xl overflow-hidden flex items-center justify-center min-h-[340px] bg-background/40 p-4">
                <Frame id={s.frame} text={s.frameText} color={s.frameColor} textColor={s.frameTextColor} innerRef={frameRef}>
                  <div className="relative inline-block">
                    <div ref={setPreviewNode} className="[&>svg]:max-w-full [&>svg]:h-auto [&>svg]:block" />
                    <DotOverlay state={s} qrRef={qrRef} moduleCount={moduleCount} />
                    <CornerOverlay state={s} moduleCount={moduleCount} />
                  </div>
                </Frame>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <Button onClick={() => download("png")} className="w-full"><Download className="w-4 h-4 mr-1" /> PNG</Button>
                <Button onClick={() => download("svg")} variant="secondary" className="w-full"><Download className="w-4 h-4 mr-1" /> SVG</Button>
                <Button onClick={() => download("jpeg")} variant="secondary" className="w-full"><Download className="w-4 h-4 mr-1" /> JPG</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">Always test-scan before printing at scale.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground space-y-1">
        <p>Built with QRForge · Client-side only, your data never leaves the browser.</p>
        <p>© {new Date().getFullYear()} MHR Roni · Devstation IT. All rights reserved.</p>
      </footer>

    </div>
  );
}

function ContentEditor({ state: s, patch }: { state: State; patch: (p: Partial<State>) => void }) {
  return (
    <Tabs value={s.contentType} onValueChange={(v) => patch({ contentType: v as ContentType })}>
      <TabsList className="grid grid-cols-4 md:grid-cols-7 h-auto">
        <TabsTrigger value="url">URL</TabsTrigger>
        <TabsTrigger value="text">Text</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="phone">Phone</TabsTrigger>
        <TabsTrigger value="sms">SMS</TabsTrigger>
        <TabsTrigger value="wifi">WiFi</TabsTrigger>
        <TabsTrigger value="vcard">vCard</TabsTrigger>
      </TabsList>
      <div className="mt-5">
        <TabsContent value="url"><Label className="mb-2 block">URL</Label><Input value={s.url} onChange={(e) => patch({ url: e.target.value })} placeholder="https://…" /></TabsContent>
        <TabsContent value="text"><Label className="mb-2 block">Text</Label><Textarea value={s.text} onChange={(e) => patch({ text: e.target.value })} rows={4} /></TabsContent>
        <TabsContent value="email" className="space-y-3">
          <div><Label className="mb-2 block">To</Label><Input value={s.email.to} onChange={(e) => patch({ email: { ...s.email, to: e.target.value } })} /></div>
          <div><Label className="mb-2 block">Subject</Label><Input value={s.email.subject} onChange={(e) => patch({ email: { ...s.email, subject: e.target.value } })} /></div>
          <div><Label className="mb-2 block">Body</Label><Textarea value={s.email.body} onChange={(e) => patch({ email: { ...s.email, body: e.target.value } })} rows={3} /></div>
        </TabsContent>
        <TabsContent value="phone"><Label className="mb-2 block">Phone</Label><Input value={s.phone} onChange={(e) => patch({ phone: e.target.value })} placeholder="+1 555 123 4567" /></TabsContent>
        <TabsContent value="sms" className="space-y-3">
          <div><Label className="mb-2 block">Number</Label><Input value={s.sms.number} onChange={(e) => patch({ sms: { ...s.sms, number: e.target.value } })} /></div>
          <div><Label className="mb-2 block">Message</Label><Textarea value={s.sms.message} onChange={(e) => patch({ sms: { ...s.sms, message: e.target.value } })} rows={3} /></div>
        </TabsContent>
        <TabsContent value="wifi" className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="mb-2 block">Network name (SSID)</Label><Input value={s.wifi.ssid} onChange={(e) => patch({ wifi: { ...s.wifi, ssid: e.target.value } })} /></div>
            <div><Label className="mb-2 block">Password</Label><Input value={s.wifi.password} onChange={(e) => patch({ wifi: { ...s.wifi, password: e.target.value } })} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 items-end">
            <div>
              <Label className="mb-2 block">Encryption</Label>
              <Select value={s.wifi.encryption} onValueChange={(v) => patch({ wifi: { ...s.wifi, encryption: v as "WPA" | "WEP" | "nopass" } })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA / WPA2</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">No password</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 pb-2">
              <Switch checked={s.wifi.hidden} onCheckedChange={(v) => patch({ wifi: { ...s.wifi, hidden: v } })} />
              <span className="text-sm">Hidden network</span>
            </label>
          </div>
        </TabsContent>
        <TabsContent value="vcard" className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="mb-2 block">Full name</Label><Input value={s.vcard.name} onChange={(e) => patch({ vcard: { ...s.vcard, name: e.target.value } })} /></div>
            <div><Label className="mb-2 block">Organization</Label><Input value={s.vcard.org} onChange={(e) => patch({ vcard: { ...s.vcard, org: e.target.value } })} /></div>
            <div><Label className="mb-2 block">Phone</Label><Input value={s.vcard.phone} onChange={(e) => patch({ vcard: { ...s.vcard, phone: e.target.value } })} /></div>
            <div><Label className="mb-2 block">Email</Label><Input value={s.vcard.email} onChange={(e) => patch({ vcard: { ...s.vcard, email: e.target.value } })} /></div>
            <div className="sm:col-span-2"><Label className="mb-2 block">Website</Label><Input value={s.vcard.url} onChange={(e) => patch({ vcard: { ...s.vcard, url: e.target.value } })} /></div>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="flex gap-2 items-center">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 rounded-md border border-border bg-transparent cursor-pointer" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
      </div>
    </div>
  );
}

function StyleEditor({ state: s, patch }: { state: State; patch: (p: Partial<State>) => void }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/60 bg-background/40 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Dots</span>
            <Label className="text-sm">Module shape</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={s.dotColor}
              onChange={(e) => patch({ dotColor: e.target.value })}
              className="h-8 w-9 rounded-md border border-border bg-transparent cursor-pointer"
              aria-label="Dot color"
            />
            <Input
              value={s.dotColor}
              onChange={(e) => patch({ dotColor: e.target.value })}
              className="font-mono text-xs h-8 w-24"
            />
          </div>
        </div>
        <DotPicker value={s.dotType} color={s.dotColor} onChange={(v) => patch({ dotType: v })} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 bg-background/40 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Corner</span>
            <Label className="text-sm">Border</Label>
          </div>
          <BorderPicker value={s.cornerSquareType} color={s.cornerSquareColor} onChange={(v) => patch({ cornerSquareType: v })} />
        </div>
        <div className="rounded-xl border border-border/60 bg-background/40 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Corner</span>
            <Label className="text-sm">Center</Label>
          </div>
          <CenterPicker value={s.cornerDotType} color={s.cornerDotColor} onChange={(v) => patch({ cornerDotType: v })} />
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-background/40 p-3 sm:p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Colors</span>
          <Label className="text-sm">Palette & background</Label>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-card/40 px-3 py-2">
          <div className="flex items-center gap-3">
            <Switch checked={s.useGradient} onCheckedChange={(v) => patch({ useGradient: v })} />
            <Label className="text-sm">Gradient dots</Label>
          </div>
          {s.useGradient && (
            <Select value={s.gradientType} onValueChange={(v) => patch({ gradientType: v as "linear" | "radial" })}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="radial">Radial</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ColorInput label={s.useGradient ? "Gradient color 1" : "Dot color"} value={s.dotColor} onChange={(v) => patch({ dotColor: v })} />
          {s.useGradient && (
            <ColorInput label="Gradient color 2" value={s.gradientColor2} onChange={(v) => patch({ gradientColor2: v })} />
          )}
          <ColorInput label="Corner square color" value={s.cornerSquareColor} onChange={(v) => patch({ cornerSquareColor: v })} />
          <ColorInput label="Corner dot color" value={s.cornerDotColor} onChange={(v) => patch({ cornerDotColor: v })} />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-1">
          <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/40 px-3 py-2">
            <Switch checked={s.bgTransparent} onCheckedChange={(v) => patch({ bgTransparent: v })} />
            <Label className="text-sm whitespace-nowrap">Transparent bg</Label>
          </div>
          {!s.bgTransparent && (
            <div className="flex-1 min-w-0">
              <ColorInput label="Background" value={s.bgColor} onChange={(v) => patch({ bgColor: v })} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LogoEditor({ state: s, patch, onLogo }: { state: State; patch: (p: Partial<State>) => void; onLogo: (e: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border hover:border-primary transition-colors px-4 py-3 text-sm">
          <Upload className="w-4 h-4" />
          {s.logo ? "Replace logo" : "Upload logo (PNG / JPG / SVG)"}
          <input type="file" accept="image/*" onChange={onLogo} className="hidden" />
        </label>
        {s.logo && (
          <>
            <img src={s.logo} alt="logo" className="w-12 h-12 rounded-md object-contain border border-border p-1" />
            <Button variant="ghost" size="sm" onClick={() => patch({ logo: null })}>
              <X className="w-4 h-4 mr-1" /> Remove
            </Button>
          </>
        )}
      </div>

      <div>
        <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Or pick an icon</Label>
        <div className="-mx-1 overflow-x-auto pb-2 [scrollbar-width:thin]">
          <div className="flex gap-2 px-1 min-w-min">
            {LOGO_ICONS.map(({ name, icon: Icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => patch({ logo: iconToDataUrl(Icon, "#000000") })}
                title={name}
                className="shrink-0 w-14 h-14 grid place-items-center rounded-lg border-2 border-border/60 bg-white text-black hover:border-primary transition-colors"
              >
                <Icon size={24} strokeWidth={2.2} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Colored badges</Label>
        <div className="-mx-1 overflow-x-auto pb-2 [scrollbar-width:thin]">
          <div className="flex gap-2 px-1 min-w-min">
            {LOGO_BADGES.map(({ name, icon: Icon, color }) => (
              <button
                key={name}
                type="button"
                onClick={() => patch({ logo: iconBadgeToDataUrl(Icon, color) })}
                title={name}
                className="shrink-0 w-14 h-14 grid place-items-center rounded-lg border-2 border-border/60 bg-card hover:border-primary transition-colors"
              >
                <span
                  className="w-10 h-10 rounded-full grid place-items-center"
                  style={{ backgroundColor: color }}
                >
                  <Icon size={22} strokeWidth={2.2} color="#ffffff" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {s.logo && (
        <div className="grid sm:grid-cols-3 gap-6 pt-2">
          <div>
            <Label className="mb-2 block">Logo size: {Math.round(s.logoSize * 100)}%</Label>
            <Slider value={[s.logoSize * 100]} min={10} max={50} step={1} onValueChange={([v]) => patch({ logoSize: v / 100 })} />
          </div>
          <div>
            <Label className="mb-2 block">Logo padding: {s.logoMargin}px</Label>
            <Slider value={[s.logoMargin]} min={0} max={30} step={1} onValueChange={([v]) => patch({ logoMargin: v })} />
          </div>
          <label className="flex items-center gap-3 pt-6">
            <Switch checked={s.hideDots} onCheckedChange={(v) => patch({ hideDots: v })} />
            <span className="text-sm">Hide dots behind logo</span>
          </label>
        </div>
      )}
    </div>
  );
}

/* -------- Style picker with horizontal scroll -------- */

function StylePicker<T extends string>({
  value, options, onChange, render,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  render: (type: T) => Partial<QROptions>;
}) {
  return (
    <div className="-mx-1 overflow-x-auto pb-2 [scrollbar-width:thin]">
      <div className="flex gap-3 px-1 min-w-min">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`shrink-0 w-[84px] flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all ${
              value === opt
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 bg-background/40 text-foreground/80 hover:border-border hover:bg-background/70"
            }`}
            title={opt}
          >
            <StyleThumb options={render(opt)} />
            <span className="text-[10px] leading-tight truncate w-full text-center">{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StyleThumb({ options }: { options: Partial<QROptions> }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const qr = new QRCodeStyling({
      width: 72,
      height: 72,
      type: "svg",
      data: "https://qrforge.app",
      margin: 2,
      qrOptions: { errorCorrectionLevel: "L" },
      backgroundOptions: { color: "transparent" },
      dotsOptions: { type: "square", color: "currentColor" },
      cornersSquareOptions: { type: "square", color: "currentColor" },
      cornersDotOptions: { type: "square", color: "currentColor" },
      ...options,
    } as QROptions);
    ref.current.innerHTML = "";
    qr.append(ref.current);
  }, [options]);
  return <div ref={ref} className="w-full aspect-square [&>svg]:w-full [&>svg]:h-full" />;
}

/* -------- Frames -------- */

function FrameEditor({ state: s, patch }: { state: State; patch: (p: Partial<State>) => void }) {
  return (
    <div className="space-y-5">
      <div className="-mx-1 overflow-x-auto pb-2 [scrollbar-width:thin]">
        <div className="flex gap-3 px-1 min-w-min">
          {FRAMES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => patch({ frame: f.id })}
              className={`shrink-0 w-[104px] flex flex-col items-center gap-2 rounded-lg border-2 p-2 transition-all ${
                s.frame === f.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 bg-background/40 hover:border-border"
              }`}
              title={f.label}
            >
              <div className="w-full aspect-square grid place-items-center p-1">
                <FrameThumb id={f.id} color={s.frameColor} textColor={s.frameTextColor} />
              </div>
              <span className="text-[10px] leading-tight truncate w-full text-center">{f.label}</span>
            </button>
          ))}
        </div>
      </div>
      {s.frame !== "none" && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <Label className="mb-2 block">Frame text</Label>
            <Input value={s.frameText} onChange={(e) => patch({ frameText: e.target.value })} />
          </div>
          <ColorInput label="Frame color" value={s.frameColor} onChange={(v) => patch({ frameColor: v })} />
          <ColorInput label="Frame text color" value={s.frameTextColor} onChange={(v) => patch({ frameTextColor: v })} />
        </div>
      )}
    </div>
  );
}

function FrameThumb({ id, color, textColor }: { id: FrameId; color: string; textColor: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Frame id={id} text="Scan me!" color={color} textColor={textColor} compact>
        <div className="w-9 h-9 bg-foreground/80 rounded-[2px]" />
      </Frame>
    </div>
  );
}

function Frame({
  id, text, color, textColor, children, innerRef, compact = false,
}: {
  id: FrameId;
  text: string;
  color: string;
  textColor: string;
  children: ReactNode;
  innerRef?: React.RefObject<HTMLDivElement | null>;
  compact?: boolean;
}) {
  // Scale factor: full-size frames use 1, thumbnails use ~0.18
  const k = compact ? 0.18 : 1;
  const S = (n: number) => Math.max(1, Math.round(n * k));
  const wrap = (content: ReactNode, style: React.CSSProperties = {}) => (
    <div ref={innerRef} className="inline-block relative" style={{ background: "transparent", ...style }}>
      {content}
    </div>
  );
  const labelText = (opts: { bg: string; color: string; fontSize: number; padY?: number; padX?: number; radius?: number; italic?: boolean; family?: string }) => (
    <div
      className="w-full text-center font-display font-bold"
      style={{
        background: opts.bg,
        color: opts.color,
        fontSize: opts.fontSize,
        padding: `${opts.padY ?? S(8)}px ${opts.padX ?? S(10)}px`,
        borderRadius: opts.radius ?? 0,
        fontStyle: opts.italic ? "italic" : "normal",
        fontFamily: opts.family,
        letterSpacing: "0.02em",
        lineHeight: 1.1,
      }}
    >
      {text}
    </div>
  );

  switch (id) {
    case "none":
      return <div ref={innerRef}>{children}</div>;

    case "scan-bottom":
      return wrap(
        <div className="overflow-hidden" style={{ border: `${S(3)}px solid ${color}`, background: "#fff", borderRadius: S(6) }}>
          <div style={{ padding: S(10) }}>{children}</div>
          {labelText({ bg: color, color: textColor, fontSize: S(16) })}
        </div>
      );

    /* ---------- Coffee bag with cup ---------- */
    case "coffee-bag": {
      const qrSize = S(compact ? 60 : 150);
      const qrBox = (
        <div
          className="[&_svg]:!w-full [&_svg]:!h-full [&_svg]:block"
          style={{ width: qrSize, height: qrSize }}
        >
          {children}
        </div>
      );
      return wrap(
        <div className="inline-flex items-end" style={{ gap: S(4) }}>
          {/* Coffee cup */}
          <svg viewBox="0 0 70 120" width={S(60)} height={S(103)} style={{ display: "block", marginBottom: S(6) }}>
            <path d="M12,30 L58,30 L52,112 Q52,118 46,118 L24,118 Q18,118 18,112 Z" fill="#0a0a0a" />
            <rect x="10" y="22" width="50" height="10" rx="2" fill="#0a0a0a" />
            <path d="M22,22 Q22,10 35,10 Q48,10 48,22" fill="none" stroke="#0a0a0a" strokeWidth="3" />
            <path d="M8,60 Q0,72 6,84 Q12,92 8,100" fill="none" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" />
          </svg>
          {/* Bag */}
          <div className="relative inline-flex flex-col items-center" style={{ background: "#0a0a0a", padding: `${S(18)}px ${S(14)}px ${S(14)}px`, borderRadius: `${S(4)}px ${S(4)}px ${S(6)}px ${S(6)}px` }}>
            {/* Top fold */}
            <div style={{ position: "absolute", top: -S(6), left: S(6), right: S(6), height: S(10), background: "#0a0a0a", borderRadius: S(2) }} />
            <div style={{ background: "#fff", padding: S(8) }}>{qrBox}</div>
            <div className="font-display font-bold text-center" style={{ background: "#fff", color: textColor === "#FFFFFF" || textColor === "#ffffff" ? "#0a0a0a" : textColor, fontSize: S(14), width: qrSize + S(16), padding: `${S(4)}px 0 ${S(6)}px` }}>
              {text}
            </div>
          </div>
        </div>
      );
    }

    /* ---------- Shopping bag ---------- */
    case "shopping-bag": {
      const qrSize = S(compact ? 65 : 160);
      const qrBox = (
        <div
          className="[&_svg]:!w-full [&_svg]:!h-full [&_svg]:block"
          style={{ width: qrSize, height: qrSize }}
        >
          {children}
        </div>
      );
      return wrap(
        <div className="relative inline-flex flex-col items-center" style={{ paddingTop: S(28) }}>
          {/* Handles */}
          <svg viewBox="0 0 200 60" width={qrSize + S(60)} height={S(40)} style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)" }}>
            <path d="M50,58 Q50,10 90,10 Q100,10 100,20" fill="none" stroke="#0a0a0a" strokeWidth="8" strokeLinecap="round" />
            <path d="M150,58 Q150,10 110,10 Q100,10 100,20" fill="none" stroke="#0a0a0a" strokeWidth="8" strokeLinecap="round" />
          </svg>
          {/* Bag body */}
          <div style={{ background: "#0a0a0a", padding: `${S(20)}px ${S(18)}px ${S(4)}px`, borderRadius: `${S(6)}px ${S(6)}px ${S(2)}px ${S(2)}px` }}>
            <div style={{ background: "#fff", padding: S(10) }}>{qrBox}</div>
            <div className="font-display font-bold text-center" style={{ color: "#fff", fontSize: S(15), padding: `${S(10)}px 0 ${S(8)}px` }}>
              {text}
            </div>
          </div>
        </div>
      );
    }

    /* ---------- Polaroid with script text ---------- */
    case "polaroid": {
      const qrSize = S(compact ? 70 : 170);
      const qrBox = (
        <div
          className="[&_svg]:!w-full [&_svg]:!h-full [&_svg]:block"
          style={{ width: qrSize, height: qrSize }}
        >
          {children}
        </div>
      );
      return wrap(
        <div style={{ background: "#fff", border: `${S(2)}px solid #e5e5e5`, padding: `${S(16)}px ${S(16)}px ${S(8)}px`, boxShadow: `0 ${S(4)}px ${S(14)}px rgba(0,0,0,0.12)` }}>
          {qrBox}
          <div
            className="text-center"
            style={{
              color: textColor,
              fontSize: S(22),
              padding: `${S(8)}px 0 ${S(4)}px`,
              fontFamily: '"Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive',
              fontStyle: "italic",
              fontWeight: 600,
            }}
          >
            {text}
          </div>
        </div>
      );
    }

    /* ---------- Gift box with bow ---------- */
    case "gift-bow": {
      const qrSize = S(compact ? 65 : 155);
      const qrBox = (
        <div
          className="[&_svg]:!w-full [&_svg]:!h-full [&_svg]:block"
          style={{ width: qrSize, height: qrSize }}
        >
          {children}
        </div>
      );
      return wrap(
        <div className="relative inline-flex flex-col items-center" style={{ paddingTop: S(38) }}>
          {/* Bow */}
          <svg viewBox="0 0 200 90" width={qrSize + S(50)} height={S(60)} style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)" }}>
            {/* Ribbon tails */}
            <path d="M85,70 L60,88 L95,80 Z" fill="#4a4a4a" stroke="#0a0a0a" strokeWidth="2" />
            <path d="M115,70 L140,88 L105,80 Z" fill="#4a4a4a" stroke="#0a0a0a" strokeWidth="2" />
            {/* Left loop */}
            <path d="M100,55 Q50,20 30,45 Q20,65 50,72 Q80,72 100,55 Z" fill="#4a4a4a" stroke="#0a0a0a" strokeWidth="3" />
            {/* Right loop */}
            <path d="M100,55 Q150,20 170,45 Q180,65 150,72 Q120,72 100,55 Z" fill="#4a4a4a" stroke="#0a0a0a" strokeWidth="3" />
            {/* Knot */}
            <rect x="90" y="48" width="20" height="22" rx="3" fill="#0a0a0a" />
          </svg>
          {/* Box */}
          <div style={{ background: "#0a0a0a", padding: `${S(14)}px ${S(14)}px ${S(10)}px`, borderRadius: S(4) }}>
            <div style={{ background: "#fff", padding: S(10) }}>{qrBox}</div>
            <div className="font-display font-bold text-center" style={{ color: "#fff", fontSize: S(15), padding: `${S(8)}px 0 ${S(2)}px` }}>
              {text}
            </div>
          </div>
        </div>
      );
    }
  }
}

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved
      ? saved === "dark"
      : document.documentElement.classList.contains("dark");
    setDark(isDark);
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark, mounted]);
  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border/60 bg-card/60 hover:bg-accent transition-colors"
      aria-label="Toggle theme"
      suppressHydrationWarning
    >
      <span suppressHydrationWarning>
        {mounted ? (dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : <Moon className="w-4 h-4" />}
      </span>
    </button>
  );
}

/* -------- Corner shape picker & overlay -------- */

const BORDER_OPTIONS: { id: BorderId; label: string }[] = [
  ...NATIVE_SQUARE.map((t) => ({ id: t as BorderId, label: t })),
  { id: "leaf-tl", label: "leaf TL" },
  { id: "leaf-tr", label: "leaf TR" },
  { id: "leaf-bl", label: "leaf BL" },
  { id: "leaf-br", label: "leaf BR" },
  { id: "leaf-diag", label: "leaf diag" },
  { id: "leaf-anti", label: "leaf anti" },
  { id: "octagon", label: "octagon" },
  { id: "notched", label: "notched" },
];

const CENTER_OPTIONS: { id: CenterId; label: string }[] = [
  ...NATIVE_DOT.map((t) => ({ id: t as CenterId, label: t })),
  { id: "heart", label: "heart" },
  { id: "star", label: "star" },
  { id: "diamond", label: "diamond" },
  { id: "cross", label: "cross" },
  { id: "plus", label: "plus" },
  { id: "clover", label: "clover" },
  { id: "gear", label: "gear" },
  { id: "blob", label: "blob" },
];

function BorderThumb({ id, color }: { id: BorderId; color: string }) {
  if ((NATIVE_SQUARE as string[]).includes(id)) {
    return (
      <StyleThumb
        options={{
          dotsOptions: { type: "square", color: "oklch(0.5 0.01 240)" },
          cornersSquareOptions: { type: id as CornerSquareType, color: "currentColor" },
        }}
      />
    );
  }
  const path = BORDER_CUSTOM[id as Exclude<BorderId, CornerSquareType>];
  return (
    <div className="w-full aspect-square grid place-items-center" style={{ color }}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor" fillRule="evenodd">
        <path d={`${path} ${BORDER_HOLE}`} />
      </svg>
    </div>
  );
}

function CenterThumb({ id, color }: { id: CenterId; color: string }) {
  if ((NATIVE_DOT as string[]).includes(id)) {
    return (
      <StyleThumb
        options={{
          dotsOptions: { type: "square", color: "oklch(0.5 0.01 240)" },
          cornersDotOptions: { type: id as CornerDotType, color: "currentColor" },
        }}
      />
    );
  }
  const path = CENTER_CUSTOM[id as Exclude<CenterId, CornerDotType>];
  return (
    <div className="w-full aspect-square grid place-items-center" style={{ color }}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor" fillRule="evenodd">
        <path d={path} />
      </svg>
    </div>
  );
}

function BorderPicker({ value, color, onChange }: { value: BorderId; color: string; onChange: (v: BorderId) => void }) {
  return (
    <div className="-mx-1 overflow-x-auto pb-2 [scrollbar-width:thin]">
      <div className="flex gap-3 px-1 min-w-min">
        {BORDER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`shrink-0 w-[74px] flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all ${
              value === opt.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 bg-background/40 text-foreground/80 hover:border-border hover:bg-background/70"
            }`}
            title={opt.label}
          >
            <BorderThumb id={opt.id} color={value === opt.id ? "currentColor" : color} />
            <span className="text-[10px] leading-tight truncate w-full text-center">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CenterPicker({ value, color, onChange }: { value: CenterId; color: string; onChange: (v: CenterId) => void }) {
  return (
    <div className="-mx-1 overflow-x-auto pb-2 [scrollbar-width:thin]">
      <div className="flex gap-3 px-1 min-w-min">
        {CENTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`shrink-0 w-[74px] flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all ${
              value === opt.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 bg-background/40 text-foreground/80 hover:border-border hover:bg-background/70"
            }`}
            title={opt.label}
          >
            <CenterThumb id={opt.id} color={value === opt.id ? "currentColor" : color} />
            <span className="text-[10px] leading-tight truncate w-full text-center">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Overlays custom corner-square (border) and corner-dot (center) shapes on top
 * of the underlying QR canvas at each of the three finder-pattern positions.
 * Aligns to the QR grid using moduleCount and the QR's actual pixel size.
 */
function CornerOverlay({ state: s, moduleCount }: { state: State; moduleCount: number }) {
  const borderIsCustom = !(NATIVE_SQUARE as string[]).includes(s.cornerSquareType);
  const centerIsCustom = !(NATIVE_DOT as string[]).includes(s.cornerDotType);
  if (!borderIsCustom && !centerIsCustom) return null;

  const W = s.size;
  const margin = s.margin;
  const inner = W - 2 * margin;
  const cell = inner / moduleCount;
  const marker = 7 * cell;
  const dot = 3 * cell;

  const positions: Array<{ x: number; y: number }> = [
    { x: margin, y: margin },
    { x: margin + (moduleCount - 7) * cell, y: margin },
    { x: margin, y: margin + (moduleCount - 7) * cell },
  ];

  const borderPath = borderIsCustom
    ? BORDER_CUSTOM[s.cornerSquareType as Exclude<BorderId, CornerSquareType>]
    : null;
  const centerPath = centerIsCustom
    ? CENTER_CUSTOM[s.cornerDotType as Exclude<CenterId, CornerDotType>]
    : null;

  return (
    <svg
      viewBox={`0 0 ${W} ${W}`}
      width={W}
      height={W}
      className="absolute inset-0 pointer-events-none [&]:max-w-full [&]:h-auto"
      style={{ display: "block" }}
      aria-hidden
    >
      {positions.map((p, i) => (
        <g key={i}>
          {borderPath && (
            <g transform={`translate(${p.x} ${p.y}) scale(${marker / 100})`} fill={s.cornerSquareColor} fillRule="evenodd">
              <path d={`${borderPath} ${BORDER_HOLE}`} />
            </g>
          )}
          {centerPath && (
            <g transform={`translate(${p.x + 2 * cell} ${p.y + 2 * cell}) scale(${dot / 100})`} fill={s.cornerDotColor} fillRule="evenodd">
              <path d={centerPath} />
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

/* -------- Dot shape picker & overlay -------- */

const DOT_OPTIONS: { id: DotId; label: string }[] = [
  ...NATIVE_DOTS.map((t) => ({ id: t as DotId, label: t })),
  { id: "mini-dot", label: "tiny dots" },
  { id: "pixel", label: "pixel" },
  { id: "star", label: "star" },
  { id: "sparkle", label: "sparkle" },
  { id: "heart", label: "heart" },
  { id: "mini-heart", label: "mini heart" },
  { id: "plus", label: "plus" },
  { id: "mini-plus", label: "mini plus" },
  { id: "cross-x", label: "cross X" },
  { id: "diamond", label: "diamond" },
  { id: "triangle", label: "triangle" },
  { id: "hexagon", label: "hexagon" },
  { id: "arrow", label: "arrow" },
  { id: "chevron", label: "chevron" },
  { id: "leaf", label: "leaf" },
  { id: "bars-h", label: "bars H" },
  { id: "bars-v", label: "bars V" },
  { id: "ring", label: "ring" },
  { id: "squircle", label: "squircle" },
  { id: "droplet", label: "droplet" },
  { id: "shield", label: "shield" },
  { id: "flower", label: "flower" },
  { id: "pentagon", label: "pentagon" },
  { id: "moon", label: "moon" },
  { id: "bolt", label: "bolt" },
  { id: "burst", label: "burst" },
  { id: "gear-dot", label: "gear" },
  { id: "cloud", label: "cloud" },
  { id: "capsule-h", label: "pill H" },
  { id: "capsule-v", label: "pill V" },
  { id: "checker", label: "checker" },
  { id: "circle-plus", label: "circle +" },
];

function DotThumb({ id, color }: { id: DotId; color: string }) {
  if ((NATIVE_DOTS as string[]).includes(id)) {
    return (
      <StyleThumb
        options={{
          dotsOptions: { type: id as DotType, color: "currentColor" },
          cornersSquareOptions: { type: "square", color: "currentColor" },
          cornersDotOptions: { type: "square", color: "currentColor" },
        }}
      />
    );
  }
  const path = DOT_CUSTOM[id as Exclude<DotId, DotType>];
  // Show a 4x4 grid of the custom module shape as the thumbnail.
  return (
    <div className="w-full aspect-square grid place-items-center" style={{ color }}>
      <svg viewBox="0 0 400 400" className="w-full h-full" fill="currentColor">
        {Array.from({ length: 4 }).flatMap((_, r) =>
          Array.from({ length: 4 }).map((_, c) => (
            <g key={`${r}-${c}`} transform={`translate(${c * 100} ${r * 100})`}>
              <path d={path} />
            </g>
          ))
        )}
      </svg>
    </div>
  );
}

function DotPicker({ value, color, onChange }: { value: DotId; color: string; onChange: (v: DotId) => void }) {
  return (
    <div className="-mx-1 overflow-x-auto pb-2 [scrollbar-width:thin]">
      <div className="flex gap-3 px-1 min-w-min">
        {DOT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`shrink-0 w-[84px] flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all ${
              value === opt.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/60 bg-background/40 text-foreground/80 hover:border-border hover:bg-background/70"
            }`}
            title={opt.label}
          >
            <DotThumb id={opt.id} color={value === opt.id ? "currentColor" : color} />
            <span className="text-[10px] leading-tight truncate w-full text-center">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Draws custom shapes for every dark QR module (skipping the three finder
 * patterns, which the CornerOverlay handles).
 */
function DotOverlay({
  state: s, qrRef, moduleCount,
}: {
  state: State;
  qrRef: React.MutableRefObject<QRCodeStyling | null>;
  moduleCount: number;
}) {
  if ((NATIVE_DOTS as string[]).includes(s.dotType)) return null;
  const qr = qrRef.current as unknown as { _qr?: { isDark: (r: number, c: number) => boolean; getModuleCount: () => number } } | null;
  const q = qr?._qr;
  if (!q) return null;
  const N = q.getModuleCount();
  if (N !== moduleCount) return null; // wait for state sync
  const W = s.size;
  const margin = s.margin;
  const inner = W - 2 * margin;
  const cell = inner / N;
  const path = DOT_CUSTOM[s.dotType as Exclude<DotId, DotType>];

  // Skip finder-pattern regions (7x7 blocks) — the corner overlay owns those.
  const inFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);

  // Skip a rough logo area if a logo is present.
  let logoR0 = -1, logoR1 = -1, logoC0 = -1, logoC1 = -1;
  if (s.logo) {
    const half = Math.ceil((N * s.logoSize) / 2);
    const mid = Math.floor(N / 2);
    logoR0 = mid - half; logoR1 = mid + half;
    logoC0 = mid - half; logoC1 = mid + half;
  }

  const cells: React.ReactElement[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (inFinder(r, c)) continue;
      if (s.logo && r >= logoR0 && r <= logoR1 && c >= logoC0 && c <= logoC1) continue;
      if (!q.isDark(r, c)) continue;
      cells.push(
        <g key={`${r}-${c}`} transform={`translate(${margin + c * cell} ${margin + r * cell}) scale(${cell / 100})`}>
          <path d={path} />
        </g>
      );
    }
  }

  const fill = s.useGradient ? "url(#dotGrad)" : s.dotColor;
  return (
    <svg
      viewBox={`0 0 ${W} ${W}`}
      width={W}
      height={W}
      className="absolute inset-0 pointer-events-none [&]:max-w-full [&]:h-auto"
      style={{ display: "block" }}
      aria-hidden
      fill={fill}
    >
      {s.useGradient && (
        <defs>
          {s.gradientType === "radial" ? (
            <radialGradient id="dotGrad" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor={s.dotColor} />
              <stop offset="100%" stopColor={s.gradientColor2} />
            </radialGradient>
          ) : (
            <linearGradient id="dotGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={s.dotColor} />
              <stop offset="100%" stopColor={s.gradientColor2} />
            </linearGradient>
          )}
        </defs>
      )}
      {cells}
    </svg>
  );
}




