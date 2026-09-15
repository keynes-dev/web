import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceBar } from "./ResourceBar";

const resources = {
  dataCredits: "Data credits",
  aiTokens: "AI tokens",
  emailSends: "Email sends",
} as const;

type Resource = keyof typeof resources;
type Decision = "approved" | "denied";

interface Allocation {
  resource: Resource;
  total: number;
  reserved?: number;
  used?: number;
}

const budgetNumber = new Intl.NumberFormat("en", { notation: "compact" });

function Connector({ branches = 2 }: { branches?: 1 | 2 }) {
  if (branches === 1) {
    return (
      <div aria-hidden='true' className='relative my-2 h-6'>
        <i className='absolute top-0 bottom-1 left-1/2 border-l border-border'>
          <span className='absolute -bottom-0.5 -left-1 size-2 rotate-45 border-r border-b border-border' />
        </i>
      </div>
    );
  }

  return (
    <div aria-hidden='true' className='relative my-2 h-6'>
      <i className='absolute top-0 left-1/2 z-10 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-card' />
      <i className='absolute top-0 left-1/2 h-1/2 border-l border-border' />
      <i className='absolute top-1/2 right-1/4 left-1/4 border-t border-border' />
      <i className='absolute top-1/2 bottom-1 left-1/4 border-l border-border'>
        <span className='absolute -bottom-0.5 -left-1 size-2 rotate-45 border-r border-b border-border' />
      </i>
      <i className='absolute top-1/2 right-1/4 bottom-1 border-r border-border'>
        <span className='absolute -right-1 -bottom-0.5 size-2 rotate-45 border-r border-b border-border' />
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
    <Card className='h-full min-w-0 border'>
      <CardHeader className='bg-orange-100 border-b px-3 py-1.5'>
        <CardTitle className='text-xs text-foreground'>{name}</CardTitle>
      </CardHeader>
      <CardContent className='py-3 bg-background'>
        <dl className='grid gap-2'>
          {allocations.map(({ resource, total, reserved = 0, used = 0 }) => {
            const label = resources[resource];
            const available = total - reserved - used;

            return (
              <div className='min-w-0 text-xs' key={resource}>
                <div className='flex items-end justify-between gap-2'>
                  <dt className='truncate text-muted-foreground'>{label}</dt>
                  <dd className='shrink-0 font-mono'>
                    {budgetNumber.format(total)}
                  </dd>
                </div>
                <dd className='mt-1'>
                  <ResourceBar
                    available={available}
                    reserved={reserved}
                    used={used}
                    label={`${label}: ${available.toLocaleString()} available, ${reserved.toLocaleString()} reserved, ${used.toLocaleString()} used`}
                  />
                </dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}

function StatusCard({ status, detail }: { status: Decision; detail: string }) {
  let label: string;
  let swatch: string;
  let header: string;

  switch (status) {
    case "approved":
      label = "Approved";
      swatch = "bg-emerald-500";
      header = "bg-emerald-100";
      break;
    case "denied":
      label = "Denied";
      swatch = "bg-red-500";
      header = "bg-red-100";
      break;
    default: {
      const _exhaustive: never = status;
      throw new Error(`Unhandled status: ${_exhaustive}`);
    }
  }

  return (
    <Card className='border' aria-label={`${label}: ${detail}`}>
      <CardHeader className={`${header} border-b px-3 py-1.5`}>
        <CardTitle className='text-xs flex items-center justify-between text-foreground'>
          Agent
          <span className='flex min-w-0 items-center gap-2'>
            <span
              aria-hidden='true'
              className={`size-2 shrink-0 rounded-full ${swatch}`}
            />
            <span className='font-mono text-xs'>{label}</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className='flex items-center justify-between gap-2 py-3 bg-background'>
        <span className='truncate font-mono text-xs text-muted-foreground'>
          {detail}
        </span>
      </CardContent>
    </Card>
  );
}

export function BudgetTree() {
  return (
    <figure
      role='img'
      aria-label="The GTM organization's data-credit, AI-token, and email-send budgets branch into Growth Operations and Sales Development budgets. Growth Operations approves a small enrichment request; Sales Development denies an email-send request that exceeds available budget."
    >
      <BudgetNode
        name='GTM'
        allocations={[
          {
            resource: "dataCredits",
            total: 100_000,
            reserved: 55_000,
            used: 25_000,
          },
          {
            resource: "aiTokens",
            total: 30_000_000,
            reserved: 15_000_000,
            used: 6_000_000,
          },
          {
            resource: "emailSends",
            total: 25_000,
            reserved: 15_000,
            used: 5_000,
          },
        ]}
      />
      <Connector />
      <div className='grid grid-cols-2 items-start gap-3'>
        <div className='min-w-0'>
          <BudgetNode
            name='Growth Operations'
            allocations={[
              {
                resource: "dataCredits",
                total: 60_000,
                reserved: 30_000,
                used: 15_000,
              },
              {
                resource: "aiTokens",
                total: 18_000_000,
                reserved: 9_000_000,
                used: 4_000_000,
              },
            ]}
          />
          <Connector branches={1} />
          <StatusCard status='approved' detail='Running...' />
        </div>
        <div className='min-w-0'>
          <BudgetNode
            name='Sales Development'
            allocations={[
              {
                resource: "aiTokens",
                total: 10_000_000,
                reserved: 5_000_000,
                used: 2_000_000,
              },
              {
                resource: "emailSends",
                total: 20_000,
                reserved: 12_000,
                used: 4_000,
              },
            ]}
          />
          <Connector branches={1} />
          <StatusCard status='denied' detail='emailSends 5K > 4K avail' />
        </div>
      </div>
    </figure>
  );
}
