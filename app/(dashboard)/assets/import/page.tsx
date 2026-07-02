"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CsvRow {
  name: string;
  category: string;
  serialNo: string;
  brand?: string;
  description?: string;
}

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setResult(null);
    setErrors([]);

    Papa.parse<CsvRow>(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setTotalRows(results.data.length);
        setPreview(results.data.slice(0, 5));
        
        // Basic validation
        const tempErrors: string[] = [];
        results.data.forEach((row, index) => {
          if (!row.name || !row.category || !row.serialNo) {
            tempErrors.push(`Row ${index + 1}: Missing required fields (name, category, or serialNo).`);
          }
        });
        setErrors(tempErrors);
      }
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setResult(null);

    // Read full file again for submission
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await fetch("/api/assets/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assets: results.data }),
          });

          const data = await response.json();
          if (response.ok) {
            setResult(data);
          } else {
            setErrors([data.error || "Failed to import assets"]);
          }
        } catch (error) {
          console.error("Import error:", error);
          setErrors(["An unexpected error occurred during import."]);
        } finally {
          setIsImporting(false);
        }
      }
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Bulk Import Assets</h1>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Upload CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Format: <code className="bg-muted px-1 rounded">name, category, serialNo, brand, description</code>
          </p>
        </div>

        {errors.length > 0 && !result && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md space-y-2">
            <h3 className="font-semibold text-sm">Validation Errors</h3>
            <ul className="text-xs list-disc list-inside">
              {errors.slice(0, 5).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {errors.length > 5 && <li>...and {errors.length - 5} more errors.</li>}
            </ul>
          </div>
        )}

        {preview.length > 0 && !result && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm">Data Preview (First 5 of {totalRows} rows)</h3>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Serial No</TableHead>
                    <TableHead>Brand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell className="font-mono text-xs">{row.serialNo}</TableCell>
                      <TableCell>{row.brand}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button 
              onClick={handleImport} 
              disabled={isImporting || errors.length > 0}
            >
              {isImporting ? "Importing..." : `Import ${totalRows} Assets`}
            </Button>
          </div>
        )}

        {result && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 p-4 rounded-md text-green-800 dark:text-green-300">
            <h3 className="font-semibold mb-2">Import Complete</h3>
            <p className="text-sm">{result.imported} assets successfully imported.</p>
            {result.skipped > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium">{result.skipped} assets skipped/failed:</p>
                <ul className="text-xs list-disc list-inside mt-2 max-h-32 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
