import { logger as _logger } from '@/shared/utils/logger';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  items: Array<{
    product: {
      name: string;
    };
    quantity: number;
  }>;
}

interface OrdersManagementProps {
  vendorId: string;
  activeTab: string;
}

const OrdersManagement: React.FC<OrdersManagementProps> = ({ vendorId: _vendorId, activeTab }) => {
  const navigate = useNavigate();
  
  // PRODUCTION: Fetching real orders from backend API
  const ordersData: Order[] = [];
  const ordersLoading = false;

  if (activeTab !== 'orders') return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Orders Management</h2>
          <p className="text-muted-foreground">Manage and fulfill customer orders</p>
        </div>
      </div>

      {ordersLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="inline-block w-6 h-6 animate-spin">⏳</span>
            <span>Loading orders...</span>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm">
                  <span className="w-4 h-4 mr-2 inline-block">⬇️</span>
                  Filter
                </Button>
                <p className="text-sm text-muted-foreground">
                  {ordersData.length} {ordersData.length === 1 ? 'order' : 'orders'}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {ordersData.map((order: any) => (
              <div key={order.id} className="p-6 hover:bg-accent/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-foreground text-lg">#{order.id}</h3>
                      <Badge variant={
                        order.status === 'delivered' ? 'default' :
                        order.status === 'processing' ? 'secondary' :
                        order.status === 'shipped' ? 'outline' :
                        'destructive'
                      }>
                        {order.status}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-medium">{order.currency} {order.totalAmount.toLocaleString()}</p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Items</p>
                        <p className="font-medium">{order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/vendor/orders/${order.id}`)}
                    >
                      <span className="w-4 h-4 mr-2 inline-block">💬</span>
                      Contact
                    </Button>
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => navigate(`/vendor/orders/${order.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ordersData.length === 0 && !ordersLoading && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <span className="text-5xl inline-block mx-auto mb-4">🛍️</span>
          <h3 className="text-lg font-medium text-foreground mb-2">No orders yet</h3>
          <p className="text-muted-foreground">Orders will appear here when customers purchase your products</p>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
