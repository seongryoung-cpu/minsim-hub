import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-4xl font-bold text-foreground">404</p>
      <p className="text-base text-muted-foreground">찾는 화면이 없어요. 주소가 바뀌었거나 삭제되었을 수 있어요.</p>
      <button
        type="button"
        onClick={() => navigate('/', { replace: true })}
        className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-medium"
      >
        홈으로 가기
      </button>
    </div>
  );
};

export default NotFound;
