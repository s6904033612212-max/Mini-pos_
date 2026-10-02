import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'Mini POS',
  description: 'ระบบขายของร้านเล็ก — Room Scent',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <span className="brand">Mini POS</span>
            <nav className="nav">
              <Link href="/">รายการสินค้า</Link>
              <Link href="/sell">ขายสินค้า</Link>
              <Link href="/history">ประวัติการขาย</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
