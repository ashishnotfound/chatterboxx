import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { ChatWindow } from '@/components/chat/ChatWindow';

export default function ChatPage() {
  const navigate = useNavigate();
  const { chatId } = useParams();

  if (!chatId) {
    navigate('/chat');
    return null;
  }

  return (
    <ResponsiveLayout>
      <AppLayout>
        <ChatWindow chatId={chatId} onBack={() => navigate(-1)} />
      </AppLayout>
    </ResponsiveLayout>
  );
}
