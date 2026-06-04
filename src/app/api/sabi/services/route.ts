import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { SERVICES_CATALOG, getServicesByCategory, getCategoriesWithServices, getPlatformLabel } from '@/lib/servicesCatalog';

export async function GET(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const action = searchParams.get('action');

    let services = [...SERVICES_CATALOG];

    // Filter by category if provided
    if (category) {
      services = getServicesByCategory(category);
    }

    // Filter by action if provided
    if (action) {
      services = services.filter(s => s.action.toLowerCase() === action.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      services,
      count: services.length,
    });
  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// Get available categories
export async function POST(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    const categories = getCategoriesWithServices();
    const categoryList = Array.from(categories.entries()).map(([key, services]) => ({
      platform: key,
      label: getPlatformLabel(key),
      serviceCount: services.length,
      actions: [...new Set(services.map(s => s.action))],
      services: action ? services.filter(s => s.action === action) : services,
    }));

    return NextResponse.json({
      success: true,
      categories: categoryList,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
