import { Check, X } from "lucide-react";

import {
  Section,
  SectionColumn,
  SectionContent,
  SectionFrame,
} from "@/components/Section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { embeddedGlyph, hostedGlyph, localGlyph } from "@/lib/diagrams";

const modes = [
  {
    name: "Local",
    glyph: localGlyph,
  },
  {
    name: "Hosted",
    glyph: hostedGlyph,
  },
  {
    name: "Embedded",
    glyph: embeddedGlyph,
  },
] as const;

const tableRows: { label: string; values: (string | boolean)[] }[] = [
  { label: "Data persistence", values: [false, true, true] },
  { label: "Database transactions", values: [false, false, true] },
  { label: "Network required", values: [false, true, true] },
  {
    label: "Database operator",
    values: ["N/A", "Keynes", "You"],
  },
];

function BooleanValue({ value }: { value: boolean }) {
  return value ?
      <Check className='size-4 text-green-500' aria-hidden='true' />
    : <X className='size-4 text-red-500' aria-hidden='true' />;
}

export function Deployments() {
  return (
    <Section className='bg-amber-100'>
      <SectionFrame>
        <SectionColumn>
          <SectionContent className='px-0 pb-0 pt-8 sm:px-0 sm:pb-0 sm:pt-12'>
            <div className='flex flex-col gap-8 px-4 sm:px-8'>
              <header className='relative max-w-3xl space-y-4'>
                <h2>Deploy everywhere</h2>
                <p className='text-base leading-relaxed text-muted-foreground'>
                  The same Budget workflow, whether it lives in your process,
                  inside your database, or behind the service. What changes is
                  durability, transactions, and who operates it.
                </p>
              </header>

              <div className='grid gap-6 lg:grid-cols-3'>
                {modes.map((mode) => (
                  <Card className='min-w-0' key={mode.name}>
                    <CardHeader>
                      <CardTitle>{mode.name}</CardTitle>
                    </CardHeader>
                    <CardContent className='relative overflow-hidden bg-violet-50 p-0'>
                      <svg
                        className='pointer-events-none absolute inset-0 size-full text-border/10'
                        aria-hidden='true'
                      >
                        <defs>
                          <pattern
                            id={`deployment-grid-${mode.name}`}
                            width='16'
                            height='16'
                            patternUnits='userSpaceOnUse'
                          >
                            <path
                              d='M16 0H0V16'
                              fill='none'
                              stroke='currentColor'
                            />
                          </pattern>
                        </defs>
                        <rect
                          width='100%'
                          height='100%'
                          fill={`url(#deployment-grid-${mode.name})`}
                        />
                      </svg>
                      <div className='relative z-10 flex min-h-32 items-center justify-center overflow-hidden p-2 sm:p-3'>
                        <pre
                          className='ascii m-0 max-w-full overflow-hidden font-mono text-xs leading-relaxed font-medium whitespace-pre'
                          dangerouslySetInnerHTML={{ __html: mode.glyph }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className='mt-8 min-w-0 border-x-0 border-b-0 border-t-1'>
              <CardContent className='p-0'>
                <Table>
                  <TableHeader className='border-b-1 border-border'>
                    <TableRow>
                      <TableHead className='min-w-48 pl-4 sm:pl-8'>
                        Capability
                      </TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Hosted</TableHead>
                      <TableHead className='pr-4 sm:pr-8'>Embedded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell className='pl-4 font-medium sm:pl-8'>
                          {row.label}
                        </TableCell>
                        {row.values.map((value, index) => (
                          <TableCell
                            key={`${row.label}-${modes[index].name}`}
                            className={
                              index === row.values.length - 1 ?
                                "pr-4 sm:pr-8"
                              : undefined
                            }
                          >
                            {typeof value === "boolean" ?
                              <BooleanValue value={value} />
                            : value}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </SectionContent>
        </SectionColumn>
      </SectionFrame>
    </Section>
  );
}
