import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { useTranslation } from 'react-i18next';
import { usePage, Link, router } from '@inertiajs/react';
import { ArrowLeft, Users, Calendar, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatSuperadminCurrency } from '@/utils/helpers';

interface ReferredUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
  plan?: {
    id: number;
    name: string;
    price: number;
    yearly_price?: number;
  };
  plan_orders?: Array<{
    id: number;
    billing_cycle: string;
    final_price: number;
  }>;
  referrals?: Array<{
    id: number;
    amount: number;
    commission_percentage: number;
    created_at: string;
  }>;
}

interface ReferredUsersProps {
  referredUsers: {
    data: ReferredUser[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: any[];
  };
  userType: string;
}

interface PageProps {
  props: ReferredUsersProps;
}

export default function ReferredUsers() {
  const { t } = useTranslation();
  const { props } = usePage<PageProps>();
  const { referredUsers, userType } = props;

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getTotalCommission = (user: ReferredUser) => {
    return user.referrals?.reduce((total, referral) => total + (Number(referral.amount) || 0), 0) || 0;
  };

  const getPlanDisplayInfo = (user: ReferredUser) => {
    if (!user.plan) return null;
    
    const latestOrder = user.plan_orders?.[0];
    
    if (latestOrder) {
      const isYearly = latestOrder.billing_cycle === 'yearly';
      return {
        name: user.plan.name,
        price: latestOrder.final_price,
        cycle: isYearly ? 'year' : 'month'
      };
    }
    
    return {
      name: user.plan.name,
      price: user.plan.price,
      cycle: 'month'
    };
  };

  return (
    <PageTemplate 
      title={t('Referred Users')} 
      url="/referral/referred-users"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={route("referral.index")}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('Back to Referral Dashboard')}
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{t('Referred Users')}</h1>
              <p className="text-muted-foreground">
                {userType === 'superadmin' 
                  ? t('All users who registered using referral codes')
                  : t('Users who registered using your referral code')
                }
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('Total Referred Users')}</p>
                  <h3 className="mt-2 text-2xl font-bold">{referredUsers.total}</h3>
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
                  <p className="text-sm font-medium text-muted-foreground">{t('Users with Plans')}</p>
                  <h3 className="mt-2 text-2xl font-bold">{referredUsers.data.filter(user => user.plan).length}</h3>
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
                  <p className="text-sm font-medium text-muted-foreground">{t('Total Commission Earned')}</p>
                  <h3 className="mt-2 text-2xl font-bold">{formatSuperadminCurrency(referredUsers.data.reduce((total, user) => total + getTotalCommission(user), 0) || 0)}</h3>
                </div>
                <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                  <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>  
          <CardHeader>
            <CardTitle>{t('Referred Users List')}</CardTitle>
          </CardHeader>
          <CardContent>
            {referredUsers.data.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('No referred users yet')}</h3>
                <p className="text-muted-foreground">
                  {userType === 'superadmin' 
                    ? t('No users have registered using referral codes yet.')
                    : t('Share your referral link to start earning commissions.')
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {referredUsers.data.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {t('Registered')} {formatDate(user.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          {(() => {
                            const planInfo = getPlanDisplayInfo(user);
                            return planInfo ? (
                              <div>
                                <Badge variant="default" className="mb-1">
                                  {planInfo.name}
                                </Badge>
                                <p className="text-sm text-muted-foreground">
                                  {formatSuperadminCurrency(planInfo.price)}/{t(planInfo.cycle)}
                                </p>
                              </div>
                            ) : (
                              <Badge variant="secondary">
                                {t('No Plan')}
                              </Badge>
                            );
                          })()} 
                        </div>
                        
                        {getTotalCommission(user) > 0 && (
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">
                              +{formatSuperadminCurrency(getTotalCommission(user))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t('Commission')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {user.referrals && user.referrals.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h5 className="text-sm font-medium mb-2">{t('Commission History')}</h5>
                        <div className="space-y-1">
                          {user.referrals.map((referral) => (
                            <div key={referral.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {referral.commission_percentage}% commission
                              </span>
                              <span className="font-medium text-green-600">
                                +{formatSuperadminCurrency(referral.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {referredUsers.last_page > 1 && (
          <Pagination
            from={referredUsers.from}
            to={referredUsers.to}
            total={referredUsers.total}
            links={referredUsers.links}
            currentPage={referredUsers.current_page}
            lastPage={referredUsers.last_page}
            entityName={t('users')}
            onPageChange={(url) => {
              router.visit(url, {
                preserveState: true,
                preserveScroll: true,
              });
            }}
          />
        )}
      </div>
    </PageTemplate>
  );
}