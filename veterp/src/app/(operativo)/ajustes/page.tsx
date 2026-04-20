import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AjustesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
      <Card>
        <CardHeader>
          <CardTitle>Base</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Página base de ajustes (placeholder).
        </CardContent>
      </Card>
    </div>
  );
}

