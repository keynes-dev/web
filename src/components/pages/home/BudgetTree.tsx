import { Card } from "@/components/ui/card";
import "./budget-tree.css";

const resources = {
  tokens: { label: "Tokens" },
  images: { label: "Images" },
  carrier: { label: "Carrier calls" },
  sms: { label: "SMS" },
};

type ResourceKey = keyof typeof resources;

interface Allocation {
  resource: ResourceKey;
  total: number;
  reserved?: number;
  used?: number;
}

const budgetNumber = new Intl.NumberFormat("en", { notation: "compact" });

function BudgetNode({
  name,
  allocations,
}: {
  name: string;
  allocations: readonly Allocation[];
}) {
  return (
    <Card className="budget-node" size="sm">
      <h3>{name}</h3>
      <dl>
        {allocations.map(
          ({ resource: resourceKey, total, reserved = 0, used = 0 }) => {
            const resource = resources[resourceKey];
            const available = total - reserved - used;
            return (
              <div
                key={resourceKey}
                data-resource={resourceKey}
                data-total={total}
                data-reserved={reserved}
                data-used={used}
              >
                <dt>{resource.label}</dt>
                <dd>{budgetNumber.format(total)}</dd>
                <dd
                  className="budget-node__bar"
                  aria-label={`${resource.label}: ${available.toLocaleString()} available, ${reserved.toLocaleString()} reserved, ${used.toLocaleString()} used`}
                  title={`${available.toLocaleString()} available · ${reserved.toLocaleString()} reserved · ${used.toLocaleString()} used`}
                >
                  <i className="budget-state-available" style={{ flex: available }} />
                  <i className="budget-state-reserved" style={{ flex: reserved }} />
                  <i className="budget-state-used" style={{ flex: used }} />
                </dd>
              </div>
            );
          },
        )}
      </dl>
    </Card>
  );
}

export function BudgetTree() {
  return (
    <figure
      className="budget-tree"
      role="img"
      aria-label="An online furniture retailer's monthly budget branches into Merchandising and Customer support. Product listings use tokens. Room scenes use tokens and image generations. Missing deliveries use tokens and carrier API calls. Delivery updates use tokens and SMS messages. Each workflow receives part of its team's allocation."
    >
      <div className="budget-tree__root">
        <BudgetNode
          name="Furniture retailer"
          allocations={[
            {
              resource: "tokens",
              total: 24000000,
              reserved: 14050000,
              used: 5950000,
            },
            { resource: "images", total: 2500, reserved: 1400, used: 600 },
            {
              resource: "carrier",
              total: 12000,
              reserved: 6800,
              used: 3200,
            },
            { resource: "sms", total: 6000, reserved: 4000, used: 1000 },
          ]}
        />
      </div>
      <div className="budget-tree__fork" aria-hidden="true">
        <b />
        <i />
        <i />
      </div>
      <div className="budget-tree__children">
        <div>
          <BudgetNode
            name="Merchandising"
            allocations={[
              {
                resource: "tokens",
                total: 5000000,
                reserved: 2550000,
                used: 1450000,
              },
              { resource: "images", total: 2000, reserved: 900, used: 600 },
            ]}
          />
          <div className="budget-tree__branch-fork" aria-hidden="true">
            <b />
            <i />
            <i />
          </div>
          <div className="budget-tree__workflows">
            <BudgetNode
              name="Product listings"
              allocations={[
                { resource: "tokens", total: 3000000, used: 1200000 },
              ]}
            />
            <BudgetNode
              name="Room scenes"
              allocations={[
                { resource: "tokens", total: 1000000, used: 250000 },
                { resource: "images", total: 1500, used: 600 },
              ]}
            />
          </div>
        </div>
        <div>
          <BudgetNode
            name="Customer support"
            allocations={[
              {
                resource: "tokens",
                total: 15000000,
                reserved: 7500000,
                used: 4500000,
              },
              {
                resource: "carrier",
                total: 10000,
                reserved: 4800,
                used: 3200,
              },
              { resource: "sms", total: 5000, reserved: 3000, used: 1000 },
            ]}
          />
          <div className="budget-tree__branch-fork" aria-hidden="true">
            <b />
            <i />
            <i />
          </div>
          <div className="budget-tree__workflows">
            <BudgetNode
              name="Missing deliveries"
              allocations={[
                { resource: "tokens", total: 10000000, used: 4000000 },
                { resource: "carrier", total: 8000, used: 3200 },
              ]}
            />
            <BudgetNode
              name="Delivery updates"
              allocations={[
                { resource: "tokens", total: 2000000, used: 500000 },
                { resource: "sms", total: 4000, used: 1000 },
              ]}
            />
          </div>
        </div>
      </div>
      <figcaption className="budget-tree__legend">
        <span><i className="budget-state-available" />Available</span>
        <span><i className="budget-state-reserved" />Reserved</span>
        <span><i className="budget-state-used" />Used</span>
      </figcaption>
    </figure>
  );
}
