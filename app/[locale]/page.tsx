"use client";

import { KanbanProvider } from "../../contexts/KanbanContext";
import { KanbanBoard } from "../../components/KanbanBoard";

export default function Home() {
  return (
    <KanbanProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <main id="main-content" className="container mx-auto px-4 py-8">
          <KanbanBoard />
        </main>
      </div>
    </KanbanProvider>
  );
}
