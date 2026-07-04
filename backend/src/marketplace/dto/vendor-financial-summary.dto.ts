import { ApiProperty } from '@nestjs/swagger';

export class CustomerSpendingSummary {
  @ApiProperty({ description: 'Customer name' })
  customerName!: string;

  @ApiProperty({ description: 'Total amount spent by customer' })
  totalSpent!: number;

  @ApiProperty({ description: 'Number of orders placed by customer' })
  orderCount!: number;
}

export class ProductPerformanceSummary {
  @ApiProperty({ description: 'Name of the product' })
  productName!: string;

  @ApiProperty({ description: 'Total quantity sold' })
  totalQuantitySold!: number;

  @ApiProperty({ description: 'Total revenue from this product' })
  totalRevenue!: number;
}

export class InvoiceData {
  @ApiProperty({ description: 'Vendor information for the invoice' })
  vendorInfo!: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };

  @ApiProperty({ description: 'Period covered by the invoice' })
  period!: {
    start: Date;
    end: Date;
  };

  @ApiProperty({ description: 'Total amount for the invoice' })
  totalAmount!: number;

  @ApiProperty({ description: 'Due date for the invoice', type: Date })
  dueDate!: Date;

  @ApiProperty({ description: 'Invoice number' })
  invoiceNumber!: string;
}

export class VendorFinancialSummaryDto {
  @ApiProperty({ description: 'Month and year for the summary' })
  month!: string;

  @ApiProperty({ description: 'Offset in months from current month' })
  monthOffset!: number;

  @ApiProperty({ description: 'Gross revenue for the period' })
  grossRevenue!: number;

  @ApiProperty({ description: 'Platform commission deducted' })
  platformCommission!: number;

  @ApiProperty({ description: 'Net earnings after commission' })
  netEarnings!: number;

  @ApiProperty({ description: 'Total number of orders completed' })
  totalOrders!: number;

  @ApiProperty({
    type: [CustomerSpendingSummary],
    description: 'Spending breakdown by customer',
  })
  customerSpending!: CustomerSpendingSummary[];

  @ApiProperty({
    type: [ProductPerformanceSummary],
    description: 'Performance breakdown by product',
  })
  topProducts!: ProductPerformanceSummary[];

  @ApiProperty({
    description: 'Transaction history for the period',
  })
  transactionHistory!: any[]; // Using any for now, could be typed more specifically

  @ApiProperty({
    description: 'Withdrawal requests for the period',
  })
  withdrawalRequests!: any[]; // Using any for now, could be typed more specifically

  @ApiProperty({
    type: InvoiceData,
    description: 'Invoice data for the period',
  })
  invoiceData!: InvoiceData;
}
