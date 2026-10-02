'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function HistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSales() {
      // เรียงจากล่าสุดไปเก่าสุด
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('sold_at', { ascending: false });
      if (error) setError('โหลดประวัติไม่สำเร็จ: ' + error.message);
      else setSales(data);
      setLoading(false);
    }
    loadSales();
  }, []);

  // ยอดขายรวมทั้งหมด = ผลรวมของ total_price
  const grandTotal = sales.reduce((sum, s) => sum + Number(s.total_price), 0);

  function formatDate(iso) {
    return new Date(iso).toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Bangkok',
    });
  }

  return (
    <>
      <h1>ประวัติการขาย</h1>

      {error && <div className="msg error">{error}</div>}

      {loading ? (
        <p className="muted">กำลังโหลด...</p>
      ) : (
        <>
          <div className="summary">
            ยอดขายรวมทั้งหมด <strong>{grandTotal.toLocaleString('th-TH')}</strong> บาท
            <span className="muted"> ({sales.length} รายการ)</span>
          </div>

          {sales.length === 0 ? (
            <p className="muted">ยังไม่มีรายการขาย ลองขายสินค้าที่หน้า "ขายสินค้า" ดูได้เลย</p>
          ) : (
            <div className="table-wrap panel" style={{ padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>วันเวลาที่ขาย</th>
                    <th>ชื่อสินค้า</th>
                    <th className="num">จำนวน</th>
                    <th className="num">ยอดรวม (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id}>
                      <td>{formatDate(s.sold_at)}</td>
                      <td>{s.product_name}</td>
                      <td className="num">{s.quantity}</td>
                      <td className="num">{Number(s.total_price).toLocaleString('th-TH')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
