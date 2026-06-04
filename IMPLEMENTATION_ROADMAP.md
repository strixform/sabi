# SABI Admin - Complete Implementation Roadmap

**Current Date**: June 4, 2026  
**Status**: Ready to Implement  
**Scope**: Enhance existing SABI Admin with Auto-Push, Batching, Real-Time Tracking

---

## Audit Results ✅

**Current State:**
- ✅ SABI Admin exists at `/sabi/admin` (SEPARATE from main site)
- ✅ Admin login at `/sabi/admin/login` (token-based authentication)
- ✅ Dedicated admin dashboard with order management
- ✅ Selection checkboxes for bulk operations already implemented
- ✅ Filtering by status, sorting by date
- ✅ Stats cards showing order metrics
- ✅ Admin authorization checks in place

**What Already Works:**
- Admin can see all SABI orders
- Can select multiple orders (checkboxes)
- Can view order details
- Can see real-time stats

**What We're Adding:**
- Auto-push logic (batch grouping + tasker assignment)
- Batch tracking dashboard
- Real-time progress updates
- Webhook delivery monitoring
- Analytics with charts

---

## Implementation Phases (Very Detailed Steps)

### PHASE 1: Enhance Admin Dashboard UI (2-3 hours)

**Goal**: Add auto-push button and batch selection interface

**Step 1.1**: Update existing admin dashboard (`/src/app/sabi/admin/page.tsx`)

**Changes to make** (line numbers approximate, adjust as needed):
- Add new state variables:
  ```typescript
  const [selectedBatchSize, setSelectedBatchSize] = useState(5);
  const [isPushing, setIsPushing] = useState(false);
  const [pushMessage, setPushMessage] = useState('');
  ```

- Add button in toolbar area (after existing filters):
  ```
  ┌─ Header ─────────────────────────────────┐
  │ SABI Orders Dashboard                    │
  ├─ Stats Cards (Orders, Revenue, etc.) ───┤
  │ ┌─ Filters ────────────────────────────┐ │
  │ │ [Status ▼] [Service ▼] [Date Range] │ │
  │ └─────────────────────────────────────┘ │
  │ ┌─ Toolbar ────────────────────────────┐ │
  │ │ [Select All ☑] [5 of 10 selected]    │ │
  │ │ Batch Size: [5 ▼]                    │ │
  │ │ [AUTO-PUSH TO TASKERS] [Clear] │ │
  │ └─────────────────────────────────────┘ │
  └─────────────────────────────────────────┘
  ```

- Add visual feedback:
  - Success message: "✅ 2 batches pushed to 10 taskers"
  - Error message: "❌ Failed: Not enough taskers available"
  - Loading state: "⏳ Pushing to taskers..."

**Step 1.2**: Add batch size selector dropdown
- Allow admin to choose: 3, 5, 10 orders per batch
- Default to 5 (as per your requirement)
- Show total batches that will be created
  ```
  5 orders selected, batch size 5 = 1 batch
  15 orders selected, batch size 5 = 3 batches
  ```

**Step 1.3**: Add progress visualization
- When pushing orders, show:
  ```
  Pushing... [████████░░] 80%
  Batch 1: Assigned to salty_igblnovia (5 orders)
  Batch 2: Assigned to Diamond_48 (5 orders)
  Batch 3: Assigned to Carlos Jeff (5 orders)
  ```

**Files to modify:**
- `src/app/sabi/admin/page.tsx` - Add UI components and handlers

---

### PHASE 2: Create Auto-Push API Logic (3-4 hours)

**Goal**: Implement backend logic to batch orders and assign to taskers

**Step 2.1**: Create new file `src/app/api/sabi/admin/auto-push/route.ts`

**Logic flow:**
```
POST /api/sabi/admin/auto-push
├─ Input: { orderIds: ["id1", "id2", "id3", "id4", "id5"], batchSize: 5 }
├─ Step 1: Validate all orders exist
├─ Step 2: Group orders into batches (5 per batch)
│  └─ Batch 1: [order1, order2, order3, order4, order5]
│  └─ Batch 2: [order6, order7, order8, order9, order10]
├─ Step 3: For each batch:
│  ├─ Find available taskers with matching skills
│  │  └─ Filter: rating >= 3.5, active, not overloaded
│  ├─ Assign all 5 orders in batch to ONE tasker
│  ├─ Create SABIOrderBatch record in database
│  ├─ Create TaskCompletion records (5 records, 1 per order)
│  ├─ Set campaign status to "live"
│  └─ Send notification to tasker
├─ Step 4: Return results
└─ Output: { success: true, batches: 2, totalTaskers: 2, message: "..." }
```

