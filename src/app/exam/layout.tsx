export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-clinical-grid premium-gradient-bg">
      {children}
    </div>
  );
}
