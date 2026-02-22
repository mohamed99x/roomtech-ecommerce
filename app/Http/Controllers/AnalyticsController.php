<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Customer;
use App\Models\Product;
use App\Models\OrderItem;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AnalyticsController extends BaseController
{
    public function index()
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);

        if (!$storeId) {
            return Inertia::render('analytics/index', [
                'analytics' => $this->getEmptyAnalytics()
            ]);
        }

        $analytics = [
            'metrics' => $this->getKeyMetrics($storeId),
            'topProducts' => $this->getTopProducts($storeId),
            'topCustomers' => $this->getTopCustomers($storeId),
            'recentActivity' => $this->getRecentActivity($storeId),
            'revenueChart' => $this->getRevenueChartData($storeId),
            'salesChart' => $this->getSalesChartData($storeId),
            // New Charts
            'orderStatusChart' => $this->getOrderStatusDistribution($storeId),
            'paymentMethodsChart' => $this->getPaymentMethodsChart($storeId)
        ];
        
        // In demo mode, add dummy data for metrics and charts only when they are zero/null
        if (config('app.is_demo', false)) {
            if ($analytics['metrics']['revenue']['current'] == 0 && $analytics['metrics']['orders']['current'] == 0) {
                $analytics['metrics'] = [
                    'revenue' => ['current' => 45250.75, 'change' => 12.5],
                    'orders' => ['current' => 156, 'change' => 23],
                    'customers' => ['total' => 342, 'new' => 28]
                ];
            }
            if (empty($analytics['revenueChart']) || count($analytics['revenueChart']) == 0) {
                $analytics['revenueChart'] = $this->getDemoRevenueChart();
            }
            if (empty($analytics['salesChart']) || count($analytics['salesChart']) == 0) {
                $analytics['salesChart'] = $this->getDemoSalesChart();
            }
        }

        return Inertia::render('analytics/index', [
            'analytics' => $analytics
        ]);
    }

    private function getKeyMetrics($storeId)
    {
        $currentMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        $currentRevenue = Order::where('store_id', $storeId)
            ->where('created_at', '>=', $currentMonth)
            ->sum('total_amount');

        $lastMonthRevenue = Order::where('store_id', $storeId)
            ->whereBetween('created_at', [$lastMonth, $currentMonth])
            ->sum('total_amount');

        $currentOrders = Order::where('store_id', $storeId)
            ->where('created_at', '>=', $currentMonth)
            ->count();

        $lastMonthOrders = Order::where('store_id', $storeId)
            ->whereBetween('created_at', [$lastMonth, $currentMonth])
            ->count();

        $totalCustomers = Customer::where('store_id', $storeId)->count();
        $newCustomers = Customer::where('store_id', $storeId)
            ->where('created_at', '>=', $currentMonth)
            ->count();

        return [
            'revenue' => [
                'current' => $currentRevenue,
                'change' => $lastMonthRevenue > 0 ? (($currentRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 : 0
            ],
            'orders' => [
                'current' => $currentOrders,
                'change' => $currentOrders - $lastMonthOrders
            ],
            'customers' => [
                'total' => $totalCustomers,
                'new' => $newCustomers
            ],

        ];
    }

    private function getTopProducts($storeId)
    {
        return OrderItem::select('product_name', 'product_id')
            ->selectRaw('SUM(quantity) as total_sold')
            ->selectRaw('SUM(total_price) as total_revenue')
            ->whereHas('order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->groupBy('product_id', 'product_name')
            ->orderBy('total_revenue', 'desc')
            ->limit(4)
            ->get()
            ->map(function($item) use ($storeId) {
                $user = Auth::user();
                return [
                    'name' => $item->product_name,
                    'sales' => $item->total_sold,
                    'revenue' => formatStoreCurrency($item->total_revenue, $user->id, $storeId)
                ];
            });
    }

    private function getTopCustomers($storeId)
    {
        return Customer::select('customers.*')
            ->selectRaw('COUNT(orders.id) as order_count')
            ->selectRaw('SUM(orders.total_amount) as total_spent')
            ->leftJoin('orders', 'customers.id', '=', 'orders.customer_id')
            ->where('customers.store_id', $storeId)
            ->groupBy('customers.id')
            ->orderBy('total_spent', 'desc')
            ->limit(4)
            ->get()
            ->map(function($customer) use ($storeId) {
                $user = Auth::user();
                return [
                    'name' => $customer->first_name . ' ' . $customer->last_name,
                    'orders' => $customer->order_count ?: 0,
                    'spent' => formatStoreCurrency($customer->total_spent ?: 0, $user->id, $storeId)
                ];
            });
    }

    private function getRecentActivity($storeId)
    {
        return Order::where('store_id', $storeId)
            ->with('customer')
            ->orderBy('created_at', 'desc')
            ->limit(4)
            ->get()
            ->map(function($order) use ($storeId) {
                $user = Auth::user();
                return [
                    'type' => 'Order',
                    'description' => "New order {$order->order_number} from {$order->customer_first_name} {$order->customer_last_name}",
                    'amount' => formatStoreCurrency($order->total_amount, $user->id, $storeId),
                    'time' => $order->created_at->diffForHumans()
                ];
            });
    }

    private function getRevenueChartData($storeId)
    {
        $isDemo = config('app.is_demo', false);
        
        if ($isDemo) {
            $data = [];
            for ($i = 29; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $revenue = rand(1500, 4500) + (rand(0, 99) / 100);
                $data[] = [
                    'date' => $date->format('M d'),
                    'revenue' => (float) $revenue
                ];
            }
            return collect($data);
        }
        
        return Order::where('store_id', $storeId)
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as revenue')
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function($item) {
                return [
                    'date' => Carbon::parse($item->date)->format('M d'),
                    'revenue' => (float) $item->revenue
                ];
            });
    }

    private function getSalesChartData($storeId)
    {
        $isDemo = config('app.is_demo', false);
        
        if ($isDemo) {
            $data = [];
            for ($i = 29; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $orders = rand(5, 25);
                $data[] = [
                    'date' => $date->format('M d'),
                    'orders' => (int) $orders
                ];
            }
            return collect($data);
        }
        
        return Order::where('store_id', $storeId)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as orders')
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function($item) {
                return [
                    'date' => Carbon::parse($item->date)->format('M d'),
                    'orders' => (int) $item->orders
                ];
            });
    }

    private function getEmptyAnalytics()
    {
        return [
            'metrics' => [
                'revenue' => ['current' => 0, 'change' => 0],
                'orders' => ['current' => 0, 'change' => 0],
                'customers' => ['total' => 0, 'new' => 0],

            ],
            'topProducts' => [],
            'topCustomers' => [],
            'recentActivity' => [],
            'revenueChart' => [],
            'salesChart' => [],
            'orderStatusChart' => [],
            'paymentMethodsChart' => []
        ];
    }
    
    private function getDemoRevenueChart()
    {
        $data = [];
        $baseRevenue = 800;
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $revenue = $baseRevenue + rand(-200, 400) + ($i < 15 ? rand(100, 300) : 0);
            $data[] = [
                'date' => $date->format('M d'),
                'revenue' => (float) $revenue
            ];
        }
        return $data;
    }
    
    private function getDemoSalesChart()
    {
        $data = [];
        $baseOrders = 8;
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $orders = $baseOrders + rand(-3, 7) + ($i < 15 ? rand(2, 5) : 0);
            $data[] = [
                'date' => $date->format('M d'),
                'orders' => max(0, (int) $orders)
            ];
        }
        return $data;
    }
    
    /**
     * Export analytics data as CSV.
     */
    public function export()
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);
        
        if (!$storeId) {
            return response()->json(['error' => 'No store selected'], 400);
        }
        
        $analytics = [
            'metrics' => $this->getKeyMetrics($storeId),
            'topProducts' => $this->getTopProducts($storeId),
            'topCustomers' => $this->getTopCustomers($storeId),
            'revenueChart' => $this->getRevenueChartData($storeId)
        ];
        
        $csvData = [];
        $csvData[] = ['Analytics Export - Store ID: ' . $storeId];
        $csvData[] = ['Generated on: ' . now()->format('Y-m-d H:i:s')];
        $csvData[] = [];
        
        // Key Metrics
        $csvData[] = ['KEY METRICS'];
        $csvData[] = ['Metric', 'Current Value', 'Change'];
        $csvData[] = ['Revenue', formatStoreCurrency($analytics['metrics']['revenue']['current'], $user->id, $storeId), number_format($analytics['metrics']['revenue']['change'], 1) . '%'];
        $csvData[] = ['Orders', $analytics['metrics']['orders']['current'], $analytics['metrics']['orders']['change']];
        $csvData[] = ['Total Customers', $analytics['metrics']['customers']['total'], ''];
        $csvData[] = ['New Customers', $analytics['metrics']['customers']['new'], ''];
        $csvData[] = [];
        
        // Top Products
        $csvData[] = ['TOP PRODUCTS'];
        $csvData[] = ['Product Name', 'Units Sold', 'Revenue'];
        foreach ($analytics['topProducts'] as $product) {
            $csvData[] = [$product['name'], $product['sales'], $product['revenue']];
        }
        $csvData[] = [];
        
        // Top Customers
        $csvData[] = ['TOP CUSTOMERS'];
        $csvData[] = ['Customer Name', 'Orders', 'Total Spent'];
        foreach ($analytics['topCustomers'] as $customer) {
            $csvData[] = [$customer['name'], $customer['orders'], $customer['spent']];
        }
        $csvData[] = [];
        
        // Revenue Chart Data
        $csvData[] = ['DAILY REVENUE (Last 30 Days)'];
        $csvData[] = ['Date', 'Revenue'];
        foreach ($analytics['revenueChart'] as $data) {
            $csvData[] = [$data['date'], formatStoreCurrency($data['revenue'], $user->id, $storeId)];
        }
        
        $filename = 'analytics-export-' . now()->format('Y-m-d') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];
        
        $callback = function() use ($csvData) {
            $file = fopen('php://output', 'w');
            foreach ($csvData as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }
    
    /**
     * Get Order Status Distribution for Pie Chart
     */
    private function getOrderStatusDistribution($storeId)
    {
        try {
            $isDemo = config('app.is_demo', false);
            
            if ($isDemo) {
                return collect([
                    ['status' => 'Shipped', 'count' => 35, 'percentage' => 35.0, 'color' => '#84cc16'],
                    ['status' => 'Delivered', 'count' => 25, 'percentage' => 25.0, 'color' => '#10b77f'],
                    ['status' => 'Processing', 'count' => 18, 'percentage' => 18.0, 'color' => '#8b5cf6'],
                    ['status' => 'Confirmed', 'count' => 12, 'percentage' => 12.0, 'color' => '#3b82f6'],
                    ['status' => 'Pending', 'count' => 7, 'percentage' => 7.0, 'color' => '#f59e0b'],
                    ['status' => 'Cancelled', 'count' => 3, 'percentage' => 3.0, 'color' => '#ef4444']
                ]);
            }
            
            $statusData = Order::where('store_id', $storeId)
                ->selectRaw('status, COUNT(*) as count, (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders WHERE store_id = ?)) as percentage', [$storeId])
                ->groupBy('status')
                ->orderBy('count', 'desc')
                ->get()
                ->map(function($item) {
                    // Clean status names
                    $statusName = ucfirst(str_replace(['_', '-'], ' ', $item->status));
                    
                    // Status colors - Distinct colors for each status
                    $colors = [
                        'shipped' => '#84cc16',     // Lime - In Transit
                        'cancelled' => '#ef4444',   // Red - Negative/Bad
                        'pending' => '#f59e0b',     // Orange - Warning/Waiting
                        'confirmed' => '#3b82f6',   // Blue - Information/Confirmed
                        'processing' => '#8b5cf6',  // Purple - In Progress
                        'delivered' => '#10b77f'    // Green - Final Success
                    ];
                    
                    return [
                        'status' => $statusName,
                        'count' => (int) $item->count,
                        'percentage' => round($item->percentage, 1),
                        'color' => $colors[strtolower($item->status)] ?? '#6b7280'
                    ];
                });
                
            return $statusData;
        } catch (\Exception $e) {
            return [];
        }
    }
    
    /**
     * Get Payment Methods Chart Data (Horizontal Bar Chart)
     */
    private function getPaymentMethodsChart($storeId)
    {
        try {
            $isDemo = config('app.is_demo', false);
            
            if ($isDemo) {
                return collect([
                    ['method' => 'Stripe', 'count' => 65, 'revenue' => 32500.0, 'formatted_revenue' => '$32,500.00'],
                    ['method' => 'PayPal', 'count' => 45, 'revenue' => 22750.0, 'formatted_revenue' => '$22,750.00'],
                    ['method' => 'Bank Transfer', 'count' => 30, 'revenue' => 18900.0, 'formatted_revenue' => '$18,900.00'],
                    ['method' => 'Cash On Delivery', 'count' => 25, 'revenue' => 12500.0, 'formatted_revenue' => '$12,500.00'],
                    ['method' => 'Payfast', 'count' => 20, 'revenue' => 8750.0, 'formatted_revenue' => '$8,750.00']
                ]);
            }
            
            $paymentData = Order::where('store_id', $storeId)
                ->whereNotNull('payment_method')
                ->selectRaw('payment_method, COUNT(*) as count, SUM(total_amount) as revenue')
                ->groupBy('payment_method')
                ->orderBy('revenue', 'desc')
                ->limit(5) // Top 5 payment methods only
                ->get()
                ->map(function($item) use ($storeId) {
                    $user = Auth::user();
                    
                    // Clean payment method names
                    $methodName = ucfirst(str_replace(['_', '-'], ' ', $item->payment_method));
                    if (strtolower($methodName) === 'cod') $methodName = 'Cash on Delivery';
                    
                    return [
                        'method' => $methodName,
                        'count' => (int) $item->count,
                        'revenue' => (float) $item->revenue,
                        'formatted_revenue' => formatStoreCurrency($item->revenue, $user->id, $storeId)
                    ];
                });
                
            return $paymentData;
        } catch (\Exception $e) {
            return [];
        }
    }
}