"use client";

import { ModelsView } from "@/components/dashboard/ModelsView";
import { PendingTable } from "@/components/dashboard/PendingTable";
import { RequiredTable } from "@/components/dashboard/RequiredTable";
import { UploadedFilesList } from "@/components/upload/UploadedFilesList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DashboardTabs() {
  return (
    <Tabs defaultValue="pending">
      <TabsList className="mx-auto">
        <TabsTrigger value="pending" className="px-4">
          Pending
        </TabsTrigger>
        <TabsTrigger value="required" className="px-4">
          Required
        </TabsTrigger>
        <TabsTrigger value="models" className="px-4">
          Models
        </TabsTrigger>
        <TabsTrigger value="files" className="px-4">
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
