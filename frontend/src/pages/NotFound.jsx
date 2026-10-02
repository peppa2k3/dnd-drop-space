import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
      <Compass size={40} className="text-slate-light" strokeWidth={1.5} />
      <h1 className="font-display text-3xl font-semibold text-ink">Không tìm thấy trang</h1>
      <p className="max-w-sm text-sm text-slate">Trang bạn tìm không tồn tại, hoặc đã được di chuyển.</p>
      <Button as={Link} to="/app">
        Về Bảng điều khiển
      </Button>
    </div>
  );
}
