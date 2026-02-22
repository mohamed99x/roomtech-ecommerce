import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Copy, Check, Users, DollarSign, FileText, TrendingUp, Award, Clock } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { formatSuperadminCurrency } from '@/utils/helpers';


interface ReferralDashboardProps {
  userType: string;
  stats: any;
  referralLink?: string;
  recentReferredUsers?: any[];
}

export default function ReferralDashboard({ userType, stats, referralLink, recentReferredUsers }: ReferralDashboardProps) {
  const { t } = useTranslation();

  const [copied, setCopied] = useState(false);

  const handleCopyLink = (text: string) => {
    // Fallback clipboard function for HTTP environments
    const copyToClipboard = (text: string) => {
      if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API for HTTPS
        return navigator.clipboard.writeText(text);
      } else {
        // Fallback for HTTP environments
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        return new Promise<void>((resolve, reject) => {
          if (document.execCommand('copy')) {
            textArea.remove();
            resolve();
          } else {
            textArea.remove();
            reject(new Error('Copy failed'));
          }
        });
      }
    };
    copyToClipboard(text)
      .then(() => {
        toast.success(t('Link copied to clipboard'));
      })
      .catch(() => {
        toast.error(t('Failed to copy link'));
      });
  };

  const copyReferralLink = () => {
    if (referralLink) {
      handleCopyLink(referralLink);
    }
  };

  if (userType === 'superadmin') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Total Referral Users')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReferralUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Pending Payouts')}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayouts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Total Commission Paid')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatSuperadminCurrency(stats.totalCommissionPaid)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('Active Companies')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.topCompanies?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('Top Referring Companies')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topCompanies?.slice(0, 5).map((company: any, index: number) => (
                  <div key={company.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-sm text-muted-foreground">{company.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{company.referral_count} {t('referrals')}</p>
                      <p className="text-sm text-green-600 font-medium">{formatSuperadminCurrency(company.total_earned)}</p>
                    </div>
                  </div>
                ))}
                {(!stats.topCompanies || stats.topCompanies.length === 0) && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>{t('No referring companies yet')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('Monthly Performance')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{t('Referral Signups')}</h4>
                  <div className="text-2xl font-bold">
                    {Object.values(stats.monthlyReferrals || {}).reduce((a: any, b: any) => a + b, 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">{t('This year')}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">{t('Payouts Processed')}</h4>
                  <div className="text-2xl font-bold">
                    {formatSuperadminCurrency(stats.totalMonthlyPayouts || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground">{t('This year')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('Total Referrals')}</p>
                <h3 className="mt-2 text-2xl font-bold">{stats.totalReferrals}</h3>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('Referred Users')}</p>
                <h3 className="mt-2 text-2xl font-bold">{stats.referredUsersCount || 0}</h3>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('Total Earned')}</p>
                <h3 className="mt-2 text-2xl font-bold">{formatSuperadminCurrency(stats.totalEarned)}</h3>
              </div>
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('Available Balance')}</p>
                <h3 className="mt-2 text-2xl font-bold">{formatSuperadminCurrency(stats.availableBalance)}</h3>
              </div>
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Your Referral Link')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={referralLink || ''}
              readOnly
              className="flex-1"
            />
            <Button
              onClick={copyReferralLink}
              variant="outline"
              size="icon"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t('Share this link to earn commissions when users sign up and purchase plans')}
          </p>
        </CardContent>
      </Card>

        {/* Recent Referred Users Card - Commented out until data issue resolved */}
        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('Recent Referred Users')}</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <a href={route('referral.referred-users')}>
                {t('View All')}
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            {recentReferredUsers && recentReferredUsers.length > 0 ? (
              <div className="space-y-3">
                {recentReferredUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {user.plan ? (
                        <Badge variant="default" className="text-xs">
                          {user.plan.name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {t('No Plan')}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t('No referred users yet')}
                </p>
              </div>
            )}
          </CardContent>
        </Card> */}
    </div>
  );
}