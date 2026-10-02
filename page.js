'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const emptyForm = { sku: '', name: '', price: '', stock: '', unit: 'ชิ้น' };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }
  const [form, setForm] = useState(emptyForm);   // ฟอร์มเพิ่มสินค้าใหม่
  const [editingId, setEditingId] = useState(null); // id ของแถวที่กำลังแก้ไข
  const [draft, setDraft] = useState(emptyForm);    // ค่าที่กำลังแก้ไขในแถวนั้น

  // ดึงรายการสินค้าทั้งหมด เรียงตาม SKU
  async function loadProducts() {
    const { data, error } = await supabase.from('products').select('*').order('sku');
    if (error) {
      setMessage({ type: 'error', text: 'โหลดสินค้าไม่สำเร็จ: ' + error.message });
    } else {
      setProducts(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // ตรวจค่าที่กรอก แล้วแปลงเป็นชนิดข้อมูลที่ตารางต้องการ
  function parseFields(f) {
    const price = Number(f.price);
    const stock = Number(f.stock);
    if (!f.sku.trim() || !f.name.trim()) return { error: 'กรุณากรอก SKU และชื่อสินค้า' };
    if (f.price === '' || Number.isNaN(price) || price < 0) return { error: 'ราคาต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป' };
    if (f.stock === '' || !Number.isInteger(stock) || stock < 0) return { error: 'จำนวนคงเหลือต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป' };
    return {
      value: {
        sku: f.sku.trim(),
        name: f.name.trim(),
        price,
        stock,
        unit: f.unit.trim() || 'ชิ้น',
      },
    };
  }

  // เพิ่มสินค้าใหม่
  async function addProduct(e) {
    e.preventDefault();
    const { value, error: msg } = parseFields(form);
    if (msg) return setMessage({ type: 'error', text: msg });

    const { error } = await supabase.from('products').insert(value);
    if (error) {
      const text = error.code === '23505' ? 'SKU นี้มีอยู่แล้ว กรุณาใช้ SKU อื่น' : 'เพิ่มสินค้าไม่สำเร็จ: ' + error.message;
      return setMessage({ type: 'error', text });
    }
    setForm(emptyForm);
    setMessage({ type: 'ok', text: 'เพิ่มสินค้าเรียบร้อย' });
    loadProducts();
  }

  // เริ่มแก้ไขแถวนั้น (inline)
  function startEdit(p) {
    setEditingId(p.id);
    setDraft({ sku: p.sku, name: p.name, price: String(p.price), stock: String(p.stock), unit: p.unit });
  }

  // บันทึกการแก้ไข
  async function saveEdit(id) {
    const { value, error: msg } = parseFields(draft);
    if (msg) return setMessage({ type: 'error', text: msg });

    const { error } = await supabase.from('products').update(value).eq('id', id);
    if (error) {
      const text = error.code === '23505' ? 'SKU นี้ซ้ำกับสินค้าอื่น' : 'บันทึกไม่สำเร็จ: ' + error.message;
      return setMessage({ type: 'error', text });
    }
    setEditingId(null);
    setMessage({ type: 'ok', text: 'บันทึกการแก้ไขเรียบร้อย' });
    loadProducts();
  }

  // ลบสินค้า
  async function deleteProduct(p) {
    if (!window.confirm(`ลบ "${p.name}" ใช่หรือไม่?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) {
      // 23503 = ถูกอ้างอิงจากตาราง sales (มีประวัติการขายแล้ว)
      const text = error.code === '23503'
        ? 'ลบไม่ได้ เพราะสินค้านี้มีประวัติการขายแล้ว (ถ้าไม่ขายแล้ว ให้แก้จำนวนคงเหลือเป็น 0 แทน)'
        : 'ลบไม่สำเร็จ: ' + error.message;
      return setMessage({ type: 'error', text });
    }
    setMessage({ type: 'ok', text: 'ลบสินค้าเรียบร้อย' });
    loadProducts();
  }

  return (
    <>
      <h1>รายการสินค้า</h1>

      {message && <div className={`msg ${message.type}`}>{message.text}</div>}

      {/* ฟอร์มเพิ่มสินค้าใหม่ */}
      <form className="panel" onSubmit={addProduct}>
        <div className="form-grid">
          <div>
            <label htmlFor="sku">SKU</label>
            <input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div>
            <label htmlFor="name">ชื่อสินค้า</label>
            <input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="price">ราคา (บาท)</label>
            <input id="price" type="number" min="0" step="any" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label htmlFor="stock">คงเหลือ</label>
            <input id="stock" type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div>
            <label htmlFor="unit">หน่วย</label>
            <input id="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <button className="btn" type="submit">เพิ่มสินค้า</button>
          </div>
        </div>
      </form>

      {/* ตารางสินค้า */}
      {loading ? (
        <p className="muted">กำลังโหลด...</p>
      ) : products.length === 0 ? (
        <p className="muted">ยังไม่มีสินค้า เพิ่มสินค้าชิ้นแรกจากฟอร์มด้านบนได้เลย</p>
      ) : (
        <div className="table-wrap panel" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>ชื่อสินค้า</th>
                <th className="num">ราคา</th>
                <th className="num">คงเหลือ</th>
                <th>หน่วย</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) =>
                editingId === p.id ? (
                  <tr key={p.id}>
                    <td><input value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} /></td>
                    <td><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></td>
                    <td><input type="number" min="0" step="any" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></td>
                    <td><input type="number" min="0" step="1" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} /></td>
                    <td><input value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} /></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn small" onClick={() => saveEdit(p.id)}>บันทึก</button>
                        <button className="btn small ghost" onClick={() => setEditingId(null)}>ยกเลิก</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id}>
                    <td>{p.sku}</td>
                    <td>{p.name}</td>
                    <td className="num">{Number(p.price).toLocaleString('th-TH')}</td>
                    <td className={`num ${p.stock <= 5 ? 'low-stock' : ''}`}>{p.stock}</td>
                    <td>{p.unit}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn small ghost" onClick={() => startEdit(p)}>แก้ไข</button>
                        <button className="btn small danger" onClick={() => deleteProduct(p)}>ลบ</button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
