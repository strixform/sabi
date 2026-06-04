import { NextRequest, NextResponse } from 'next/server';
import { getSabiSession } from '@/lib/sabiAuth';
import { prisma } from '@/lib/prisma';

interface DistributionRequest {
  orderIds: string[];
  taskerIds?: string[];
}

interface Tasker {
  id: string;
  name: string;
  username: string;
  currentLoad: number;
  maxCapacity: number;
  specializations: string[];
  pointsPerTask: number;
}

// Map service types to task types that taskers expect
const SERVICE_TO_TASK_TYPE: Record<string, string[]> = {
  followers: ['instagram_followers', 'twitter_followers', 'tiktok_followers', 'youtube_subscribers', 'spotify_followers'],
  likes: ['instagram_likes', 'twitter_likes', 'youtube_likes', 'tiktok_likes', 'pinterest_likes'],
  comments: ['instagram_comments', 'twitter_comments', 'youtube_comments', 'tiktok_comments'],
  views: ['youtube_views', 'tiktok_views', 'instagram_views', 'twitter_views'],
  engagement: ['instagram_engagement', 'twitter_engagement', 'youtube_engagement', 'tiktok_engagement'],
  shares: ['twitter_shares', 'instagram_shares', 'tiktok_shares'],
  retweets: ['twitter_retweets'],
  subscribers: ['youtube_subscribers', 'spotify_followers'],
  saves: ['instagram_saves', 'pinterest_saves'],
};

// Find best tasker for a service type
function findBestTasker(
  serviceType: string,
  taskers: Tasker[],
  usedTaskers: Set<string>
): Tasker | null {
  const taskTypes = SERVICE_TO_TASK_TYPE[serviceType.toLowerCase()] || [];

  // Filter taskers who:
  // 1. Have capacity
  // 2. Specialize in this service
  // 3. Haven't been assigned too many tasks in this batch
  const availableTaskers = taskers.filter(tasker => {
    const hasCapacity = tasker.currentLoad < tasker.maxCapacity;
    const hasSpecialization = taskTypes.some(tt => tasker.specializations.includes(tt));
    const assignmentCount = Array.from(usedTaskers).filter(id => id === tasker.id).length;
    const notOverAssigned = assignmentCount < 3; // Max 3 tasks per tasker in single batch

    return hasCapacity && (hasSpecialization || hasCapacity) && notOverAssigned;
  });

  if (availableTaskers.length === 0) return null;

  // Sort by: specialization match (first), then by current load (ascending)
  availableTaskers.sort((a, b) => {
    const aHasSpecialization = taskTypes.some(tt => a.specializations.includes(tt)) ? 0 : 1;
    const bHasSpecialization = taskTypes.some(tt => b.specializations.includes(tt)) ? 0 : 1;

    if (aHasSpecialization !== bHasSpecialization) {
      return aHasSpecialization - bHasSpecialization;
    }

    return a.currentLoad - b.currentLoad;
  });

  return availableTaskers[0];
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSabiSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: DistributionRequest = await req.json();
    const { orderIds } = body;

    if (!orderIds || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'No orders selected' },
        { status: 400 }
      );
    }

    // Fetch orders
    const orders = await prisma.sabiOrder.findMany({
      where: { id: { in: orderIds } },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'No valid orders found' },
        { status: 404 }
      );
    }

    // Fetch taskers from gamerz360
    const gamerz360AdminApiUrl = process.env.GAMERZ360_ADMIN_API_URL || 'https://ads.gamerz360.com/api';
    const gamerz360AdminToken = process.env.GAMERZ360_ADMIN_TOKEN;

    let taskers: Tasker[] = [];
    try {
      const taskerRes = await fetch(`${gamerz360AdminApiUrl}/taskers?status=active`, {
        headers: {
          'Authorization': `Bearer ${gamerz360AdminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (taskerRes.ok) {
        const data = await taskerRes.json();
        taskers = data.taskers || [];
      }
    } catch (err) {
      console.error('Error fetching taskers:', err);
      return NextResponse.json(
        { error: 'Could not fetch taskers from gamerz360' },
        { status: 500 }
      );
    }

    if (taskers.length === 0) {
      return NextResponse.json(
        { error: 'No taskers available' },
        { status: 400 }
      );
    }

    // Distribute orders to taskers intelligently
    const tasksToCreate: Array<{
      orderId: string;
      taskerId: string;
      serviceType: string;
      quantity: number;
      targetUrl: string;
      points: number;
    }> = [];

    const usedTaskers = new Set<string>();

    for (const order of orders) {
      const tasker = findBestTasker(order.serviceType, taskers, usedTaskers);

      if (!tasker) {
        console.warn(`No available tasker for order ${order.id} (${order.serviceType})`);
        continue;
      }

      // Track tasker usage
      usedTaskers.add(tasker.id);

      // Calculate points based on quantity and tasker's base points
      const points = Math.ceil((order.quantity / 100) * tasker.pointsPerTask);

      tasksToCreate.push({
        orderId: order.id,
        taskerId: tasker.id,
        serviceType: order.serviceType,
        quantity: order.quantity,
        targetUrl: order.targetUrl,
        points,
      });

      // Update tasker's current load (locally for this batch)
      tasker.currentLoad += 1;
    }

    if (tasksToCreate.length === 0) {
      return NextResponse.json(
        { error: 'Could not assign any tasks to taskers' },
        { status: 400 }
      );
    }

    // Push tasks to gamerz360
    const pushResults = await Promise.allSettled(
      tasksToCreate.map(async (task) => {
        try {
          const pushRes = await fetch(`${gamerz360AdminApiUrl}/tasks/assign`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${gamerz360AdminToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              taskerId: task.taskerId,
              serviceType: task.serviceType,
              quantity: task.quantity,
              targetUrl: task.targetUrl,
              points: task.points,
              sourceOrderId: task.orderId,
            }),
          });

          if (!pushRes.ok) {
            throw new Error(`Failed to push task: ${pushRes.statusText}`);
          }

          const data = await pushRes.json();
          return {
            ...task,
            taskCreatedId: data.taskId,
            success: true,
          };
        } catch (err) {
          console.error(`Error pushing task for order ${task.orderId}:`, err);
          return {
            ...task,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          };
        }
      })
    );

    // Update orders in database to "processing"
    const successfulTasks = pushResults
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && (result.value as any).success)
      .map((result) => (result.value as any).orderId);

    if (successfulTasks.length > 0) {
      await prisma.sabiOrder.updateMany({
        where: { id: { in: successfulTasks } },
        data: { status: 'processing' },
      });
    }

    // Group assigned tasks by tasker for response
    const taskersAssigned = new Set(tasksToCreate.map(t => t.taskerId)).size;

    return NextResponse.json({
      success: true,
      tasksCreated: successfulTasks.length,
      tasksFailed: tasksToCreate.length - successfulTasks.length,
      taskersAssigned,
      totalOrders: orders.length,
      message: `Pushed ${successfulTasks.length}/${tasksToCreate.length} tasks to ${taskersAssigned} taskers`,
    });
  } catch (error) {
    console.error('Push to taskers error:', error);
    return NextResponse.json(
      { error: 'Failed to distribute tasks' },
      { status: 500 }
    );
  }
}
