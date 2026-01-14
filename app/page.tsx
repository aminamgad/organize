import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-sm">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          نظام إدارة الميزات
        </h1>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          نظام شامل لإدارة وتنظيم الميزات الخاصة بالمشاريع مع إمكانية رفع الصور وتنظيم الميزات بشكل هرمي
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/projects">
            <Button size="lg">
              عرض المشاريع
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

