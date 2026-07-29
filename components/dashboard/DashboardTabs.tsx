"use client";

import { ModelsView } from "@/components/dashboard/ModelsView";
import { PendingTable } from "@/components/dashboard/PendingTable";
import { RequiredTable } from "@/components/dashboard/RequiredTable";
import { UploadedFilesList } from "@/components/upload/UploadedFilesList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * Panel-key styling: steel key on a cold rail, charcoal plate when engaged,
 * with a rust safety line under the active key.
 */
const panelKeyClass = cn(
  "flex-1 rounded-md border border-[#c5c9d0] bg-linear-to-b from-white to-[#f2f3f5]",
  "text-xs font-medium uppercase tracking-[0.08em] text-[#5c6370]",
  "hover:from-white hover:to-[#f2f3f5] hover:text-[#5c6370] dark:hover:text-[#5c6370]",
  "data-active:border-[#22262d]! data-active:from-[#3a404a]! data-active:to-[#2b3038]!",
  "data-active:bg-linear-to-b! data-active:text-[#f4f5f7]! data-active:shadow-[inset_0_-2px_0_0_#c45c26]!",
  "data-active:hover:from-[#3a404a]! data-active:hover:to-[#2b3038]! data-active:hover:text-[#f4f5f7]!",
);

export function DashboardTabs() {
  return (
    <Tabs defaultValue="pending" className="mt-1">
      <TabsList
        className={cn(
          "mx-auto h-11! w-full max-w-xl gap-2 rounded-lg p-1.5",
          "border border-[#c5c9d0] bg-linear-to-b from-[#edeff2] to-[#e2e5e9]",
        )}
      >
        <TabsTrigger value="pending" className={panelKeyClass}>
          Pending
        </TabsTrigger>
        <TabsTrigger value="required" className={panelKeyClass}>
          Merged
        </TabsTrigger>
        <TabsTrigger value="models" className={panelKeyClass}>
          Models
        </TabsTrigger>
        <TabsTrigger value="files" className={panelKeyClass}>
          Files Uploaded
        </TabsTrigger>
      </TabsList>
      <TabsContent value="pending">
        <PendingTable />
      </TabsContent>
      <TabsContent value="required">
        <RequiredTable />
      </TabsContent>
      <TabsContent value="models">
        <ModelsView />
      </TabsContent>
      <TabsContent value="files">
        <UploadedFilesList />
      </TabsContent>
    </Tabs>
  );
}
