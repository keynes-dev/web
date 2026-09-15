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
          <SectionContent>
            <div className='flex flex-col gap-8'>
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
                    <CardContent className='p-0'>
                      <div className='flex min-h-32 items-center justify-center overflow-hidden p-2 sm:p-3 bg-violet-50'>
                        <pre
                          className='ascii m-0 max-w-full overflow-hidden font-mono text-xs leading-relaxed font-medium whitespace-pre'
                          dangerouslySetInnerHTML={{ __html: mode.glyph }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className='min-w-0'>
                <CardContent className='p-0'>
                  <Table>
                    <TableHeader className='border-b-2 border-border bg-foreground'>
                      <TableRow>
                        <TableHead className='min-w-56 text-background'>
                          Capability
                        </TableHead>
                        <TableHead className='text-background'>Local</TableHead>
                        <TableHead className='text-background'>
                          Hosted
                        </TableHead>
                        <TableHead className='text-background'>
                          Embedded
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className='bg-violet-50'>
                      {tableRows.map((row) => (
                        <TableRow key={row.label}>
                          <TableCell className='font-medium'>
                            {row.label}
                          </TableCell>
                          {row.values.map((value, index) => (
                            <TableCell
                              key={`${row.label}-${modes[index].name}`}
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
            </div>
          </SectionContent>
        </SectionColumn>
      </SectionFrame>
    </Section>
  );
}
