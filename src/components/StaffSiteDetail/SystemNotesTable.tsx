import React, { useState } from "react";

interface Note {
  id: number;
  date: string;
  department: string;
  note: string;
  author: string;
  favorite: boolean;
  tag?: string;
}

interface SystemNotesTableProps {
  notes: Note[];
  onAddNote?: () => void;
}

const SystemNotesTable: React.FC<SystemNotesTableProps> = ({
  notes: initialNotes,
  onAddNote,
}) => {
  const [search, setSearch] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [notes, setNotes] = useState<Note[]>(initialNotes);

  const filteredNotes = notes.filter(
    (note) =>
      (!showFavorites || note.favorite) &&
      (note.note.toLowerCase().includes(search.toLowerCase()) ||
        note.author.toLowerCase().includes(search.toLowerCase()) ||
        note.department.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleFavorite = (id: number) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, favorite: !n.favorite } : n))
    );
  };

  // Export notes as CSV
  const handleExportCSV = () => {
    const csvRows = [
      ["Date", "Department", "Note", "Author", "Favorite"],
      ...notes.map((n) => [
        n.date,
        n.department,
        n.note.replace(/\n/g, " "),
        n.author,
        n.favorite ? "Yes" : "No",
      ]),
    ];
    const csvContent = csvRows
      .map((row) =>
        row
          .map((field) => '"' + String(field).replace(/"/g, '""') + '"')
          .join(",")
      )
      .join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "site-notes.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded shadow dark:shadow-gray-700 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border dark:border-gray-700 rounded px-3 py-2 text-sm w-48 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <button
            className={`px-3 py-2 rounded text-sm ${
              showFavorites ? "bg-yellow-200 dark:bg-yellow-900" : "bg-gray-200 dark:bg-gray-700"
            } text-gray-900 dark:text-gray-100`}
            onClick={() => setShowFavorites((v) => !v)}
          >
            Show favorites only
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Total Notes: {notes.length}
          </div>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded font-semibold flex items-center gap-2 text-sm
                    hover:bg-green-700 dark:bg-blue-700 dark:hover:bg-blue-800 dark:text-white"
            onClick={onAddNote}
          >
            <span className="w-5 text-lg flex-shrink-0">📄</span> Add Note
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded font-semibold flex items-center gap-2 text-sm"
            onClick={handleExportCSV}
          >
            <span className="w-5 text-lg flex-shrink-0">⬇️</span> Export Notes
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border dark:border-gray-700 rounded">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
              <th className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">Date</th>
              <th className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">Department</th>
              <th className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">Note</th>
              <th className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">Author</th>
              <th className="py-2 px-2 text-left text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => (
                <tr key={note.id} className="border-b dark:border-gray-700 last:border-0">
                  <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{note.date}</td>
                  <td className="py-2 px-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        note.tag === "Electrical"
                          ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                          : note.tag === "Legal"
                          ? "bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300"
                          : note.tag === "Roofing"
                          ? "bg-yellow-50 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {note.department}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{note.note}</td>
                  <td className="py-2 px-2 text-gray-900 dark:text-gray-100">{note.author}</td>
                  <td className="py-2 px-2">
                    <button
                      className={`text-yellow-500 text-lg mr-2 ${
                        note.favorite ? "" : "opacity-30"
                      }`}
                      title={
                        note.favorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      onClick={() => toggleFavorite(note.id)}
                    >
                      ★
                    </button>
                    <button className="text-gray-600 dark:text-gray-400 underline text-xs">
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-400 dark:text-gray-500">
                  No notes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Total Notes: {notes.length}
      </div>
    </div>
  );
};

export default SystemNotesTable;
