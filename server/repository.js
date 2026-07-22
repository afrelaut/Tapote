import { randomUUID } from "node:crypto";
import pg from "pg";

const { Pool } = pg;

class DevelopmentRepository {
  durable = false;
  orders = new Map();
  leads = new Map();
  uploads = new Map();
  pilotLinks = new Map();
  tapEvents = [];
  stripeEvents = new Set();
  outbox = [];

  async healthCheck() {
    return true;
  }

  async createPendingOrder(order) {
    const existing = this.orders.get(order.orderToken);
    if (existing) return { ...existing, existing: true };
    const record = { id: randomUUID(), status: "pending", stripeSessionId: null, ...order };
    this.orders.set(order.orderToken, record);
    return { ...record, existing: false };
  }

  async getOrderByToken(orderToken) {
    return this.orders.get(orderToken) || null;
  }

  async attachStripeSession(orderToken, stripeSessionId, paymentIntentId = null) {
    const order = this.orders.get(orderToken);
    if (!order) return null;
    order.stripeSessionId = stripeSessionId;
    order.paymentIntentId = paymentIntentId;
    return order;
  }

  async markDemoOrder(orderToken, sessionId) {
    const order = await this.attachStripeSession(orderToken, sessionId);
    if (order) order.status = "demo";
    return order;
  }

  async getOrderBySession(sessionId) {
    return [...this.orders.values()].find((order) => order.stripeSessionId === sessionId) || null;
  }

  async recordStripeEvent(event) {
    if (this.stripeEvents.has(event.eventId)) return { duplicate: true, order: null };
    this.stripeEvents.add(event.eventId);
    const order = [...this.orders.values()].find((entry) => (
      (event.orderToken && entry.orderToken === event.orderToken)
      || (event.sessionId && entry.stripeSessionId === event.sessionId)
      || (event.paymentIntentId && entry.paymentIntentId === event.paymentIntentId)
    ));
    if (order) {
      order.status = event.status;
      order.stripeSessionId = event.sessionId || order.stripeSessionId;
      order.paymentIntentId = event.paymentIntentId || order.paymentIntentId;
      order.amountTotal = event.amountTotal ?? order.amountTotal;
      order.currency = event.currency || order.currency;
      if (event.notification) {
        const notification = {
          ...event.notification,
          orderToken: event.notification.orderToken || order.orderToken,
          businessName: event.notification.businessName || order.customer?.businessName,
          customerEmail: event.notification.customerEmail || order.customer?.email,
          destinationUrl: order.customer?.destinationUrl || "",
          items: order.items || [],
        };
        this.enqueue("order_notification", `stripe:${event.eventId}`, notification);
      }
    }
    return { duplicate: false, order: order || null };
  }

  async createLead(lead) {
    const record = { id: randomUUID(), createdAt: new Date().toISOString(), ...lead };
    this.leads.set(record.id, record);
    this.enqueue("lead_notification", `lead:${record.id}`, record);
    return record;
  }

  async recordUpload(upload) {
    this.uploads.set(upload.id, upload);
    return upload;
  }

  async getUpload(id) {
    return this.uploads.get(id) || null;
  }

  async getManagementOrderDetails() {
    return null;
  }

  async getManagementOrderPilotContext() {
    return null;
  }

  async getStorefrontCatalog() {
    return null;
  }

  async resolveTapoteLink(shortCode) {
    return this.pilotLinks.get(shortCode) || null;
  }

  async recordTapEvent(event) {
    this.tapEvents.push({ id: this.tapEvents.length + 1, occurredAt: new Date().toISOString(), ...event });
  }

  enqueue(kind, dedupeKey, payload) {
    if (this.outbox.some((job) => job.dedupeKey === dedupeKey)) return;
    this.outbox.push({ id: randomUUID(), kind, dedupeKey, payload, status: "pending", attempts: 0 });
  }

  async claimOutboxJobs(limit = 5) {
    const jobs = this.outbox.filter((job) => job.status === "pending").slice(0, limit);
    jobs.forEach((job) => {
      job.status = "processing";
      job.attempts += 1;
    });
    return jobs;
  }

  async markOutboxDone(id) {
    const job = this.outbox.find((entry) => entry.id === id);
    if (job) job.status = "sent";
  }

  async markOutboxFailed(id, errorMessage) {
    const job = this.outbox.find((entry) => entry.id === id);
    if (job) {
      job.status = job.attempts >= 8 ? "failed" : "pending";
      job.lastError = errorMessage;
    }
  }

  async close() {}
}

class PostgresRepository {
  durable = true;

