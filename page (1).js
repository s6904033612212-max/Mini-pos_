'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SellPage() {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('1');
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }
  const [busy, setBusy] = useState(false);

  async function loadProducts() {
    const { data, error } = await supabase.from('products').select('*').order('sku');
    if (error) setMessage({ type: 'error', text: 'โหลดสินค้าไม่สำเร็จ: ' + error.message });
    else setProducts(data);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const selected = products.find((p) => p.id === productId);
  const quantity = parseInt(qty, 10);
  const validQty = Number.isInteger(quantity) && quantity > 0;
  const total = selected && validQty ? Number(selected.price) * quantity : 0;

  async function handleSell() {
    if (!selected) return setMessage({ type: 'error', text: 'กรุณาเลือกสินค้า' });
    if (!validQty) return setMessage({ type: 'error', text: 'จำนวนต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป' });

    setBusy(true);
    setMessage(null);

    // 1) ดึงสต๊อกและราคาล่าสุดจากฐานข้อมูล (กันกรณีมีคนขายไปก่อนหน้านี้)
    const { data: fresh, error: readError } = await supabase
      .from('products')
      .select('name, price, stock')
      .eq('id', selected.id)
      .single();

    if (readError) {
      setBusy(false);
      return setMessage({ type: 'error', text: 'ตรวจสต๊อกไม่สำเร็จ: ' + readError.message });
    }
    if (fresh.stock < quantity) {
      setBusy(false);
      await loadProducts();
      return setMessage({ type: 'error', text: `สต๊อกไม่พอ — ${fresh.name} เหลือ ${fresh.stock}` });
    }

    // 2) บันทึกรายการขาย
    const saleTotal = Number(fresh.price) * quantity;
    const { error: saleError } = await supabase.from('sales').insert({
      product_id: selected.id,
      product_name: fresh.name,
      quantity,
      total_price: saleTotal,
      sold_at: new Date().toISOString(),
    });
    if (saleError) {
      setBusy(false);
      return setMessage({ type: 'error', text: 'บันทึกการขายไม่สำเร็จ: ' + saleError.message });
    }

    // 3) ตัดสต๊อก
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: fresh.stock - quantity })
      .eq('id', selected.id);
    if (stockError) {
      setBusy(false);
      return setMessage({ type: 'error', text: 'บันทึกการขายแล้ว แต่ตัดสต๊อกไม่สำเร็จ: ' + stockError.message });
    }

    // 4) แจ้งผลและรีเซ็ตฟอร์ม
    setMessage({
      type: 'ok',
      text: `ขายสำเร็จ: ${fresh.name} × ${quantity} รวม ${saleTotal.toLocaleString('th-TH')} บาท`,
    });
    setProductId('');
    setQty('1');
    setBusy(false);
    loadProducts();
  }

  return (
    <>
      <h1>ขายสินค้า</h1>

      {message && <div className={`msg ${message.type}`}>{message.text}</div>}

      <div className="panel">
        <div className="form-grid">
          <div style={{ gridColumn: 'span 2' }}>
            <label htmlFor="product">สินค้า</label>
            <select id="product" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">— เลือกสินค้า —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                  {p.name} — {Number(p.price).toLocaleString('th-TH')} บาท
                  {p.stock <= 0 ? ' (หมด)' : ` (เหลือ ${p.stock})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="qty">จำนวน</label>
            <input id="qty" type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
        </div>

        {/* ยอดรวม แสดงอัตโนมัติก่อนกดขาย */}
        <div className="total-box">
          <div className="muted">ยอดรวม</div>
          <div className="amount">{total.toLocaleString('th-TH')} บาท</div>
        </div>

        <button className="btn" onClick={handleSell} disabled={busy || !selected || !validQty}>
          {busy ? 'กำลังบันทึก...' : 'ขาย'}
        </button>
      </div>
    </>
  );
}
