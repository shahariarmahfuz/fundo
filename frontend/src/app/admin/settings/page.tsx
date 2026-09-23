'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { SystemSetting } from '@/types/admin';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AdminSettingsPage() {
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [settingsList, setSettingsList] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const loadData = async () => {
    if (!hasPermission('settings.view')) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await ApiClient.get<SystemSetting[]>('/settings');
      setSettingsList(res);
      const map: Record<string, string> = {};
      res.forEach(s => {
        map[s.key] = s.value;
      });
      setEditValues(map);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && hasPermission('settings.view')) {
      loadData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, hasPermission]);

  const handleSave = async (key: string) => {
    try {
      setSaveStatus(`Saving ${key}...`);
      await ApiClient.put(`/settings/${key}`, {
        value: editValues[key]
      });
      setSaveStatus(`Saved '${key}' successfully!`);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      setSaveStatus(`Error saving ${key}: ${err.message}`);
    }
  };

  if (!authLoading && !hasPermission('settings.view')) {
    return (
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader
          title="Foundation System Configuration"
          subtitle="Global operational parameters and policy controls"
          userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
        />
        <AccessDenied
          permission="settings.view"
          message="You do not have authorization to view system configuration settings."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Foundation System Configuration"
        subtitle="Manage global operational parameters, public metadata, and policy controls"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full min-w-0">
        {saveStatus && (
          <div className="p-3 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700" />
            <span>{saveStatus}</span>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center text-xs text-slate-400">
                Loading system parameters...
              </CardContent>
            </Card>
          ) : (
            settingsList.map((setting) => (
              <Card key={setting.id}>
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">{setting.key}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {setting.category}
                      </Badge>
                      {setting.is_public && (
                        <Badge variant="info" className="text-[10px]">Public</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{setting.description}</p>
                    <div className="pt-2 max-w-md">
                      <Input
                        value={editValues[setting.key] ?? setting.value}
                        onChange={(e) => setEditValues({ ...editValues, [setting.key]: e.target.value })}
                        disabled={!hasPermission('settings.edit')}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {hasPermission('settings.edit') && (
                    <div className="shrink-0 sm:self-end">
                      <Button
                        size="sm"
                        onClick={() => handleSave(setting.key)}
                        className="gap-1.5 text-xs h-8"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>Save</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
