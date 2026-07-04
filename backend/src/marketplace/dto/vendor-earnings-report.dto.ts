import { ApiProperty } from '@nestjs/swagger';

export class ProductSalesSummary {
  @ApiProperty({ description: 'Name of the product' })
  productName!: string;

  @ApiProperty({ description: 'Total quantity sold' })
  totalQuantity!: number;

  @ApiProperty({ description: 'Total revenue from this product' })
  totalRevenue!: number;
}

export class VendorEarningsReportDto {
  @ApiProperty({
    description: 'Time period for the report',
    enum: ['today', 'week', 'month', 'year', 'all_time'],
    required: false,
  })
  period?: 'today' | 'week' | 'month' | 'year' | 'all_time';

  @ApiProperty({ description: 'Total gross revenue from orders' })
  totalGrossRevenue!: number;

  @ApiProperty({ description: 'Total platform commission deducted' })
  totalPlatformCommission!: number;

  @ApiProperty({ description: 'Total net earnings after commission' })
  totalNetEarnings!: number;

  @ApiProperty({ description: 'Total number of orders completed' })
  totalOrders!: number;

  @ApiProperty({
    type: [ProductSalesSummary],
    description: 'Sales breakdown by product',
  })
  productBreakdown!: ProductSalesSummary[];

  @ApiProperty({ description: 'Amount currently held in escrow' })
  pendingInEscrow!: number;

  @ApiProperty({ description: 'Amount available for withdrawal' })
  availableForWithdrawal!: number;

  @ApiProperty({ description: 'Total amount paid out' })
  paidOutAmount!: number;

  @ApiProperty({
    description: 'Date when vendor is next eligible for payout',
    type: Date,
  })
  nextPayoutEligibility!: Date;
}
