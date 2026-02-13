import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { importPlayersFromCSV } from '../../utils/importPlayers';

export function PlayerImporter() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    setResult(null);
    setError(null);

    try {
      const text = await file.text();
      const importResult = await importPlayersFromCSV(text);

      if (importResult.success) {
        setResult(`Successfully imported ${importResult.players.length} players`);
      } else {
        setError(importResult.error.message || 'Failed to import players');
      }
    } catch (err) {
      setError(err.message || 'Failed to read file');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Importer</CardTitle>
        <CardDescription>
          Import players from CSV file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={importing}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50"
          />
        </div>

        {importing && (
          <Alert>
            <AlertDescription>Importing players...</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{result}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-slate-600">
          <p className="font-semibold mb-2">CSV Format:</p>
          <p>The CSV file should contain the following columns:</p>
          <ul className="list-disc list-inside mt-2 text-xs">
            <li>name, nickname, email, bio</li>
            <li>team_id (optional)</li>
            <li>is_captain, available_as_substitute, looking_for_team</li>
            <li>preferred_league (JSON array, e.g., ["A","B"])</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