**Code structure:**
```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderIds, batchSize = 5 } = body;

    // 1. Validate orders
    const orders = await prisma.campaign.findMany({
      where: { id: { in: orderIds } }
    });
    
    if (orders.length !== orderIds.length) {
      return NextResponse.json({ error: "Some orders not found" }, { status: 400 });
    }

    // 2. Group into batches
    const batches = [];
    for (let i = 0; i < orders.length; i += batchSize) {
      batches.push(orders.slice(i, i + batchSize));
    }

    // 3. Assign each batch to tasker
    const results = [];
    for (const batch of batches) {
      const tasker = await findAvailableTasker(batch[0].serviceType);
      
      if (!tasker) {
        return NextResponse.json({ 
          error: `No available tasker for ${batch[0].serviceType}` 
        }, { status: 400 });
      }

      // Create batch record
      const batchRecord = await prisma.sABIOrderBatch.create({
        data: {
          orderIds: batch.map(o => o.id),
          assignedTaskerId: tasker.id,
          totalCount: batch.length,
          status: "active"
        }
      });

      // Update each campaign
      for (const order of batch) {
        await prisma.campaign.update({
          where: { id: order.id },
          data: { status: "live" }
        });
        
        // Create TaskCompletion record
        await prisma.taskCompletion.create({
          data: {
            campaignId: order.id,
            userId: tasker.id,
            status: "pending"
          }
        });
      }

      results.push({
        batchId: batchRecord.id,
        taskerId: tasker.id,
        taskerName: tasker.username,
        orderCount: batch.length
      });
    }

    return NextResponse.json({
      success: true,
      batches: batches.length,
      taskers: results.length,
      results: results,
      message: `Pushed ${orders.length} orders to ${results.length} tasker(s)`
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to push orders" }, { status: 500 });
  }
}
```

**Files to create:**
- `src/app/api/sabi/admin/auto-push/route.ts` - Auto-push endpoint

**Database schema update needed:**
- Add `SABIOrderBatch` table (see Phase 4)

---

### PHASE 3: Add Batch Tracking Dashboard (2-3 hours)

**Goal**: Create new page to monitor active batches in real-time

**Step 3.1**: Create new file `src/app/sabi/admin/batches/page.tsx`

**Page features:**
```
┌─ SABI Order Batches ─────────────────────────────────────┐
├─ Filters: [Status ▼] [Tasker ▼] [Sort ▼] [Refresh]     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Batch #1 (5 orders, created 10min ago)                  │
│ ├─ Tasker: salty_igblnovia (Rating: 4.8 ⭐)           │
│ ├─ Status: 3/5 COMPLETE (60%)                          │
│ ├─ Progress: [███████░░░░░░░░░] 60%                    │
│ ├─ Service: Followers (100, 50, 100, 75, 200 qty)      │
│ ├─ Budget: ₦25,000 total                               │
│ └─ Time Remaining: 1h 50m (expires in 48h)             │
│                                                          │
│ Batch #2 (3 orders, created 5min ago)                   │
│ ├─ Tasker: Diamond_48 (Rating: 4.2 ⭐)                 │
│ ├─ Status: 1/3 COMPLETE (33%)                          │
│ ├─ Progress: [████░░░░░░░░░░░░░] 33%                  │
│ ├─ Service: Likes, Comments, Likes                      │
│ └─ Budget: ₦12,500 total                               │
│                                                          │
│ ☑ Batch #3 (0 orders) — No active batches right now    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Interactive features:**
- Click batch to expand and see all 5 orders in detail
- See which orders are complete (with checkmarks)
- Click "Cancel Batch" to reassign if needed
- Real-time updates every 5 seconds

**Code structure:**
```typescript
'use client';

import React, { useState, useEffect } from 'react';

