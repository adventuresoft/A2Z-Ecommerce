import React from "react";
import { findActiveItem } from "@/config/navigation";
import { ModuleStatusShell } from "@/components/layout";

export default async function CatchAllModulePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const resolvedParams = await params;
  const path = "/" + (resolvedParams.slug || []).join("/");
  const { activeItem, parentItem } = findActiveItem(path);

  const title = activeItem ? activeItem.title : "Module";
  const phase = activeItem?.phase || parentItem?.phase || 2;
  const parentTitle = parentItem ? parentItem.title : undefined;

  return (
    <ModuleStatusShell
      moduleName={title}
      phase={phase}
      description={`The ${title} module${
        parentTitle ? ` under ${parentTitle}` : ""
      } is scheduled for implementation in Phase ${phase}. Navigation, layout, and breadcrumb structures are active and validated.`}
      targetPrdSection={parentTitle ? `5 (${parentTitle})` : undefined}
    />
  );
}
