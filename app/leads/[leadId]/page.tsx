"use client";

import { use } from "react";
import { DetalheLead } from "@/components/leads/DetalheLead";

export default function PaginaLead({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = use(params);
  return <DetalheLead leadId={leadId} />;
}