interface Batch {
  id: string;
  taskerId: string;
  taskerName: string;
  orderCount: number;
  completedCount: number;
  status: string; // active, completed, failed
  createdAt: string;
  expiresAt: string;
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch batches on load
  useEffect(() => {
    fetchBatches();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchBatches, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/sabi/admin/batches');
      const data = await res.json();
      setBatches(data.batches || []);
    } catch (error) {
      console.error('Failed to fetch batches', error);
    }
  };

  return (
    <div>
      {/* Header and filters */}
      <h1>Active Order Batches</h1>
      
      {/* Batch list */}
      {batches.map(batch => (
        <BatchCard key={batch.id} batch={batch} />
      ))}
    </div>
  );
}
```

**Files to create:**
- `src/app/sabi/admin/batches/page.tsx` - Batch tracking dashboard
- `src/app/api/sabi/admin/batches/route.ts` - Get active batches

---

### PHASE 4: Add Database Schema (1 hour)

**Step 4.1**: Update `prisma/schema.prisma`

**Add new tables:**

```prisma
// 1. SABI Order Batches
model SABIOrderBatch {
  id: String @id @default(cuid())
  
  // Batch info
  batchNumber: Int
  orderIds: String[] // Array of campaign IDs
  
  // Assigned tasker
  assignedTaskerId: String
  tasker: User @relation("SABIOrderBatchTasker", fields: [assignedTaskerId], references: [id])
  
  // Progress tracking
  completedCount: Int @default(0)
  totalCount: Int
  status: String @default("active") // active, completed, failed
  
  // Timeline
  createdAt: DateTime @default(now())
  completedAt: DateTime?
  expiresAt: DateTime // 48 hours from creation
  
  @@index([assignedTaskerId])
  @@index([status])
  @@index([createdAt])
}

// 2. Enhance existing WebhookLog (add fields for SABI)
// Modify existing WebhookLog model to add:
// sabi_order_id: String? // Reference to SABI order ID
// delivery_attempts: Int @default(0)
// last_attempt_at: DateTime?
// next_retry_at: DateTime?
// status: String @default("pending") // delivered, failed, pending, retrying
```

**Migration steps:**
```bash
npx prisma migrate dev --name add_sabi_order_batch
```

**Files to modify:**
- `prisma/schema.prisma` - Add SABIOrderBatch model

---

### PHASE 5: Add Webhook Monitoring (2-3 hours)

**Goal**: Let admin see if SABI got completion notifications

**Step 5.1**: Create `src/app/sabi/admin/webhooks/page.tsx`

**Page features:**
```
┌─ Webhook Delivery Log ───────────────────────────────────┐
├─ Filters: [Status ▼] [Date Range ▼] [Order ID]         │
├──────────────────────────────────────────────────────────┤
│ Order ID      │ Status   │ Attempts │ Last Try │ Action │
│───────────────┼──────────┼──────────┼──────────┼────────┤
│ order-id-001  │ ✓ Delivered│ 1    │ 2m ago  │ ----  │
│ order-id-002  │ ✓ Delivered│ 1    │ 1m ago  │ ----  │
│ order-id-003  │ ✕ Failed│ 3    │ 30s ago │ Retry │
│ order-id-004  │ ⏳ Retrying│ 2    │ Next: 5m│ ----  │
│ order-id-005  │ ⏳ Pending│ 0    │ Waiting │ ----  │
│───────────────┴──────────┴──────────┴──────────┴────────┤
│ Showing 1-5 of 245 | [< 1 2 3 4 5 >]                   │
└──────────────────────────────────────────────────────────┘
```

**Features:**
- See all webhook delivery attempts
- Status: Delivered ✓, Failed ✗, Pending ⏳, Retrying ↻
- Manual retry button for failed webhooks
- Filter by status and date
- Pagination

**Code structure:**
```typescript
'use client';

import React, { useState, useEffect } from 'react';

interface WebhookLog {
  id: string;
  orderId: string;
  status: string; // delivered, failed, pending, retrying
  deliveryAttempts: number;
  lastAttemptAt: string;
  nextRetryAt: string;
}

