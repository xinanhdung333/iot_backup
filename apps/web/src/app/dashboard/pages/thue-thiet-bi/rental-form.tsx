"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Box, Check, CheckCircle2, CreditCard, Loader2, MapPin, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { api, money, Product } from "@/lib/api";
import { PaymentMethod, PaymentMethodSelect } from "@/components/payment-method-select";

const durations = [{ value: 1, label: "1 tháng", note: "Linh hoạt" }, { value: 3, label: "3 tháng", note: "Phổ biến" }, { value: 12, label: "12 tháng", note: "Dài hạn" }];

export function RentalForm({ products }: { products: Product[] }) {
  const search = useSearchParams();
  const [items, setItems] = useState(products);
  const [productId, setProductId] = useState(search.get("product") || products[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [duration, setDuration] = useState(1);
  const [address, setAddress] = useState("123 Nguyễn Huệ, Quận 1, TP.HCM");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("payos_demo");

  useEffect(() => { void api<Product[]>("/products", { cache: "no-store" }).then((result) => { const rentable = result.filter((item) => item.productType === "THIET_BI_THUE" || (!item.productType && item.type !== "COMPONENT")); setItems(rentable); setProductId((current) => current || rentable[0]?.id || ""); }).catch(() => undefined); }, []);
  const product = items.find((item) => item.id === productId) || items[0];
  const safeQuantity = product ? Math.min(quantity, Math.max(product.stock, 1)) : quantity;
  const breakdown = useMemo(() => { if (!product) return { rent: 0, deposit: 0, install: 300000, total: 0 }; const rent = product.priceRentMonth * duration * safeQuantity; const deposit = product.depositFee * safeQuantity; const install = 300000; return { rent, deposit, install, total: rent + deposit + install }; }, [product, duration, safeQuantity]);

  async function submit() {
    if (!product || !agree || !address.trim()) return;
    setError(""); setLoading(true);
    try { const result = await api<{ payment_demo_url: string }>("/rentals", { method: "POST", body: JSON.stringify({ product_id: product.id, type: "rent", duration, quantity: safeQuantity, shipping_address: { address: address.trim() }, agree_damage_terms: agree, payment_method: paymentMethod }) }); if (result) window.location.href = result.payment_demo_url; }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tạo đơn thuê."); }
    finally { setLoading(false); }
  }

  if (!items.length) return <section className="panel grid min-h-[420px] place-items-center p-8 text-center"><div><div className="mx-auto grid size-12 place-items-center rounded-xl bg-zinc-100 text-zinc-500"><Box size={22} /></div><h2 className="mt-4 font-semibold">Chưa có thiết bị để thuê</h2><p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">Hãy kiểm tra kết nối dịch vụ sản phẩm hoặc thêm thiết bị trong trang quản trị.</p></div></section>;

  return <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel overflow-hidden">
      <div className="border-b border-zinc-200 bg-gradient-to-r from-emerald-50/70 via-white to-amber-50/50 p-5"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-lg bg-emerald-100 text-emerald-700"><Truck size={18} /></div><div><h2 className="font-semibold">Cấu hình đơn thuê</h2><p className="mt-1 text-sm text-zinc-500">Hoàn thành các thông tin bên dưới để nhận báo giá.</p></div></div></div>
      <div className="grid gap-6 p-5 md:p-6">
        <Step number="01" title="Chọn thiết bị"><div className="grid gap-3 sm:grid-cols-2">{items.map((item) => { const active = product?.id === item.id; return <button key={item.id} type="button" onClick={() => { setProductId(item.id); setQuantity(1); }} className={`relative rounded-xl border p-4 text-left transition hover:border-zinc-400 ${active ? "border-zinc-900 bg-zinc-950 text-white shadow-sm" : "border-zinc-200 bg-white"}`}><div className="flex items-start justify-between gap-2"><div className={`grid size-9 place-items-center rounded-lg ${active ? "bg-white/10" : "bg-zinc-100"}`}><Box size={17} /></div>{active && <span className="grid size-5 place-items-center rounded-full bg-white text-zinc-950"><Check size={13} /></span>}</div><b className="mt-4 block">{item.name}</b><span className={`mt-1 block text-xs ${active ? "text-zinc-400" : "text-zinc-500"}`}>{money(item.priceRentMonth)}/tháng · còn {item.stock}</span></button>; })}</div></Step>
        <Step number="02" title="Số lượng và thời hạn"><div className="grid gap-4 md:grid-cols-[180px_1fr]"><div><p className="mb-2 text-xs font-medium text-zinc-500">Số lượng</p><div className="flex h-11 items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/40 px-2"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid size-8 place-items-center rounded-md hover:bg-emerald-100" aria-label="Giảm số lượng"><Minus size={15} /></button><b>{safeQuantity}</b><button type="button" onClick={() => setQuantity((value) => Math.min(product?.stock || 1, value + 1))} className="grid size-8 place-items-center rounded-md hover:bg-emerald-100" aria-label="Tăng số lượng"><Plus size={15} /></button></div></div><div><p className="mb-2 text-xs font-medium text-zinc-500">Thời hạn</p><div className="grid grid-cols-3 gap-2">{durations.map((item) => <button key={item.value} type="button" onClick={() => setDuration(item.value)} className={`min-h-11 rounded-lg border px-2 py-1.5 text-left transition ${duration === item.value ? "border-violet-300 bg-violet-50 text-violet-950 ring-1 ring-violet-200" : "border-zinc-200 hover:border-violet-300"}`}><b className="block text-xs sm:text-sm">{item.label}</b><span className={`hidden text-[10px] sm:block ${duration === item.value ? "text-violet-600" : "text-zinc-500"}`}>{item.note}</span></button>)}</div></div></div></Step>
        <Step number="03" title="Địa điểm lắp đặt"><label className="relative block"><MapPin className="absolute left-3 top-3 text-zinc-400" size={17} /><textarea className="field min-h-24 !pl-10" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Nhập địa chỉ nhận và lắp đặt thiết bị" /></label></Step>
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${agree ? "border-emerald-200 bg-emerald-50/60" : "border-zinc-200 bg-zinc-50"}`}><input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} className="mt-1 size-4 accent-zinc-900" /><span><b className="text-sm">Điều khoản bảo quản thiết bị</b><span className="mt-1 block text-xs leading-5 text-zinc-600">Tôi đồng ý bồi thường 100% khi mất thiết bị và tối đa 1.000.000đ khi hỏng đầu quét.</span></span></label>
      </div>
    </motion.section>

    <aside className="grid gap-4 xl:sticky xl:top-20">
      <section className="panel p-5"><PaymentMethodSelect value={paymentMethod} onChange={setPaymentMethod} /></section>
      <section className="panel overflow-hidden"><div className="border-b border-amber-200 bg-amber-50/60 p-5"><h2 className="font-semibold">Tóm tắt đơn thuê</h2><p className="mt-1 text-sm text-zinc-500">Chi phí dự kiến đã gồm lắp đặt.</p></div><div className="p-5"><div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4"><p className="font-medium">{product?.name}</p><p className="mt-1 text-xs text-emerald-700">{safeQuantity} thiết bị · {duration} tháng</p></div><div className="mt-5 grid gap-3 text-sm"><Fee label="Tiền thuê" value={money(breakdown.rent)} /><Fee label="Tiền cọc hoàn lại" value={money(breakdown.deposit)} /><Fee label="Phí lắp đặt" value={money(breakdown.install)} /><div className="mt-1 flex items-end justify-between border-t border-zinc-200 pt-4"><span className="font-medium">Tổng thanh toán</span><b className="text-xl tracking-tight text-amber-700">{money(breakdown.total)}</b></div></div>{error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={!product || !agree || !address.trim() || loading || !product.stock} onClick={() => void submit()} className="btn btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:bg-zinc-300">{loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}{loading ? "Đang tạo đơn..." : "Thanh toán và đặt thuê"}</button>{!agree && <p className="mt-2 text-center text-xs text-zinc-500">Chấp nhận điều khoản để tiếp tục</p>}</div></section>
      <section className="panel p-5"><div className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-600" /><h2 className="font-semibold">Quy trình sau thanh toán</h2></div><div className="mt-4 grid gap-3">{["Xác nhận đơn và lịch lắp đặt", "Kỹ thuật viên cấu hình tại chỗ", "Kiểm tra quét thử trước bàn giao"].map((item) => <p key={item} className="flex gap-2 text-xs leading-5 text-zinc-600"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />{item}</p>)}</div></section>
    </aside>
  </div>;
}

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) { return <div><div className="mb-3 flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700">{number}</span><h3 className="text-sm font-semibold">{title}</h3></div>{children}</div>; }
function Fee({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-3"><span className="text-zinc-500">{label}</span><b className="font-medium">{value}</b></div>; }
