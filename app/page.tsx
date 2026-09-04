'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CarFront, ChevronRight, FileText, Gauge, Search, ShieldCheck } from 'lucide-react';
import { standards } from './data/standards';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const years = Array.from({ length: 96 }, (_, index) => 2004 + index);
const brandOrder = ['Jeep', '道奇', '克莱斯勒', 'RAM'] as const;

export default function Home() {
  const [year, setYear] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [result, setResult] = useState<(typeof standards)[number] | null>(null);
  const [searched, setSearched] = useState(false);

  const models = useMemo(() => {
    const matches = standards.filter((item) =>
      (!brand || item.brand === brand) &&
      (!year || (Number(year) >= item.startYear && Number(year) <= item.endYear))
    );
    return [...new Set(matches.map((item) => item.model))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [brand, year]);

  const coverage = useMemo(() => {
    if (!year || !brand) return 0;
    return standards.filter((item) => item.brand === brand && Number(year) >= item.startYear && Number(year) <= item.endYear).length;
  }, [year, brand]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = context.registerTool({
      name: 'find_maintenance_standard',
      title: '查询基础保养标准',
      description: '按年款、品牌和车型查询资料库，并在页面中显示匹配文档。',
      inputSchema: {
        type: 'object',
        properties: { year: { type: 'integer', minimum: 2004, maximum: 2099 }, brand: { type: 'string', enum: brandOrder }, model: { type: 'string' } },
        required: ['year', 'brand', 'model'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input: unknown) {
        const query = input as { year?: number; brand?: string; model?: string };
        if (!Number.isInteger(query.year) || (query.year ?? 0) < 2004 || (query.year ?? 0) > 2099 || !brandOrder.includes(query.brand as (typeof brandOrder)[number]) || typeof query.model !== 'string') throw new Error('查询参数无效。');
        const found = standards.find((item) => item.brand === query.brand && item.model === query.model && query.year! >= item.startYear && query.year! <= item.endYear) ?? null;
        setYear(String(query.year)); setBrand(query.brand!); setModel(query.model); setResult(found); setSearched(true);
        return found ? { found: true, year: query.year, brand: found.brand, model: found.model, range: `${found.startYear}-${found.endYear}`, document: found.file } : { found: false, year: query.year, brand: query.brand, model: query.model };
      },
    }, { signal: lifecycle.signal });
    void Promise.resolve(register).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  function chooseBrand(value: string | null) {
    setBrand(value ?? '');
    setModel('');
    setResult(null);
    setSearched(false);
  }

  function search() {
    const found = standards.find((item) => item.brand === brand && item.model === model && Number(year) >= item.startYear && Number(year) <= item.endYear) ?? null;
    setResult(found);
    setSearched(true);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 bg-[#17261c] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-[#e3b341] text-[#17261c]"><Gauge size={22} strokeWidth={2.4} /></div>
            <div><p className="text-lg font-bold tracking-tight">CJD 基础保养标准库</p><p className="text-xs text-white/55">车型油液与容量资料查询</p></div>
          </div>
          <div className="hidden items-center gap-2 text-sm text-white/65 sm:flex"><ShieldCheck size={17} className="text-[#e3b341]" />资料源自当前标准文档</div>
        </div>
      </header>

      <section className="hero-surface relative overflow-hidden px-5 pb-24 pt-11 text-white sm:px-8 sm:pb-32 sm:pt-16 lg:pb-36 lg:pt-20">
        <div className="hero-overlay absolute inset-0" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-2xl pb-4 sm:pb-8">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-[.18em] text-[#e3b341]"><span className="h-px w-8 bg-[#e3b341]" />MAINTENANCE FINDER</p>
            <h1 className="text-4xl font-black leading-[1.08] tracking-[-.045em] sm:text-6xl lg:text-7xl">找到你的车，<br /><span className="text-[#e3b341]">查看准确保养标准。</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg">选择年款、品牌和车型，即可查看当前资料库中对应的原始基础保养标准。</p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold tracking-[.12em] text-white/75">{brandOrder.map((item) => <span key={item} className="rounded-full border border-white/20 bg-black/20 px-3 py-1.5 backdrop-blur-sm">{item.toUpperCase()}</span>)}</div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 sm:-mt-20 sm:px-8">
        <div className="rounded-[22px] border border-white/70 bg-white/95 p-5 shadow-[0_28px_80px_rgba(14,29,19,.20)] backdrop-blur-xl sm:rounded-[28px] sm:p-7 lg:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-bold sm:text-2xl">车辆查询</h2><p className="mt-1 text-sm text-muted-foreground">系统只显示当前年款已有资料的车型</p></div>{year && brand && <span className="w-fit rounded-full bg-[#eaf2eb] px-3 py-1.5 text-xs font-semibold text-[#31563a]">可用车型 {coverage} 个</span>}</div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_auto] lg:items-end">
            <Field label="年款" icon={<CalendarDays size={17} />}>
              <Select value={year} onValueChange={(value) => { setYear(value ?? ''); setModel(''); setResult(null); setSearched(false); }}><SelectTrigger className="h-13 w-full bg-white text-base shadow-xs"><SelectValue placeholder="选择年款" /></SelectTrigger><SelectContent>{years.map((item) => <SelectItem key={item} value={String(item)}>{item} 年</SelectItem>)}</SelectContent></Select>
            </Field>
            <Field label="品牌" icon={<CarFront size={17} />}>
              <Select value={brand} onValueChange={chooseBrand}><SelectTrigger className="h-13 w-full bg-white text-base shadow-xs"><SelectValue placeholder="选择品牌" /></SelectTrigger><SelectContent>{brandOrder.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            </Field>
            <div className="md:col-span-2 lg:col-span-1"><Field label="车型" icon={<FileText size={17} />}>
              <Select value={model} onValueChange={(value) => { setModel(value ?? ''); setResult(null); setSearched(false); }} disabled={!brand || !year || models.length === 0}><SelectTrigger className="h-13 w-full bg-white text-base shadow-xs"><SelectValue placeholder="选择车型" /></SelectTrigger><SelectContent>{models.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            </Field></div>
            <Button onClick={search} disabled={!year || !brand || !model} className="h-13 w-full bg-[#d5a62e] px-8 text-base font-bold text-[#17261c] shadow-[0_8px_22px_rgba(213,166,46,.25)] hover:bg-[#e3b341] md:col-span-2 lg:col-span-1 lg:w-auto"><Search size={19} />查询标准</Button>
          </div>
          {year && brand && models.length === 0 && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">该年款暂无 {brand} 车型资料，请选择其他年款或品牌。</p>}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-9 sm:px-8 sm:py-14">
        {result ? <div className="overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_18px_50px_rgba(22,42,28,.08)] sm:rounded-[26px]"><div className="flex flex-col gap-4 border-b bg-[#f3f6f2] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><p className="text-sm font-semibold text-[#51705a]">已匹配资料</p><h2 className="mt-1 text-xl font-black sm:text-2xl">{year} 年 {result.brand} {result.model}</h2><p className="mt-1 text-sm text-muted-foreground">适用资料范围：{result.startYear}–{result.endYear} 年</p></div><a href={result.file} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#31563a] shadow-xs">在新窗口打开 <ChevronRight size={17} /></a></div><iframe title={`${result.brand} ${result.model} 保养标准`} src={result.file} className="h-[70vh] min-h-[480px] w-full bg-white sm:min-h-[620px]" /></div> : searched ? <EmptyState title="暂无对应保养标准" text={`当前资料库中没有 ${year} 年 ${brand} ${model} 的标准文档。`} /> : <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 sm:gap-5"><Info icon={<CalendarDays />} value="2004–2099" label="年款选择范围" /><Info icon={<CarFront />} value="4 个品牌" label="Jeep・道奇・克莱斯勒・RAM" /><Info icon={<FileText />} value={`${standards.length} 份`} label="当前已录入标准文档" /></div>}
      </section>

      <footer className="border-t bg-white px-5 py-6 text-center text-sm text-muted-foreground">资料库结构已预留扩展方式，新增规范命名的 HTML 文档后可一键同步。</footer>
    </main>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) { return <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">{icon}{label}</span>{children}</label>; }
function Info({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="rounded-[20px] border border-border bg-white p-5 shadow-[0_10px_30px_rgba(22,42,28,.04)] sm:p-6"><div className="mb-6 grid size-11 place-items-center rounded-xl bg-[#eef4ee] text-[#31563a]">{icon}</div><p className="text-2xl font-black tracking-tight sm:text-3xl">{value}</p><p className="mt-2 text-sm text-muted-foreground">{label}</p></div>; }
function EmptyState({ title, text }: { title: string; text: string }) { return <div className="rounded-[22px] border border-dashed border-[#aab9ad] bg-[#f7f9f7] px-6 py-16 text-center"><div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-white text-[#607565] shadow-sm"><FileText /></div><h2 className="text-xl font-bold">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{text}</p></div>; }