export default function WebhooksPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/sabi/admin/webhooks?page=${page}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch webhooks', error);
    }
  };

  const retryWebhook = async (logId: string) => {
    try {
      const res = await fetch('/api/sabi/admin/webhooks/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId })
      });
      const data = await res.json();
      if (data.success) {
        fetchLogs(); // Refresh
      }
    } catch (error) {
      console.error('Failed to retry webhook', error);
    }
  };

  return (
    <div>
      {/* Header and filters */}
      <h1>Webhook Delivery Log</h1>
      
      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Status</th>
            <th>Attempts</th>
            <th>Last Try</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{log.orderId}</td>
              <td>{log.status}</td>
              <td>{log.deliveryAttempts}</td>
              <td>{log.lastAttemptAt}</td>
              <td>
                {log.status === 'failed' && (
                  <button onClick={() => retryWebhook(log.id)}>Retry</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Files to create:**
- `src/app/sabi/admin/webhooks/page.tsx` - Webhook log viewer
- `src/app/api/sabi/admin/webhooks/route.ts` - Get webhook logs
- `src/app/api/sabi/admin/webhooks/retry/route.ts` - Retry failed webhooks

---

### PHASE 6: Add Analytics Dashboard (2-3 hours)

**Goal**: Show stats and trends

**Step 6.1**: Create `src/app/sabi/admin/analytics/page.tsx`

**Page features:**
```
┌─ Analytics & Reports ──────────────────────────────────┐
├─ Stats Cards ──────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ │ 45       │ │ 38       │ │ 25       │ │ ₦112,500 │  │
│ │ Orders   │ │ Completed│ │ Batches  │ │ Revenue  │  │
│ │ Today    │ │ Today    │ │ Active   │ │ (Today)  │  │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                        │
├─ Charts ──────────────────────────────────────────────┤
│                                                        │
│ Orders Over Time (Last 7 Days)                        │
│ ┌────────────────────────────────────────────────┐   │
│ │                            ╱╲                 │   │
│ │               ╱╲          ╱  ╲                │   │
│ │              ╱  ╲  ╱╲    ╱    ╲   ╱          │   │
│ │             ╱    ╲╱  ╲  ╱      ╲╱            │   │
│ │ 0 └─────────────────────────────────────────  │   │
│ │   Mon  Tue  Wed  Thu  Fri  Sat  Sun         │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ Service Distribution (Pie Chart)                      │
│       Followers                                        │
│      ╱         ╲                                       │
│     │   35%     │ Followers                           │
│      ╲         ╱                                       │
│       └─────────   Likes (30%)                        │
│            ┌──────────────┐                           │
│            │   Comments   │ Comments (20%)            │
│            │   15% (other)│                           │
│            └──────────────┘                           │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Files to create:**
- `src/app/sabi/admin/analytics/page.tsx` - Analytics dashboard
- `src/app/api/sabi/admin/analytics/route.ts` - Get analytics data

---

### PHASE 7: Create API Endpoints (2 hours)

**New endpoints needed:**

**1. `POST /api/sabi/admin/auto-push`**
   - Push selected orders to taskers in batches
   - Input: { orderIds: [...], batchSize: 5 }
   - Output: { success, batches, results }

**2. `GET /api/sabi/admin/batches`**
   - Get all active batches
   - Output: { batches: [...] with progress }

**3. `GET /api/sabi/admin/webhooks`**
   - Get webhook delivery logs
   - Query: page, status, dateRange
   - Output: { logs: [...], total, pagination }

**4. `POST /api/sabi/admin/webhooks/retry`**
   - Retry failed webhook delivery
   - Input: { logId: string }
   - Output: { success, message }

**5. `GET /api/sabi/admin/analytics`**
   - Get analytics data
   - Output: { stats, orders_over_time, service_distribution }

**Files to create:**
- `src/app/api/sabi/admin/auto-push/route.ts`
- `src/app/api/sabi/admin/batches/route.ts`
- `src/app/api/sabi/admin/webhooks/route.ts`
- `src/app/api/sabi/admin/webhooks/retry/route.ts`
- `src/app/api/sabi/admin/analytics/route.ts`

---

## Daily Workflow (How It Works End-to-End)

```
STEP-BY-STEP USER JOURNEY:

1. Admin logs in
   └─ Go to https://sability.io/sabi/admin/login
   └─ Enter admin token
   └─ Redirected to /sabi/admin dashboard

2. Dashboard shows incoming SABI orders
   └─ Orders appear automatically (updated every 5 seconds)
   └─ 45 new orders today waiting to be pushed

3. Admin selects orders in bulk
   └─ Check boxes: 5 orders, 5 orders, 5 orders (15 total)
   └─ Or use "Select All" to select all pending orders
   └─ Set batch size: 5 (to make batches of 5 orders each)

4. Admin clicks "AUTO-PUSH TO TASKERS"
   └─ System shows: "Pushing... [████████░░] 80%"
   └─ Creates batches:
      ├─ Batch 1: 5 orders → Assigned to salty_igblnovia
      ├─ Batch 2: 5 orders → Assigned to Diamond_48
      └─ Batch 3: 5 orders → Assigned to Carlos Jeff
   └─ Message: "✅ 3 batches (15 orders) pushed to 3 taskers"

5. Admin monitors progress on "Batches" page
   └─ Go to /sabi/admin/batches
   └─ See real-time progress:
      ├─ Batch 1: 2/5 complete (40%)
      ├─ Batch 2: 5/5 complete (100%) ✓ DONE
      └─ Batch 3: 1/5 complete (20%)
   └─ Dashboard auto-updates every 5 seconds

6. When tasker completes all 5 orders in batch
   └─ Batch marked as "completed"
   └─ Tasker gets paid (5 points/payment)
   └─ System sends webhook to SABI
   └─ SABI user's order shows "completed" ✓

7. Admin checks webhook delivery on "Webhooks" page
   └─ Go to /sabi/admin/webhooks
   └─ See: "Order-001: ✓ Delivered (1 attempt)"
   └─ If failed, click "Retry" button to resend

8. Admin views analytics on "Analytics" page
   └─ Go to /sabi/admin/analytics
   └─ See: 45 orders today, 38 completed, ₦112,500 revenue
   └─ View charts: Orders over time, service distribution

```

---

## Implementation Checklist

### Database & Backend
- [ ] Phase 1: Update admin dashboard UI (2-3 hours)
- [ ] Phase 2: Create auto-push API logic (3-4 hours)
- [ ] Phase 3: Add batch tracking dashboard (2-3 hours)
- [ ] Phase 4: Update database schema (1 hour)
- [ ] Phase 5: Add webhook monitoring (2-3 hours)
- [ ] Phase 6: Add analytics dashboard (2-3 hours)
- [ ] Phase 7: Create all API endpoints (2 hours)

### Testing
- [ ] Test auto-push: Select 5 orders → Click button → See batch created
- [ ] Test batching: Select 15 orders → See 3 batches created (5 each)
- [ ] Test real-time: Watch dashboard update as taskers complete orders
- [ ] Test webhooks: Verify SABI receives completion notifications
- [ ] Test retry: Manually retry failed webhook delivery
- [ ] Test analytics: Verify numbers match actual data

### Deployment
- [ ] Commit all changes to git
- [ ] Push to GitHub
- [ ] Vercel auto-deploys
- [ ] Test in production: https://sability.io/sabi/admin

---

## Success Criteria

✅ Admin can push 50 orders in under 2 minutes (bulk operations)
✅ Orders grouped into batches of 5 automatically
✅ Taskers assigned intelligently (round-robin or by rating)
✅ Dashboard updates in real-time as taskers work
✅ SABI user's order shows "completed" after tasker finishes batch
✅ Admin can see webhook delivery status
✅ Analytics show correct stats (orders/day, revenue/day, completion %)

---

## Next Steps

Ready to start implementing Phase 1? Let me know and I'll:

1. Update the existing admin dashboard with auto-push UI
2. Create the auto-push API endpoint
3. Add database schema for batches
4. Build batch tracking dashboard
5. Add webhook monitoring
6. Add analytics
7. Test end-to-end

**Estimated Total Time: 5 days, full-time implementation**

---

**Questions before we start:**
1. Should batch size always be 5, or should admin be able to change it?
2. Should taskers be assigned round-robin or by availability/rating?
3. If a tasker doesn't complete batch in 48 hours, should we auto-reassign?
4. Any specific UI design preferences? (colors, layout, etc.)
