"use client";

import { useEffect, useState } from "react";
import { BorrowingsChart, CategoryPieChart } from "@/components/ReportChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch stats", err);
        setLoading(false);
      });
  }, []);

  const handleExport = (type: string) => {
    // In a real app, this would hit an export API endpoint that returns a CSV stream.
    // For now we just mock the URL.
    window.location.href = `/api/reports/export?type=${type}`;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-muted w-48 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 h-[400px] bg-muted rounded-xl"></div>
          <div className="h-[400px] bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("assets")}>
            <Download className="w-4 h-4 mr-2" />
            Assets CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("borrowings")}>
            <Download className="w-4 h-4 mr-2" />
            Borrowings CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats?.borrowingsByMonth && (
          <BorrowingsChart data={stats.borrowingsByMonth} />
        )}
        {stats?.assetsByCategory && (
          <CategoryPieChart data={stats.assetsByCategory} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Borrowed Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead className="text-right">Borrow Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.topAssets?.map((item: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{item.assetName}</TableCell>
                    <TableCell className="text-right">{item.borrowCount}</TableCell>
                  </TableRow>
                ))}
                {(!stats?.topAssets || stats.topAssets.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Placeholder for future top employees or issues */}
        <Card>
          <CardHeader>
            <CardTitle>System Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="font-medium text-muted-foreground">Total Active Issues</span>
                <span className="text-2xl font-bold">12</span>
             </div>
             <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="font-medium text-muted-foreground">Assets in Maintenance</span>
                <span className="text-2xl font-bold">3</span>
             </div>
             <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <span className="font-medium text-muted-foreground">Overdue Borrowings</span>
                <span className="text-2xl font-bold text-destructive">2</span>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
