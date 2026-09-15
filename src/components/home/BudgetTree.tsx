import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ResourceBar } from "./ResourceBar";

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

function Connector() {
  return (
    <div aria-hidden='true' className='relative my-4 h-7'>
      <i className='absolute top-0 left-1/2 z-10 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-background' />
      <i className='absolute top-0 left-1/2 h-1/2 border-l border-border' />
      <i className='absolute top-1/2 right-1/4 left-1/4 hidden border-t border-border sm:block' />
      <i className='absolute top-1/2 bottom-1 left-1/4 hidden border-l border-border sm:block'>
        <span className='absolute -bottom-0.5 -left-1 size-2 rotate-45 border-r border-b border-border' />
      </i>
      <i className='absolute top-1/2 right-1/4 bottom-1 hidden border-r border-border sm:block'>
        <span className='absolute -right-1 -bottom-0.5 size-2 rotate-45 border-r border-b border-border' />
      </i>
      <i className='absolute top-1/2 bottom-1 left-1/2 border-l border-border sm:hidden'>
        <span className='absolute -bottom-0.5 -left-1 size-2 rotate-45 border-r border-b border-border' />
      </i>
    </div>
  );
}

function BudgetNode({
  name,
  allocations,
}: {
  name: string;
  allocations: readonly Allocation[];
}) {
  return (
    <Card className='h-full min-w-0'>
      <CardHeader className='px-3 py-2'>
        <CardTitle className='text-xs'>{name}</CardTitle>
      </CardHeader>
      <CardContent className='py-3'>
        <dl
          className={cn(
            "grid gap-3",
            allocations.length >= 3 && "grid-flow-col grid-rows-2 auto-cols-fr",
          )}
        >
          {allocations.map(
            ({ resource: resourceKey, total, reserved = 0, used = 0 }) => {
              const resource = resources[resourceKey];
              const available = total - reserved - used;
              return (
                <div className='min-w-0 text-xs' key={resourceKey}>
                  <div className='flex items-end justify-between mb-2'>
                    <dt className='text-muted-foreground'>{resource.label}</dt>
                    <dd className='font-mono'>{budgetNumber.format(total)}</dd>
                  </div>
                  <dd className='mt-1'>
                    <ResourceBar
                      available={available}
                      reserved={reserved}
                      used={used}
                      label={`${resource.label}: ${available.toLocaleString()} available, ${reserved.toLocaleString()} reserved, ${used.toLocaleString()} used`}
                    />
                  </dd>
                </div>
              );
            },
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

export function BudgetTree() {
  return (
    <figure
      className='space-y-0'
      role='img'
      aria-label="An online furniture retailer's monthly budget branches into Merchandising and Customer support. Product listings use tokens. Room scenes use tokens and image generations. Missing deliveries use tokens and carrier API calls. Delivery updates use tokens and SMS messages. Each workflow receives part of its team's allocation."
    >
      <BudgetNode
        name='Organization'
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
      <Connector />
      <div className='grid gap-x-3 sm:grid-cols-2'>
        <div className='grid min-w-0 sm:row-span-3 sm:grid-rows-subgrid'>
          <BudgetNode
            name='Merchandising'
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
          <Connector />
          <div className='grid items-stretch gap-2 sm:grid-cols-2'>
            <BudgetNode
              name='Listings'
              allocations={[
                { resource: "tokens", total: 3000000, used: 1200000 },
              ]}
            />
            <BudgetNode
              name='Image gen'
              allocations={[
                { resource: "tokens", total: 1000000, used: 250000 },
                { resource: "images", total: 1500, used: 600 },
              ]}
            />
          </div>
        </div>
        <div className='grid min-w-0 sm:row-span-3 sm:grid-rows-subgrid'>
          <BudgetNode
            name='Support'
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
          <Connector />
          <div className='grid items-stretch gap-2 sm:grid-cols-2'>
            <BudgetNode
              name='Refunds'
              allocations={[
                { resource: "tokens", total: 10000000, used: 4000000 },
                { resource: "carrier", total: 8000, used: 3200 },
              ]}
            />
            <BudgetNode
              name='Updates'
              allocations={[
                { resource: "tokens", total: 2000000, used: 500000 },
                { resource: "sms", total: 4000, used: 1000 },
              ]}
            />
          </div>
        </div>
      </div>
      <figcaption className='mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground'>
        <span className='flex items-center gap-1.5'>
          <i className='font-mono text-foreground not-italic'>▓▓</i>
          Available
        </span>
        <span className='flex items-center gap-1.5'>
          <i className='font-mono text-foreground/55 not-italic'>▒▒</i>
          Reserved
        </span>
        <span className='flex items-center gap-1.5'>
          <i className='font-mono text-foreground/25 not-italic'>░░</i>
          Used
        </span>
      </figcaption>
    </figure>
  );
}
