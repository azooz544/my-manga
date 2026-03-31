/**
 * Import Admin Panel
 * Manage multi-source manga imports
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Play, Pause, RotateCcw, TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

type Source = 'anilist' | 'myanimelist' | 'jikan' | 'mangadex' | 'kitsu';

export default function ImportAdmin() {
  const [selectedSources, setSelectedSources] = useState<Source[]>([
    'anilist',
    'myanimelist',
    'jikan',
    'mangadex',
    'kitsu',
  ]);
  const [isImporting, setIsImporting] = useState(false);
  const [importId, setImportId] = useState<string | null>(null);

  const sources: { id: Source; name: string; description: string }[] = [
    {
      id: 'anilist',
      name: 'AniList',
      description: 'Comprehensive anime/manga database with GraphQL API',
    },
    {
      id: 'myanimelist',
      name: 'MyAnimeList',
      description: 'Popular anime/manga community database',
    },
    {
      id: 'jikan',
      name: 'Jikan',
      description: 'Direct access to MyAnimeList data',
    },
    {
      id: 'mangadex',
      name: 'MangaDex',
      description: 'Largest manga scanlation database',
    },
    {
      id: 'kitsu',
      name: 'Kitsu',
      description: 'Modern anime/manga database',
    },
  ];

  const toggleSource = (source: Source) => {
    setSelectedSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const [, setLocation] = useLocation();
  const startImportMutation = (trpc.import.startImport as any).useMutation();

  const handleStartImport = async () => {
    setIsImporting(true);
    try {
      const result = await startImportMutation.mutateAsync({
        sources: selectedSources,
      });
      setImportId(result.importId);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🔄 نظام استيراد المانجا</h1>
          <p className="text-muted-foreground">
            استيراد المانجا من 5 مصادر مختلفة بشكل تلقائي وذكي
          </p>
        </div>

        {/* Alert */}
        <Card className="mb-6 p-4 border-amber-500/50 bg-amber-500/10">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">معلومة مهمة</h3>
              <p className="text-sm text-amber-800">
                الاستيراد من عدة مصادر يزيل التكرار تلقائياً ويدمج البيانات الأفضل من كل مصدر
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sources Selection */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">اختر المصادر</h2>
              <div className="space-y-3">
                {sources.map(source => (
                  <label
                    key={source.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition"
                  >
                    <Checkbox
                      checked={selectedSources.includes(source.id)}
                      onCheckedChange={() => toggleSource(source.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{source.name}</div>
                      <div className="text-sm text-muted-foreground">{source.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          </div>

          {/* Statistics */}
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                الإحصائيات
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground">المصادر المختارة</div>
                  <div className="text-2xl font-bold text-primary">{selectedSources.length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">الحالة</div>
                  <div className="text-sm">
                    {isImporting ? (
                      <span className="text-amber-600 flex items-center gap-1">
                        <span className="animate-spin">⟳</span> جاري الاستيراد
                      </span>
                    ) : importId ? (
                      <span className="text-green-600">✓ اكتمل</span>
                    ) : (
                      <span className="text-muted-foreground">جاهز</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <div className="space-y-2">
                <Button
                  onClick={handleStartImport}
                  disabled={isImporting || selectedSources.length === 0}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Play className="w-4 h-4" />
                  بدء الاستيراد
                </Button>
                <Button variant="outline" className="w-full gap-2" disabled>
                  <Pause className="w-4 h-4" />
                  إيقاف
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setLocation('/')}
                >
                  ← العودة للرئيسية
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Import Progress */}
        {importId && (
          <Card className="mt-6 p-6">
            <h3 className="font-semibold mb-4">تفاصيل الاستيراد</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">معرّف الاستيراء</span>
                <span className="font-mono">{importId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الوقت</span>
                <span>{new Date().toLocaleTimeString('ar-SA')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المصادر</span>
                <span>{selectedSources.join(', ')}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Information */}
        <Card className="mt-6 p-6 bg-blue-500/10 border-blue-500/50">
          <h3 className="font-semibold mb-3 text-blue-900">ℹ️ معلومات إضافية</h3>
          <ul className="space-y-2 text-sm text-blue-900">
            <li>✓ الاستيراد يعمل بشكل متوازي من جميع المصادر</li>
            <li>✓ التكرار يتم حذفه تلقائياً باستخدام مقارنة النصوص الذكية</li>
            <li>✓ البيانات الأفضل من كل مصدر يتم دمجها</li>
            <li>✓ يتم تتبع جميع المصادر لكل مانجا</li>
            <li>✓ العملية تستغرق حوالي 30-60 ثانية</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
