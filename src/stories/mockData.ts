import { GridColumn } from "@/types/GridColumn";
import { Row } from "@open-dcp/grid";

// Mock column definitions
export const mockColumns: GridColumn[] = [
    { key: "id", label: "ID", width: "10%", type: "integer" },
    { key: "name", label: "Name", width: "30%", type: "string" },
    { key: "age", label: "Age", width: "20%", type: "number" },
    { key: "country", label: "Country", width: "40%", type: "string" },
];

// Mock row data generator
export const generateMockRows = (count: number = 100): any[] => {
    const countries = ["USA", "Canada", "UK", "Germany", "France", "Australia"];
    const rows: any[] = [];

    for (let i = 1; i <= count; i++) {
        rows.push({
            id: i,
            name: `User ${i}`,
            age: Math.floor(Math.random() * 60) + 18,
            country: countries[Math.floor(Math.random() * countries.length)],
        });
    }

    return rows;
};

// Generate CONSISTENT mock data for API mode testing (no randomness)
export const generateConsistentMockRows = (count: number = 100): any[] => {
    const countries = ["USA", "Canada", "UK", "Germany", "France", "Australia"];
    const names = ["Alice", "Bob", "Charlie", "David", "Emma", "Frank", "Grace", "Henry"];
    const rows: any[] = [];

    for (let i = 1; i <= count; i++) {
        rows.push({
            id: i,
            name: names[(i - 1) % names.length] + ` ${Math.floor((i - 1) / names.length) + 1}`,
            age: 20 + ((i - 1) % 50), // Ages from 20 to 69, repeating pattern
            country: countries[(i - 1) % countries.length],
        });
    }

    return rows;
};

// Mock column definitions with diverse types
export const diverseColumns: GridColumn[] = [
    { key: "id", label: "ID", type: "integer", width: "10%" },
    { key: "name", label: "Name", type: "string", width: "20%" },
    { key: "age", label: "Age", type: "number", width: "10%" },
    { key: "birthDate", label: "Birth Date", type: "date", width: "15%" },
    { key: "lastLogin", label: "Last Login", type: "datetime", width: "15%" },
    { key: "sessionDuration", label: "Session Duration", type: "duration", width: "15%" },
];

// Column definitions for filtering stories (without component columns since they can't be filtered)
export const filterableColumns: GridColumn[] = diverseColumns;

// Mock row data generator for diverse columns
export const generateDiverseMockRows = (count: number = 100): Row[] => {
    const statuses = ["Active", "Inactive", "Pending"];
    const rows: any[] = [];

    for (let i = 1; i <= count; i++) {
        rows.push({
            id: i,
            name: `User ${i}`,
            age: (Math.random() * 6000) / 100 + 18,
            birthDate: new Date(
                1980 + Math.floor(Math.random() * 40),
                Math.floor(Math.random() * 12),
                Math.floor(Math.random() * 28)
            ).toISOString().split("T")[0],
            lastLogin: new Date().toISOString(),
            sessionDuration: `${Math.floor(Math.random() * 5)}h ${Math.floor(Math.random() * 60)}m`,
        });
    }

    return rows;
};