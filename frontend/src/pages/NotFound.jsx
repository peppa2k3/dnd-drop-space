import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Compass size={40} className="text-text-muted" strokeWidth={1.5} />
      <h1 className="font-display text-3xl font-semibold text-text-primary">Không tìm thấy trang</h1>
      <p className="max-w-sm text-sm text-text-secondary">Trang bạn tìm không tồn tại, hoặc đã được di chuyển.</p>
      <Button as={Link} to="/app">
        Về Bảng điều khiển
      </Button>
    </div>
  );
}
