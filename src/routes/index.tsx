import { createFileRoute } from "@tanstack/react-router";
import QRGenerator from "@/components/qr/QRGenerator";

export const Route = createFileRoute("/")({
  component: QRGenerator,
});
