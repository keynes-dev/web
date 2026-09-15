import { Check, Minus } from "lucide-react";

import {
  Section,
  SectionColumn,
  SectionContent,
  SectionFrame,
} from "@/components/Section";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    desc: "In-process SQLite. No account, keys, or network. Budgets end with the process.",
  },
  {
    name: "Hosted",
    glyph: hostedGlyph,
    desc: "Use Keynes over the remote SDK. Keynes or you operate its PostgreSQL database.",
  },
  {
    name: "Embedded",
    glyph: embeddedGlyph,
    desc: "Install Keynes in your PostgreSQL database. Budget changes commit with your application rows.",
  },
] as const;

const tableRows: { label: string; values: (string | boolean)[] }[] = [
  { label: "Durable across restarts", values: [false, true, true] },
  { label: "Commits with your own rows", values: [false, false, true] },
  { label: "Runs with no network", values: [true, false, true] },
  {
    label: "Who operates the database",
    values: ["nobody", "you or Keynes", "you"],
  },
  {
    label: "Setup before first request",
    values: ["none", "api key", "installer + roles"],
  },
];

function BooleanValue({ value }: { value: boolean }) {
  return value ?
      <span className='inline-flex items-center gap-1.5'>
        <Check className='size-4' aria-hidden='true' />
        yes
      </span>
    : <span className='inline-flex items-center gap-1.5 text-muted-foreground'>
        <Minus className='size-4' aria-hidden='true' />
        no
      </span>;
}

export function Deployments() {
  return (
    <Section>
      <SectionFrame>
        <SectionColumn>
          <SectionContent>
            <div className='flex flex-col gap-12'>
              <header className='relative max-w-3xl space-y-4'>
                <h2>Three ways to run it</h2>
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
                      <div className='flex min-h-32 items-center justify-center overflow-hidden p-2 sm:p-3'>
                        <pre
                          className='ascii m-0 max-w-full overflow-hidden font-mono text-xs leading-relaxed font-medium whitespace-pre'
                          dangerouslySetInnerHTML={{ __html: mode.glyph }}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className='text-sm leading-6 text-muted-foreground'>
                      {mode.desc}
                    </CardFooter>
                  </Card>
                ))}
              </div>

              <Card className='min-w-0'>
                <CardContent className='p-0'>
                  <Table>
                    <TableHeader className='border-b-2 border-border'>
                      <TableRow>
                        <TableHead className='min-w-56'>Capability</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead>Hosted</TableHead>
                        <TableHead>Embedded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
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