  constructor(config) {
    this.pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: true } : false,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
      application_name: "tapote-api",
    });
  }

  async healthCheck() {
    await this.pool.query("select 1");
    return true;
  }

  async createPendingOrder(order) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const inserted = await client.query(
        `insert into orders (
          order_token, status, customer_business_name, customer_email, destination_url,
          legal_version, terms_accepted_at, professional_customer, professional_customer_attested_at
        ) values ($1, 'pending', $2, $3, $4, $5, now(), true, now())
        on conflict (order_token) do nothing
        returning id, order_token, status, stripe_session_id, payment_intent_id`,
        [order.orderToken, order.customer.businessName, order.customer.email, order.customer.destinationUrl || null, order.legalVersion],
      );

      if (inserted.rowCount === 0) {
        const existing = await client.query(
          "select id, order_token, status, stripe_session_id, payment_intent_id from orders where order_token = $1",
          [order.orderToken],
        );
        await client.query("commit");
        return mapOrder(existing.rows[0], true);
      }

      const orderId = inserted.rows[0].id;
      for (const item of order.items) {
        await client.query(
          `insert into order_items (
            order_id, product_id, action_id, quantity, unit_amount, customization
          ) values ($1, $2, $3, $4, $5, $6::jsonb)`,
          [orderId, item.productId, item.actionId, item.quantity, item.unitAmount, JSON.stringify(item.customization)],
        );
      }
      await client.query("commit");
      return mapOrder(inserted.rows[0], false);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async getOrderByToken(orderToken) {
    const result = await this.pool.query(
      "select id, order_token, status, stripe_session_id, payment_intent_id, amount_total, currency from orders where order_token = $1",
      [orderToken],
    );
    return result.rowCount ? mapOrder(result.rows[0]) : null;
  }

  async attachStripeSession(orderToken, stripeSessionId, paymentIntentId = null) {
    const result = await this.pool.query(
      `update orders
       set stripe_session_id = $2, payment_intent_id = coalesce($3, payment_intent_id), updated_at = now()
       where order_token = $1 and (stripe_session_id is null or stripe_session_id = $2)
       returning id, order_token, status, stripe_session_id, payment_intent_id, amount_total, currency`,
      [orderToken, stripeSessionId, paymentIntentId],
    );
    return result.rowCount ? mapOrder(result.rows[0]) : null;
  }

  async markDemoOrder() {
    throw new Error("Une commande de démonstration ne peut pas être enregistrée dans la base de production.");
  }

  async getOrderBySession(sessionId) {
    const result = await this.pool.query(
      "select id, order_token, status, stripe_session_id, payment_intent_id, amount_total, currency from orders where stripe_session_id = $1",
      [sessionId],
    );
    return result.rowCount ? mapOrder(result.rows[0]) : null;
  }

  async recordStripeEvent(event) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const inserted = await client.query(
        `insert into stripe_events (event_id, event_type, livemode, stripe_created_at)
         values ($1, $2, $3, to_timestamp($4))
         on conflict (event_id) do nothing returning event_id`,
        [event.eventId, event.eventType, event.livemode, event.created],
      );
      if (inserted.rowCount === 0) {
        await client.query("commit");
        return { duplicate: true, order: null };
      }

      const updated = await client.query(
        `update orders set
          status = $4,
          stripe_session_id = coalesce($2, stripe_session_id),
          payment_intent_id = coalesce($3, payment_intent_id),
          amount_total = coalesce($5, amount_total),
          currency = coalesce($6, currency),
          paid_at = case when $4 = 'paid' and paid_at is null then now() else paid_at end,
          updated_at = now()
         where ($1::uuid is not null and order_token = $1::uuid)
            or ($2::text is not null and stripe_session_id = $2::text)
            or ($3::text is not null and payment_intent_id = $3::text)
         returning id, order_token, status, stripe_session_id, payment_intent_id, amount_total, currency,
           customer_business_name, customer_email, destination_url`,
        [event.orderToken || null, event.sessionId || null, event.paymentIntentId || null, event.status, event.amountTotal ?? null, event.currency || null],
      );

      if (updated.rowCount && event.notification) {
        const order = updated.rows[0];
        const itemRows = await client.query(
          `select product_id, action_id, quantity, unit_amount, customization
           from order_items
           where order_id = $1
           order by created_at asc, id asc`,
          [order.id],
        );
        const notification = {
          ...event.notification,
          orderToken: event.notification.orderToken || order.order_token,
          businessName: event.notification.businessName || order.customer_business_name,
          customerEmail: event.notification.customerEmail || order.customer_email,
          destinationUrl: order.destination_url || "",
          amountTotal: event.notification.amountTotal ?? order.amount_total,
          currency: event.notification.currency || order.currency,
          items: itemRows.rows.map((item) => ({
            productId: item.product_id,
            actionId: item.action_id,
            quantity: item.quantity,
            unitAmount: item.unit_amount,
            customization: item.customization || {},
          })),
        };
        await client.query(
          `insert into outbox_jobs (kind, dedupe_key, payload)
           values ('order_notification', $1, $2::jsonb)
           on conflict (dedupe_key) do nothing`,
          [`stripe:${event.eventId}`, JSON.stringify(notification)],
        );
      }
      await client.query("commit");
      return { duplicate: false, order: updated.rowCount ? mapOrder(updated.rows[0]) : null };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async createLead(lead) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const inserted = await client.query(
        `insert into leads (name, email, company, need, consent_at)
         values ($1, $2, $3, $4, now())
         returning id, name, email, company, need, created_at`,
        [lead.name, lead.email, lead.company || null, lead.need],
      );
      const record = inserted.rows[0];
      await client.query(
        `insert into outbox_jobs (kind, dedupe_key, payload)
         values ('lead_notification', $1, $2::jsonb)
         on conflict (dedupe_key) do nothing`,
        [`lead:${record.id}`, JSON.stringify(record)],
      );
      await client.query("commit");
      return record;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async recordUpload(upload) {
    const result = await this.pool.query(
      `insert into uploads (id, storage_path, original_name, mime_type, bytes)
       values ($1, $2, $3, $4, $5)
       returning id, storage_path, original_name, mime_type, bytes, created_at`,
      [upload.id, upload.storagePath, upload.originalName, upload.mimeType, upload.bytes],
    );
    return result.rows[0];
  }

  async getUpload(id) {
    const result = await this.pool.query(
      "select id, storage_path, original_name, mime_type, bytes, created_at from uploads where id = $1",
      [id],
    );
    return result.rows[0] || null;
  }

  async getManagementOrderDetails(managementOrderId, managementUserId) {
    const orderResult = await this.pool.query(
      `select
         management.id,
         management.organization_id,
         management.order_number,
         management.source_order_id,
         storefront.customer_business_name,
         storefront.destination_url
       from management_orders management
       join platform_settings settings
         on settings.management_organization_id = management.organization_id
       join organization_members membership
         on membership.organization_id = management.organization_id
        and membership.user_id = $2
        and membership.role in ('owner', 'admin', 'manager')
       join management_profiles profile
         on profile.organization_id = management.organization_id
        and profile.user_id = membership.user_id
       left join orders storefront on storefront.id = management.source_order_id
       where management.id = $1`,
      [managementOrderId, managementUserId],
    );
    if (!orderResult.rowCount) return null;
    const order = orderResult.rows[0];
    if (!order.source_order_id) {
      return {
        id: order.id,
        orderNumber: order.order_number,
        sourceOrderId: null,
        customerBusinessName: order.customer_business_name || null,
        destinationUrl: order.destination_url || null,
        lines: [],
      };
    }

    const linesResult = await this.pool.query(
      `select
         items.id,
         items.product_id,
         items.action_id,
         items.quantity,
         items.unit_amount,
         items.customization,
         uploads.id as logo_id,
         uploads.storage_path as logo_storage_path,
         uploads.original_name as logo_original_name,
         uploads.mime_type as logo_mime_type,
         uploads.bytes as logo_bytes
       from order_items items
       left join uploads
         on uploads.id::text = items.customization ->> 'brandLogoId'
        and uploads.deleted_at is null
       where items.order_id = $1
       order by items.created_at asc, items.id asc`,
      [order.source_order_id],
    );

    return {
      id: order.id,
      orderNumber: order.order_number,
      sourceOrderId: order.source_order_id,
      customerBusinessName: order.customer_business_name || null,
      destinationUrl: order.destination_url || null,
      lines: linesResult.rows.map((line) => ({
        id: line.id,
        productId: line.product_id,
        actionId: line.action_id,
        quantity: line.quantity,
        unitAmount: line.unit_amount,
        customization: line.customization || {},
        logo: line.logo_id ? {
          id: line.logo_id,
          storagePath: line.logo_storage_path,
          originalName: line.logo_original_name,
          mimeType: line.logo_mime_type,
          bytes: line.logo_bytes,
        } : null,
      })),
    };
  }

  async getManagementOrderPilotContext(managementOrderId, managementUserId) {
    const result = await this.pool.query(
      `select
         management.id,
         management.order_number,
         management.status,
         management.pilot_status,
         management.pilot_organization_id,
         management.pilot_activated_at,
         clients.id as client_id,
         clients.name as client_name,
         clients.email as client_email,
         count(units.id) filter (where units.status = 'assigned')::integer as assigned_products,
         count(units.id)::integer as total_products
       from management_orders management
       join platform_settings settings
         on settings.management_organization_id = management.organization_id
       join organization_members membership
         on membership.organization_id = management.organization_id
        and membership.user_id = $2
        and membership.role in ('owner', 'admin', 'manager')
       join management_profiles profile
         on profile.organization_id = management.organization_id
        and profile.user_id = membership.user_id
       join management_clients clients
         on clients.organization_id = management.organization_id
        and clients.id = management.client_id
       left join management_product_units units
         on units.organization_id = management.organization_id
        and units.order_id = management.id
        and units.client_id = management.client_id
       where management.id = $1
       group by management.id, clients.id`,
      [managementOrderId, managementUserId],
    );
    if (!result.rowCount) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      orderNumber: row.order_number,
      status: row.status,
      pilotStatus: row.pilot_status || null,
      pilotOrganizationId: row.pilot_organization_id || null,
      pilotActivatedAt: row.pilot_activated_at || null,
      clientId: row.client_id,
      clientName: row.client_name,
      clientEmail: row.client_email,
      assignedProducts: row.assigned_products || 0,
      totalProducts: row.total_products || 0,
    };
  }

  async getStorefrontCatalog() {
    const result = await this.pool.query(
      `select products.external_product_id,
         products.name,
         products.price_cents,
         products.online,
         case when inventory.id is null then null
           else greatest(inventory.stock_quantity - inventory.reserved_quantity, 0)
         end as available_stock
       from platform_settings settings
       join management_storefront_products products
         on products.organization_id = settings.management_organization_id
       left join management_inventory_items inventory
         on inventory.organization_id = products.organization_id
        and inventory.id = products.inventory_item_id
        and inventory.archived_at is null
       where settings.id = true
         and products.external_product_id is not null
       order by products.name`,
    );
    return result.rows.map((row) => ({
      productId: row.external_product_id,
      name: row.name,
      price: row.price_cents,
      online: row.online,
      availableStock: row.available_stock === null ? null : Number(row.available_stock),
    }));
  }

  async resolveTapoteLink(shortCode) {
    const result = await this.pool.query(
      `select id, target_url, active
       from tapote_links
       where short_code = $1`,
      [shortCode],
    );
    if (!result.rowCount) return null;
    return {
      id: result.rows[0].id,
      targetUrl: result.rows[0].target_url,
      active: result.rows[0].active,
    };
  }

  async recordTapEvent(event) {
    await this.pool.query(
      `insert into tap_events (tapote_link_id, source, device_family)
       values ($1, $2, $3)`,
      [event.tapoteLinkId, event.source, event.deviceFamily],
    );
  }

  async claimOutboxJobs(limit = 5) {
    const result = await this.pool.query(
      `with next_jobs as (
        select id from outbox_jobs
        where status = 'pending' and available_at <= now()
        order by created_at asc
        for update skip locked
        limit $1
      )
      update outbox_jobs as jobs
      set status = 'processing', attempts = attempts + 1, locked_at = now(), updated_at = now()
      from next_jobs
      where jobs.id = next_jobs.id
      returning jobs.id, jobs.kind, jobs.dedupe_key, jobs.payload, jobs.attempts`,
      [limit],
    );
    return result.rows.map((row) => ({ ...row, dedupeKey: row.dedupe_key }));
  }

  async markOutboxDone(id) {
    await this.pool.query(
      "update outbox_jobs set status = 'sent', sent_at = now(), updated_at = now() where id = $1",
      [id],
    );
  }

  async markOutboxFailed(id, errorMessage) {
    await this.pool.query(
      `update outbox_jobs set
        status = case when attempts >= 8 then 'failed' else 'pending' end,
        available_at = now() + make_interval(secs => least(3600, attempts * attempts * 30)),
        last_error = $2,
        locked_at = null,
        updated_at = now()
       where id = $1`,
      [id, String(errorMessage).slice(0, 500)],
    );
  }

  async close() {
    await this.pool.end();
  }
}

function mapOrder(row, existing = false) {
  if (!row) return null;
  return {
    id: row.id,
    orderToken: row.order_token,
    status: row.status,
    stripeSessionId: row.stripe_session_id,
    paymentIntentId: row.payment_intent_id,
    amountTotal: row.amount_total,
    currency: row.currency,
    existing,
  };
}

export function createRepository(config) {
  return config.databaseUrl ? new PostgresRepository(config) : new DevelopmentRepository();
}
