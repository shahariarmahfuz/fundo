'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { SystemSetting, BaseContributionRate } from '@/types/admin';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Coins,
  History,
  ShieldCheck,
  Calendar,
  Info,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessDenied } from '@/components/admin/PermissionGuard';

export default function AdminSettingsPage() {
  const { hasPermission, loading: authLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'financial' | 'general'>('financial');
  const [settingsList, setSettingsList] = useState<SystemSetting[]>([]);
  const [ratesList, setRatesList] = useState<BaseContributionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Financial setting state
  const [newRateAmount, setNewRateAmount] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0]
  );
  const [rateDescription, setRateDescription] = useState('');
  const [updatingRate, setUpdatingRate] = useState(false);

  const loadData = async () => {
    if (!hasPermission('settings.view')) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [resSettings, resRates] = await Promise.all([
        ApiClient.get<SystemSetting[]>('/settings'),
        ApiClient.get<BaseContributionRate[]>('/contributions/rates').catch(() => [])
      ]);

      setSettingsList(resSettings);
      setRatesList(resRates);

      const map: Record<string, string> = {};
      resSettings.forEach((s) => {
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

  const handleSaveGeneral = async (key: string) => {
    try {
      setSaveStatus(`Saving ${key}...`);
      await ApiClient.put(`/settings/${key}`, {
        value: editValues[key]
      });
      setSaveStatus(`Saved '${key}' successfully!`);
      setTimeout(() => setSaveStatus(null), 3000);
      loadData();
    } catch (err: any) {
      setSaveStatus(`Error saving ${key}: ${err.message}`);
    }
  };

  const handleUpdateBaseRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newRateAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    try {
      setUpdatingRate(true);
      await ApiClient.post('/contributions/rates', {
        amount: amountVal,
        effective_from: effectiveFrom,
        description: rateDescription || `Board-approved base monthly rate of ৳${amountVal}`
      });

      setSaveStatus(`Base Monthly Contribution updated to ${formatCurrency(amountVal)} effective from ${effectiveFrom}!`);
      setNewRateAmount('');
      setRateDescription('');
      setTimeout(() => setSaveStatus(null), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update base rate');
    } finally {
      setUpdatingRate(false);
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

  const currentBaseRateSetting = settingsList.find((s) => s.key === 'base_monthly_contribution');
  const currentBaseAmount = currentBaseRateSetting ? parseFloat(currentBaseRateSetting.value) : 100.0;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto min-w-0 w-full">
      <AdminHeader
        title="Foundation System Configuration"
        subtitle="Manage financial settings, base contribution rules, public metadata, and policy controls"
        userRole={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full min-w-0">
        {/* Tab Toggle Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab('financial')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'financial'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coins className="h-3.5 w-3.5 text-teal-700" />
              <span>Financial Settings</span>
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'general'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="h-3.5 w-3.5 text-slate-600" />
              <span>General Settings</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {activeTab === 'financial' ? 'Foundation Accounting Rules' : 'System Parameters'}
          </span>
        </div>

        {saveStatus && (
          <div className="p-3.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700" />
            <span>{saveStatus}</span>
          </div>
        )}

        {activeTab === 'financial' ? (
          <div className="space-y-6">
            {/* Base Monthly Contribution Configuration Card */}
            <Card className="border border-slate-200 bg-white">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Coins className="h-4 w-4 text-teal-700" />
                    <span>Base Monthly Contribution Setting</span>
                  </CardTitle>
                  <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 text-xs">
                    Current Standard: {formatCurrency(currentBaseAmount)} / month
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
                  <Info className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800">
                      Accounting Integrity & Effective Date Rules
                    </p>
                    <p>
                      The Base Monthly Contribution is the standard expected amount due from active members. Members may pay less, equal, or more than this amount. Changing this setting takes effect from the specified date forward and <strong>never modifies historical contribution records or past monthly passbooks</strong>.
                    </p>
                  </div>
                </div>

                {hasPermission('settings.edit') && (
                  <form onSubmit={handleUpdateBaseRate} className="p-5 border border-slate-200 rounded-lg bg-white space-y-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Adjust Base Monthly Contribution Rate
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          New Base Amount (৳) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <Input
                            type="number"
                            step="0.01"
                            min="1"
                            required
                            placeholder="e.g. 150.00"
                            value={newRateAmount}
                            onChange={(e) => setNewRateAmount(e.target.value)}
                            className="pl-8 text-xs font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Effective From Date <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="date"
                          required
                          value={effectiveFrom}
                          onChange={(e) => setEffectiveFrom(e.target.value)}
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Reason / Description
                        </label>
                        <Input
                          placeholder="e.g. Approved rate update"
                          value={rateDescription}
                          onChange={(e) => setRateDescription(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={updatingRate || !newRateAmount}
                        size="sm"
                        className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-8"
                      >
                        {updatingRate ? 'Updating Rate...' : 'Apply New Base Contribution'}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Rate History Audit Table */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-slate-500" />
                    <h4 className="text-xs font-bold text-slate-900">
                      Historical Base Contribution Schedule
                    </h4>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                          <th className="py-2.5 px-4">Standard Base</th>
                          <th className="py-2.5 px-4">Effective From</th>
                          <th className="py-2.5 px-4">Effective To</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4">Description</th>
                          <th className="py-2.5 px-4">Updated By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {ratesList.map((r) => {
                          const isActive = !r.effective_to || new Date(r.effective_to) >= new Date();
                          return (
                            <tr key={r.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-4 font-bold text-slate-900">
                                {formatCurrency(r.amount)}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-slate-600">
                                {formatDate(r.effective_from)}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-slate-600">
                                {r.effective_to ? formatDate(r.effective_to) : 'Present (Active)'}
                              </td>
                              <td className="py-2.5 px-4">
                                {isActive ? (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                    Currently Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-slate-400 text-[10px]">
                                    Historical
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                                {r.description || '—'}
                              </td>
                              <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                                {r.created_by || 'System'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* General Settings Tab */
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
                          onClick={() => handleSaveGeneral(setting.key)}
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
        )}
      </div>
    </div>
  );
}
