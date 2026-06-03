import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { verifyResellerToken } from '@/lib/resellerAuth';

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyResellerToken();

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const prisma = getPrismaClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch reseller
    const reseller = await prisma.reseller.findUnique({
      where: { id: payload.resellerId },
    });

    if (!reseller) {
      return NextResponse.json(
        { error: 'Reseller not found' },
        { status: 404 }
      );
    }

    // Fetch invoices
    const [invoices, totalInvoices] = await Promise.all([
      prisma.resellerBilling.findMany({
        where: { resellerId: payload.resellerId },
        orderBy: { billingMonth: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.resellerBilling.count({
        where: { resellerId: payload.resellerId },
      }),
    ]);

    // Calculate current balance
    const totalPaid = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.amountPaid, 0);

    const totalDue = invoices
      .filter(i => i.status === 'pending' || i.status === 'overdue')
      .reduce((sum, i) => sum + (i.totalAmount - i.amountPaid), 0);

    // Get current month invoice
    const currentDate = new Date();
    const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    const currentInvoice = invoices.find(i => i.billingMonth.startsWith(currentMonthKey));

    return NextResponse.json({
      success: true,
      reseller: {
        businessName: reseller.businessName,
        businessEmail: reseller.businessEmail,
        paymentMethod: reseller.paymentMethod,
      },
      billing: {
        totalPaid,
        totalDue,
        currentBalance: totalPaid - totalDue,
        nextDueDate: currentInvoice?.dueDate || null,
      },
      invoices,
      pagination: {
        total: totalInvoices,
        limit,
        offset,
        pages: Math.ceil(totalInvoices / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching billing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing information' },
      { status: 500 }
    );
  }
}
