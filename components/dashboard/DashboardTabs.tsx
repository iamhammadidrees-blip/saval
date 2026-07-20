"use client";

import { PendingTable } from "@/components/dashboard/PendingTable";
import { RequiredTable } from "@/components/dashboard/RequiredTable";
import { UploadedFilesList } from "@/components/upload/UploadedFilesList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DashboardTabs() {
  return (
    <Tabs defaultValue="pending">
      <TabsList>
        <TabsTrigger value="pending" className="px-4">
          Pending
        </TabsTrigger>
        <TabsTrigger value="required" className="px-4">
          Required
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
      <TabsContent value="files">
        <UploadedFilesList />
      </TabsContent>
    </Tabs>
  );
}
