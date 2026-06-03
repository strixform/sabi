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

    // Find reseller's site
    const site = await prisma.resellerSite.findFirst({
      where: { resellerId: payload.resellerId },
    });

    if (!site) {
      return NextResponse.json(
        { error: 'No site found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      site,
    });
  } catch (error) {
    console.error('Error fetching site:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await verifyResellerToken();

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const prisma = getPrismaClient();
    const body = await request.json();

    // Find reseller's site
    const site = await prisma.resellerSite.findFirst({
      where: { resellerId: payload.resellerId },
    });

    if (!site) {
      return NextResponse.json(
        { error: 'No site found' },
        { status: 404 }
      );
    }

    // Validate input
    const updateData: any = {};

    if (body.siteName) updateData.siteName = body.siteName;
    if (body.customDomain) updateData.customDomain = body.customDomain;
    if (body.primaryColor) updateData.primaryColor = body.primaryColor;
    if (body.secondaryColor) updateData.secondaryColor = body.secondaryColor;
    if (body.accentColor) updateData.accentColor = body.accentColor;
    if (body.heroTitle) updateData.heroTitle = body.heroTitle;
    if (body.heroSubtitle) updateData.heroSubtitle = body.heroSubtitle;
    if (body.aboutSection) updateData.aboutSection = body.aboutSection;
    if (body.logoUrl) updateData.logoUrl = body.logoUrl;

    // Update site
    const updatedSite = await prisma.resellerSite.update({
      where: { id: site.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Site updated successfully',
      site: updatedSite,
    });
  } catch (error) {
    console.error('Error updating site:', error);
    return NextResponse.json(
      { error: 'Failed to update site' },
      { status: 500 }
    );
  }
}
